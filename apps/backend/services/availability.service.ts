import { supabase } from "../lib/supabase.js"
import type { ServiceResponse } from "../lib/types.js"
import { isValidAvailabilityRange } from "../lib/date-range.js"

export async function getUnavailableDates(
  businessId: string,
  from: string,
  to: string
): Promise<ServiceResponse<{ unavailableDates: string[] }>> {
  if (!isValidAvailabilityRange(from, to)) {
    return { error: { message: "Provide a valid date range of at most 93 days", status: 400 } }
  }

  const { data, error } = await supabase.rpc("get_business_unavailable_dates", {
    p_business_id: businessId,
    p_from: from,
    p_to: to,
  })
  if (error) {
    return { error: { message: "Failed to fetch availability", details: error.message, status: 500 } }
  }

  return { data: { unavailableDates: (data ?? []).map((row: { unavailable_date: string }) => row.unavailable_date) } }
}
