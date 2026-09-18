import type { Context } from "hono"
import { getUnavailableDates } from "../services/availability.service.js"
import { handleServiceResponse } from "../utils/service-response.js"

export async function getAvailabilityController(c: Context) {
  const business = c.get("business")
  return handleServiceResponse(
    c,
    await getUnavailableDates(
      business.id,
      c.req.query("from") ?? "",
      c.req.query("to") ?? ""
    )
  )
}
