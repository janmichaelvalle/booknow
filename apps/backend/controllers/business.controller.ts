import type { Context } from "hono";
import { handleServiceResponse } from "../utils/service-response.js";
import { getAllOfferings } from "../services/business.service.js";

export async function getAllOfferingsController(c: Context) {
  const business = c.get("business")
  const result = await getAllOfferings(business.id)
  return handleServiceResponse(c, result)

}
