import type { Context } from "hono"
import { handleServiceResponse } from "../utils/service-response.js"
import {
  getMerchantAvailability,
  getMerchantDateEvents,
  removeDateCapacity,
  setDateCapacity,
  setDefaultDailyCapacity,
} from "../services/merchant-availability.service.js"

export async function getMerchantAvailabilityController(c: Context) {
  return handleServiceResponse(c, await getMerchantAvailability(
    c.get("merchant").businessId,
    c.req.query("from") ?? "",
    c.req.query("to") ?? ""
  ))
}

export async function getMerchantDateEventsController(c: Context) {
  return handleServiceResponse(c, await getMerchantDateEvents(
    c.get("merchant").businessId,
    c.req.param("date")!
  ))
}

export async function patchDefaultDailyCapacityController(c: Context) {
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== "object" || !("defaultDailyCapacity" in body)) {
    return c.json({ message: "defaultDailyCapacity is required" }, 400)
  }
  return handleServiceResponse(c, await setDefaultDailyCapacity(
    c.get("merchant").businessId, body.defaultDailyCapacity
  ))
}

export async function putDateCapacityController(c: Context) {
  const body = await c.req.json().catch(() => null)
  if (!body || typeof body !== "object" || !("capacity" in body)) {
    return c.json({ message: "capacity is required" }, 400)
  }
  return handleServiceResponse(c, await setDateCapacity(
    c.get("merchant").businessId,
    c.req.param("date")!,
    body.capacity
  ))
}

export async function deleteDateCapacityController(c: Context) {
  return handleServiceResponse(c, await removeDateCapacity(
    c.get("merchant").businessId,
    c.req.param("date")!
  ))
}
