import { supabase } from "../lib/supabase.js"
import { isValidAvailabilityRange, parseDateOnly } from "../lib/date-range.js"
import type { ServiceResponse } from "../lib/types.js"

export type MerchantAvailabilityDate = {
  date: string
  overrideCapacity: number | null
  effectiveCapacity: number | null
  usedCapacity: number
}

export type MerchantAvailability = {
  defaultDailyCapacity: number | null
  dates: MerchantAvailabilityDate[]
}

export type MerchantDateEvent = {
  quotationReference: string
  status: "accepted" | "booked"
  customerName: string
  packageNames: string[]
  grandTotal: number
}

export function isCapacity(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0
}

export function isEditableDate(value: string, today = todayInManila()): boolean {
  return parseDateOnly(value) !== null && value >= today
}

function todayInManila(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}

async function readDefaultCapacity(businessId: string) {
  return supabase.from("businesses")
    .select("default_daily_capacity")
    .eq("id", businessId)
    .single()
}

export async function getMerchantAvailability(
  businessId: string, from: string, to: string
): Promise<ServiceResponse<MerchantAvailability>> {
  if (!isValidAvailabilityRange(from, to)) {
    return { error: { message: "Provide a valid date range of at most 93 days", status: 400 } }
  }

  const [businessResult, overridesResult] = await Promise.all([
    readDefaultCapacity(businessId),
    supabase.from("business_capacity_overrides")
      .select("event_date, capacity")
      .eq("business_id", businessId)
      .gte("event_date", from)
      .lte("event_date", to),
  ])
  if (businessResult.error || overridesResult.error || !businessResult.data) {
    return { error: { message: "Failed to fetch merchant availability", status: 500 } }
  }

  // Page through rows so PostgREST's row limit cannot undercount busy dates.
  const usage = new Map<string, number>()
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const result = await supabase.from("quotations")
      .select("event_date")
      .eq("business_id", businessId)
      .in("quotation_status", ["accepted", "booked"])
      .gte("event_date", from)
      .lte("event_date", to)
      .order("event_date", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1)
    if (result.error) {
      return { error: { message: "Failed to fetch used capacity", status: 500 } }
    }
    for (const row of result.data ?? []) {
      usage.set(row.event_date, (usage.get(row.event_date) ?? 0) + 1)
    }
    if ((result.data?.length ?? 0) < pageSize) break
  }

  const overrides = new Map(
    (overridesResult.data ?? []).map((row) => [row.event_date, row.capacity])
  )
  const defaultDailyCapacity = businessResult.data.default_daily_capacity as number | null
  const dates: MerchantAvailabilityDate[] = []
  const end = parseDateOnly(to)!
  for (let day = parseDateOnly(from)!; day <= end; day += 86_400_000) {
    const date = new Date(day).toISOString().slice(0, 10)
    const overrideCapacity = overrides.get(date) ?? null
    dates.push({
      date,
      overrideCapacity,
      effectiveCapacity: overrideCapacity ?? defaultDailyCapacity,
      usedCapacity: usage.get(date) ?? 0,
    })
  }
  return { data: { defaultDailyCapacity, dates } }
}

export async function getMerchantDateEvents(
  businessId: string, date: string
): Promise<ServiceResponse<MerchantDateEvent[]>> {
  if (parseDateOnly(date) === null) {
    return { error: { message: "Provide a valid event date", status: 400 } }
  }

  const events: MerchantDateEvent[] = []
  const pageSize = 1000
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from("quotations")
      .select(`
        id, quotation_reference, quotation_status, customer_name, grand_total,
        quotation_packages ( package_name, sort_order )
      `)
      .eq("business_id", businessId)
      .eq("event_date", date)
      .in("quotation_status", ["accepted", "booked"])
      .order("start_time", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + pageSize - 1)

    if (error) {
      return { error: { message: "Failed to fetch events for this date", status: 500 } }
    }
    for (const row of data ?? []) {
      events.push({
        quotationReference: row.quotation_reference,
        status: row.quotation_status as MerchantDateEvent["status"],
        customerName: row.customer_name,
        packageNames: [...(row.quotation_packages ?? [])]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((pkg) => pkg.package_name),
        grandTotal: Number(row.grand_total),
      })
    }
    if ((data?.length ?? 0) < pageSize) break
  }

  return { data: events }
}

export async function setDefaultDailyCapacity(
  businessId: string, capacity: unknown
): Promise<ServiceResponse<{ defaultDailyCapacity: number | null }>> {
  if (capacity !== null && !isCapacity(capacity)) {
    return { error: { message: "Daily capacity must be a non-negative integer or unlimited", status: 400 } }
  }
  // Updating the business row takes the same row lock as quotation acceptance.
  const { data, error } = await supabase.from("businesses")
    .update({ default_daily_capacity: capacity })
    .eq("id", businessId)
    .select("default_daily_capacity")
    .single()
  if (error || !data) {
    return { error: { message: "Failed to update daily capacity", status: 500 } }
  }
  return { data: { defaultDailyCapacity: data.default_daily_capacity } }
}

export async function setDateCapacity(
  businessId: string, date: string, capacity: unknown
): Promise<ServiceResponse<{ date: string; overrideCapacity: number }>> {
  if (!isEditableDate(date)) {
    return { error: { message: "Choose today or a future date", status: 400 } }
  }
  if (!isCapacity(capacity)) {
    return { error: { message: "Date capacity must be a non-negative integer", status: 400 } }
  }
  // The existing override trigger locks the business row before the write.
  const { error } = await supabase.from("business_capacity_overrides")
    .upsert(
      { business_id: businessId, event_date: date, capacity },
      { onConflict: "business_id,event_date" }
    )
  if (error) {
    return { error: { message: "Failed to update date capacity", status: 500 } }
  }
  return { data: { date, overrideCapacity: capacity } }
}

export async function removeDateCapacity(
  businessId: string, date: string
): Promise<ServiceResponse<{ date: string; overrideCapacity: null }>> {
  if (!isEditableDate(date)) {
    return { error: { message: "Choose today or a future date", status: 400 } }
  }
  const { error } = await supabase.from("business_capacity_overrides")
    .delete()
    .eq("business_id", businessId)
    .eq("event_date", date)
  if (error) {
    return { error: { message: "Failed to remove date capacity", status: 500 } }
  }
  return { data: { date, overrideCapacity: null } }
}
