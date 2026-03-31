import type { Context } from "hono";
import { getAllPaymentMethods } from "../services/payment-method.service.js";
import { handleServiceResponse } from "../utils/service-response.js";


export async function getAllPaymentMethodsController(c: Context) {
    const businessSlug = c.req.param("businessSlug")
    const result = await getAllPaymentMethods(businessSlug)
    return handleServiceResponse(c, result)
}