import type { Context } from "hono"
import type {
  QuotationFormBody,
  UpdateQuotationStatusBody,
} from "../lib/types.js"
import {
  createQuotation,
  getQuotationByReference,
  getQuotationsByBusiness,
  updateQuotation,
  updateQuotationStatus,
} from "../services/quotation.service.js"
import { handleServiceResponse } from "../utils/service-response.js"

export async function getAllQuotationsController(c: Context) {
  const business = c.get("business")
  return handleServiceResponse(c, await getQuotationsByBusiness(business.id))
}

export async function getQuotationController(c: Context) {
  const business = c.get("business")
  const reference = c.req.param("quotationReference")!
  return handleServiceResponse(
    c,
    await getQuotationByReference(business.id, reference)
  )
}

export async function getMerchantQuotationController(c: Context) {
  const merchant = c.get("merchant")
  const reference = c.req.param("quotationReference")!
  return handleServiceResponse(
    c,
    await getQuotationByReference(merchant.businessId, reference)
  )
}

export async function createQuotationController(c: Context) {
  const business = c.get("business")
  const body = await c.req.json<QuotationFormBody>()
  return handleServiceResponse(c, await createQuotation(business.id, body))
}

export async function updateQuotationController(c: Context) {
  const business = c.get("business")
  const reference = c.req.param("quotationReference")!
  const body = await c.req.json<QuotationFormBody>()
  return handleServiceResponse(
    c,
    await updateQuotation(business.id, reference, body)
  )
}

export async function updateQuotationStatusController(c: Context) {
  const business = c.get("business")
  const reference = c.req.param("quotationReference")!
  const body = await c.req.json<UpdateQuotationStatusBody>()
  return handleServiceResponse(
    c,
    await updateQuotationStatus(business.id, reference, body)
  )
}
