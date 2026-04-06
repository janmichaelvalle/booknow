import type { Context } from "hono";
import { getAllPaymentMethods } from "../services/payment-method.service.js";
import { handleServiceResponse } from "../utils/service-response.js";


export async function getAllPaymentMethodsController(c: Context) {
   const business = c.get("business")
   const result = await getAllPaymentMethods(business.id)
   return handleServiceResponse(c, result)
}