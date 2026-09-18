import { merchantFetch } from "@/lib/merchant-api"

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

async function readResult<T>(response: Response): Promise<T> {
  const body = await response.json().catch(() => ({})) as { data?: T; message?: string }
  if (!response.ok || body.data === undefined) {
    throw new Error(body.message ?? "Availability request failed")
  }
  return body.data
}

export async function getMerchantAvailability(from: string, to: string) {
  const params = new URLSearchParams({ from, to })
  return readResult<MerchantAvailability>(
    await merchantFetch(`/api/merchant/availability?${params}`)
  )
}

export async function getMerchantDateEvents(date: string) {
  return readResult<MerchantDateEvent[]>(
    await merchantFetch(`/api/merchant/availability/dates/${encodeURIComponent(date)}/events`)
  )
}

export async function saveDefaultDailyCapacity(capacity: number | null) {
  return readResult<{ defaultDailyCapacity: number | null }>(
    await merchantFetch("/api/merchant/availability/default", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultDailyCapacity: capacity }),
    })
  )
}

export async function saveDateCapacity(date: string, capacity: number | null) {
  const path = `/api/merchant/availability/dates/${encodeURIComponent(date)}`
  return readResult<{ date: string; overrideCapacity: number | null }>(
    await merchantFetch(path, capacity === null
      ? { method: "DELETE" }
      : {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ capacity }),
        })
  )
}
