import assert from "node:assert/strict"
import { test } from "node:test"
import { createClient } from "@supabase/supabase-js"

const url = process.env.CATALOG_TEST_SUPABASE_URL
const key = process.env.CATALOG_TEST_SERVICE_ROLE_KEY
const enabled = process.env.CATALOG_TEST_DATABASE === "disposable" && !!url && !!key

test("catalog ordering, nullable display quantities, and selective snapshot refresh", { skip: !enabled }, async () => {
  const db = createClient(url!, key!)
  const slug = `catalog-test-${crypto.randomUUID()}`
  const eventDate = new Date(Date.now() + 45 * 86_400_000).toISOString().slice(0, 10)
  const { data: business, error: businessError } = await db
    .from("businesses")
    .insert({ name: "Catalog integration test", slug })
    .select("id")
    .single()
  assert.ifError(businessError)
  assert.ok(business)

  try {
    const { data: region, error: regionError } = await db
      .from("service_areas")
      .select("id")
      .eq("area_type", "region")
      .eq("normalized_name", "metro manila")
      .single()
    assert.ifError(regionError)
    assert.ok(region)
    assert.ifError((await db.from("business_service_areas").insert({
      business_id: business.id,
      service_area_id: region.id,
    })).error)

    const { data: packages, error: packagesError } = await db
      .from("business_packages")
      .insert([
        { business_id: business.id, name: "Package A", sort_order: 2 },
        { business_id: business.id, name: "Package B", sort_order: 1 },
        { business_id: business.id, name: "No active tier", sort_order: 3 },
        { business_id: business.id, name: "Hidden package", sort_order: 0, is_active: false },
      ])
      .select("id, name")
    assert.ifError(packagesError)
    const packageByName = new Map(packages!.map((pkg) => [pkg.name, pkg.id]))
    const packageA = packageByName.get("Package A")!
    const packageB = packageByName.get("Package B")!
    const hiddenPackage = packageByName.get("Hidden package")!

    const { data: tiers, error: tiersError } = await db
      .from("business_package_tiers")
      .insert([
        { package_id: packageA, name: "A original", price: 100, sort_order: 1 },
        { package_id: packageA, name: "A alternate", price: 300, sort_order: 2 },
        { package_id: packageA, name: "A hidden", price: 1, sort_order: 3, is_active: false },
        { package_id: packageB, name: "B original", price: 200, sort_order: 1 },
        { package_id: packageB, name: "B alternate", price: 250, sort_order: 2 },
        { package_id: hiddenPackage, name: "Hidden tier", price: 1, sort_order: 1 },
      ])
      .select("id, name")
    assert.ifError(tiersError)
    const tierByName = new Map(tiers!.map((tier) => [tier.name, tier.id]))
    const aOriginal = tierByName.get("A original")!
    const aAlternate = tierByName.get("A alternate")!
    const bOriginal = tierByName.get("B original")!
    const bAlternate = tierByName.get("B alternate")!

    const { data: inclusionRows, error: inclusionError } = await db.from("business_package_inclusions").insert([
      { package_id: packageA, name: "Bar setup", quantity: null, unit: null, sort_order: 1 },
      { package_id: packageA, name: "Bartenders", quantity: 2, unit: "people", sort_order: 2 },
    ]).select("id, name")
    assert.ifError(inclusionError)
    const barSetupId = inclusionRows!.find((item) => item.name === "Bar setup")!.id

    const mismatchedInclusion = await db.from("business_package_inclusions").insert({
      package_id: packageA,
      name: "Invalid paired metadata",
      quantity: 1,
      unit: null,
    })
    assert.ok(mismatchedInclusion.error)

    const { data: tierItems, error: tierItemsError } = await db
      .from("business_package_tier_items")
      .insert([
        {
          package_tier_id: aOriginal,
          item_type: "extra",
          name: "Beer",
          quantity: null,
          unit: "case",
          price: 20,
          sort_order: 1,
        },
        {
          package_tier_id: aOriginal,
          item_type: "extra",
          name: "Hidden extra",
          quantity: null,
          unit: null,
          price: 5,
          sort_order: 2,
          is_active: false,
        },
      ])
      .select("id, name")
    assert.ifError(tierItemsError)
    const beerId = tierItems!.find((item) => item.name === "Beer")!.id

    process.env.SUPABASE_URL = url
    process.env.SUPABASE_SERVICE_ROLE_KEY = key
    process.env.CORS_ORIGIN ??= "http://localhost:5173"
    const { getAllOfferings } = await import("../services/business.service.js")
    const catalogService = await import("../services/merchant-catalog.service.js")
    const offerings = await getAllOfferings(business.id)
    assert.ok("data" in offerings)
    if (!("data" in offerings)) throw new Error("Expected offerings data")
    const offeringsData = offerings.data
    assert.ok(offeringsData)
    assert.deepEqual(offeringsData.packages.map((pkg) => pkg.name), ["Package B", "Package A"])
    assert.equal(offeringsData.packageTiers.some((tier) => tier.name === "A hidden"), false)
    assert.equal(offeringsData.packageTierItems.some((item) => item.name === "Hidden extra"), false)
    assert.equal(offeringsData.packageInclusions.find((item) => item.name === "Bar setup")?.quantity, null)

    assert.ok("error" in await catalogService.updateTier(business.id, packageB, aOriginal, { name: "No", price: 1, isActive: true }))
    assert.ok("error" in await catalogService.updateInclusion(business.id, packageB, barSetupId, { name: "No", quantity: null, unit: null, description: null, isActive: true }))
    assert.ok("error" in await catalogService.updateTierItem(business.id, packageB, bOriginal, beerId, { itemType: "extra", name: "No", quantity: null, unit: null, description: null, price: 1, isActive: true }))

    const firstCopy = await catalogService.duplicateTier(business.id, packageA, aOriginal)
    const secondCopy = await catalogService.duplicateTier(business.id, packageA, aOriginal)
    assert.ok("data" in firstCopy && "data" in secondCopy)
    if (!("data" in firstCopy) || !("data" in secondCopy)) throw new Error("Expected duplicated tiers")
    const copiedTiers = await db.from("business_package_tiers").select("id, name, is_active").in("id", [firstCopy.data.id, secondCopy.data.id]).order("name")
    assert.ifError(copiedTiers.error)
    assert.deepEqual(copiedTiers.data?.map((copy) => copy.name), ["A original (Copy 2)", "A original (Copy)"])
    assert.equal(copiedTiers.data?.every((copy) => !copy.is_active), true)
    const copiedItems = await db.from("business_package_tier_items").select("id").eq("package_tier_id", firstCopy.data.id)
    assert.ifError(copiedItems.error)
    assert.equal(copiedItems.data?.length, 2)

    const basePayload = {
      eventDate,
      startTime: "12:00",
      endTime: "16:00",
      venue: "Test venue",
      venueLocality: "Pasay",
      venueRegion: "Metro Manila",
      occasion: "test",
      guestCount: 10,
      customerName: "Original customer",
      customerEmail: "catalog@example.invalid",
      customerPhone: "0000000000",
      packages: [
        {
          packageId: packageA,
          tierId: aOriginal,
          selectedItems: [{ tierItemId: beerId, quantity: 3 }],
        },
        { packageId: packageB, tierId: bOriginal, selectedItems: [] },
      ],
    }
    const created = await db.rpc("save_quotation", {
      p_business_id: business.id,
      p_payload: basePayload,
      p_quotation_id: null,
    })
    assert.ifError(created.error)
    const quotationId = created.data?.[0]?.quotation_id as string
    assert.ok(quotationId)

    const readSnapshots = async () => {
      const result = await db
        .from("quotation_packages")
        .select("id, package_id, package_tier_id, price, package_total, selected_items_total, total")
        .eq("quotation_id", quotationId)
      assert.ifError(result.error)
      return new Map(result.data!.map((snapshot) => [snapshot.package_id, snapshot]))
    }

    const originalSnapshots = await readSnapshots()
    const originalA = originalSnapshots.get(packageA)!
    const originalB = originalSnapshots.get(packageB)!
    assert.equal(Number(originalA.package_total), 100)
    assert.equal(Number(originalA.selected_items_total), 60)
    assert.equal(Number(originalA.total), 160)

    assert.ifError((await db.from("business_package_tiers")
      .update({ price: 130, is_active: false }).eq("id", aOriginal)).error)
    assert.ifError((await db.from("business_package_tier_items")
      .update({ is_active: false }).eq("id", beerId)).error)
    assert.ifError((await db.from("business_packages")
      .update({ is_active: false }).eq("id", packageA)).error)

    const unrelatedEdit = await db.rpc("save_quotation", {
      p_business_id: business.id,
      p_payload: { ...basePayload, customerName: "Updated customer", venue: "Updated venue" },
      p_quotation_id: quotationId,
    })
    assert.ifError(unrelatedEdit.error)
    const afterUnrelatedEdit = await readSnapshots()
    assert.equal(afterUnrelatedEdit.get(packageA)!.id, originalA.id)
    assert.equal(Number(afterUnrelatedEdit.get(packageA)!.total), 160)
    assert.equal(afterUnrelatedEdit.get(packageB)!.id, originalB.id)

    const changedBPayload = {
      ...basePayload,
      packages: [
        basePayload.packages[0],
        { packageId: packageB, tierId: bAlternate, selectedItems: [] },
      ],
    }
    assert.ifError((await db.rpc("save_quotation", {
      p_business_id: business.id,
      p_payload: changedBPayload,
      p_quotation_id: quotationId,
    })).error)
    const afterBChange = await readSnapshots()
    assert.equal(afterBChange.get(packageA)!.id, originalA.id)
    assert.equal(Number(afterBChange.get(packageA)!.total), 160)
    assert.notEqual(afterBChange.get(packageB)!.id, originalB.id)
    assert.equal(Number(afterBChange.get(packageB)!.package_total), 250)

    assert.ifError((await db.from("business_packages")
      .update({ is_active: true }).eq("id", packageA)).error)
    const changedAPayload = {
      ...basePayload,
      packages: [
        { packageId: packageA, tierId: aAlternate, selectedItems: [] },
        changedBPayload.packages[1],
      ],
    }
    assert.ifError((await db.rpc("save_quotation", {
      p_business_id: business.id,
      p_payload: changedAPayload,
      p_quotation_id: quotationId,
    })).error)
    const afterAChange = await readSnapshots()
    assert.notEqual(afterAChange.get(packageA)!.id, originalA.id)
    assert.equal(Number(afterAChange.get(packageA)!.package_total), 300)
    assert.equal(afterAChange.get(packageB)!.id, afterBChange.get(packageB)!.id)

    assert.ifError((await db.rpc("set_quotation_status", {
      p_business_id: business.id,
      p_quotation_reference: created.data?.[0]?.quotation_reference,
      p_status: "accepted",
    })).error)
    const acceptedSnapshot = afterAChange.get(packageA)!
    assert.ifError((await db.from("business_package_tiers")
      .update({ price: 999 }).eq("id", aAlternate)).error)
    const rejectedHistoricalEdit = await db.rpc("save_quotation", {
      p_business_id: business.id,
      p_payload: changedAPayload,
      p_quotation_id: quotationId,
    })
    assert.match(rejectedHistoricalEdit.error?.message ?? "", /Only open quotations can be edited/)
    assert.equal((await readSnapshots()).get(packageA)!.id, acceptedSnapshot.id)

    assert.ifError((await db.rpc("set_quotation_status", {
      p_business_id: business.id,
      p_quotation_reference: created.data?.[0]?.quotation_reference,
      p_status: "booked",
    })).error)
    assert.equal((await readSnapshots()).get(packageA)!.id, acceptedSnapshot.id)
    assert.ifError((await db.rpc("set_quotation_status", {
      p_business_id: business.id,
      p_quotation_reference: created.data?.[0]?.quotation_reference,
      p_status: "closed",
      p_close_reason: "other",
      p_close_reason_notes: "Catalog integration test",
    })).error)
    assert.equal((await readSnapshots()).get(packageA)!.id, acceptedSnapshot.id)
  } finally {
    const { error } = await db.from("businesses").delete().eq("id", business.id)
    assert.ifError(error)
  }
})
