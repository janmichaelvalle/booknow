import assert from "node:assert/strict"
import { test } from "node:test"
import { createClient } from "@supabase/supabase-js"

const url = process.env.AVAILABILITY_TEST_SUPABASE_URL
const key = process.env.AVAILABILITY_TEST_SERVICE_ROLE_KEY
const enabled = process.env.AVAILABILITY_TEST_DATABASE === "disposable" && !!url && !!key

test("simultaneous accepts reserve only one capacity slot", { skip: !enabled }, async () => {
  const db = createClient(url!, key!)
  const slug = `capacity-test-${crypto.randomUUID()}`
  const eventDate = new Date(Date.now() + 30 * 86_400_000).toISOString().slice(0, 10)
  const { data: business, error: businessError } = await db
    .from("businesses")
    .insert({ name: "Capacity integration test", slug, default_daily_capacity: 1 })
    .select("id")
    .single()
  assert.ifError(businessError)
  assert.ok(business)

  try {
    const { data: quotations, error: quotationError } = await db
      .from("quotations")
      .insert([1, 2].map((number) => ({
        business_id: business.id,
        customer_name: `Test customer ${number}`,
        customer_email: `test${number}@example.invalid`,
        customer_phone: "0000000000",
        event_date: eventDate,
        start_time: "12:00",
        end_time: "16:00",
        venue: "Test venue",
        venue_locality: "Pasay",
        venue_region: "Metro Manila",
        occasion: "test",
        guest_count: 1,
      })))
      .select("quotation_reference")
    assert.ifError(quotationError)
    assert.equal(quotations?.length, 2)

    const attempts = await Promise.all(quotations!.map((quotation) =>
      db.rpc("set_quotation_status", {
        p_business_id: business.id,
        p_quotation_reference: quotation.quotation_reference,
        p_status: "accepted",
      })
    ))
    assert.equal(attempts.filter((attempt) => !attempt.error).length, 1)
    assert.equal(attempts.filter((attempt) => attempt.error?.message.includes("EVENT_DATE_UNAVAILABLE")).length, 1)

    const { data: saved, error: readError } = await db
      .from("quotations")
      .select("id, quotation_reference, quotation_status")
      .eq("business_id", business.id)
    assert.ifError(readError)
    assert.equal(saved?.filter((quotation) => quotation.quotation_status === "accepted").length, 1)

    const winner = saved!.find((quotation) => quotation.quotation_status === "accepted")!
    const loser = saved!.find((quotation) => quotation.quotation_status === "open")!

    const { data: region, error: regionError } = await db.from("service_areas")
      .select("id").eq("area_type", "region").eq("normalized_name", "metro manila").single()
    assert.ifError(regionError)
    assert.ifError((await db.from("business_service_areas").insert({
      business_id: business.id, service_area_id: region!.id,
    })).error)
    const { data: pkg, error: packageError } = await db.from("business_packages")
      .insert({ business_id: business.id, name: "Test package" }).select("id").single()
    assert.ifError(packageError)
    const { data: tier, error: tierError } = await db.from("business_package_tiers")
      .insert({ package_id: pkg!.id, name: "Test tier", price: 100 }).select("id").single()
    assert.ifError(tierError)
    const payload = {
      eventDate,
      startTime: "12:00",
      endTime: "16:00",
      venue: "Test venue",
      venueLocality: "Pasay",
      venueRegion: "Metro Manila",
      occasion: "test",
      guestCount: 1,
      customerName: "Test customer",
      customerEmail: "test@example.invalid",
      customerPhone: "0000000000",
      packages: [{ packageId: pkg!.id, tierId: tier!.id, selectedItems: [] }],
    }
    const blockedCreation = await db.rpc("save_quotation", {
      p_business_id: business.id, p_payload: payload, p_quotation_id: null,
    })
    assert.match(blockedCreation.error?.message ?? "", /EVENT_DATE_UNAVAILABLE/)
    assert.ifError((await db.rpc("save_quotation", {
      p_business_id: business.id, p_payload: payload, p_quotation_id: loser.id,
    })).error)

    const blockedDate = new Date(Date.now() + 31 * 86_400_000).toISOString().slice(0, 10)
    assert.ifError((await db.from("business_capacity_overrides").insert({
      business_id: business.id, event_date: blockedDate, capacity: 0,
    })).error)
    const blockedMove = await db.rpc("save_quotation", {
      p_business_id: business.id,
      p_payload: { ...payload, eventDate: blockedDate },
      p_quotation_id: loser.id,
    })
    assert.match(blockedMove.error?.message ?? "", /EVENT_DATE_UNAVAILABLE/)

    assert.ifError((await db.rpc("set_quotation_status", {
      p_business_id: business.id,
      p_quotation_reference: winner.quotation_reference,
      p_status: "booked",
    })).error)
    assert.equal((await db.rpc("is_business_date_available", {
      p_business_id: business.id, p_event_date: eventDate,
    })).data, false)
    assert.ifError((await db.rpc("set_quotation_status", {
      p_business_id: business.id,
      p_quotation_reference: winner.quotation_reference,
      p_status: "closed",
      p_close_reason: "other",
      p_close_reason_notes: "Integration test",
    })).error)
    assert.match((await db.rpc("set_quotation_status", {
      p_business_id: business.id,
      p_quotation_reference: winner.quotation_reference,
      p_status: "accepted",
    })).error?.message ?? "", /INVALID_STATUS_TRANSITION/)
    assert.ifError((await db.rpc("set_quotation_status", {
      p_business_id: business.id,
      p_quotation_reference: loser.quotation_reference,
      p_status: "accepted",
    })).error)

    assert.equal((await db.rpc("is_business_date_available", {
      p_business_id: business.id, p_event_date: blockedDate,
    })).data, false)
    assert.ifError((await db.from("business_capacity_overrides")
      .delete().eq("business_id", business.id).eq("event_date", blockedDate)).error)
    assert.equal((await db.rpc("is_business_date_available", {
      p_business_id: business.id, p_event_date: blockedDate,
    })).data, true)

    assert.ifError((await db.from("businesses")
      .update({ default_daily_capacity: 0 }).eq("id", business.id)).error)
    assert.equal((await db.from("quotations")
      .select("id").eq("business_id", business.id).eq("quotation_status", "accepted")).data?.length, 1)
    assert.equal((await db.rpc("is_business_date_available", {
      p_business_id: business.id, p_event_date: blockedDate,
    })).data, false)
    assert.ifError((await db.from("businesses")
      .update({ default_daily_capacity: null }).eq("id", business.id)).error)
    assert.equal((await db.rpc("is_business_date_available", {
      p_business_id: business.id, p_event_date: blockedDate,
    })).data, true)
  } finally {
    const { error } = await db.from("businesses").delete().eq("id", business.id)
    assert.ifError(error)
  }
})
