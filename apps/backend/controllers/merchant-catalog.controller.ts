import type { Context } from "hono"
import { handleServiceResponse } from "../utils/service-response.js"
import {
  createInclusion, createPackage, createTier, createTierItem, duplicateTier,
  getMerchantCatalog, updateInclusion, updatePackage, updateTier, updateTierItem,
} from "../services/merchant-catalog.service.js"
import type { TierItemType } from "../lib/types.js"

type Body = Record<string, unknown>
const itemTypes = new Set<TierItemType>(["inclusion", "freebie", "extra", "upgrade"])

async function body(c: Context): Promise<Body | null> {
  const value = await c.req.json().catch(() => null)
  return value && typeof value === "object" && !Array.isArray(value) ? value as Body : null
}
const text = (value: unknown) => typeof value === "string" && value.trim() ? value.trim() : null
const optionalText = (value: unknown) => value == null || value === "" ? null : typeof value === "string" ? value.trim() || null : undefined
const active = (value: unknown) => typeof value === "boolean" ? value : undefined
const money = (value: unknown) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null
const positiveInteger = (value: unknown) => typeof value === "number" && Number.isSafeInteger(value) && value > 0 ? value : null

function packageInput(value: Body | null) {
  if (!value) return null
  const name = text(value.name), description = optionalText(value.description), isActive = active(value.isActive)
  return name && description !== undefined && isActive !== undefined ? { name, description, isActive } : null
}

function inclusionInput(value: Body | null) {
  if (!value) return null
  const name = text(value.name), description = optionalText(value.description), isActive = active(value.isActive)
  const quantity = value.quantity == null ? null : positiveInteger(value.quantity)
  const unit = optionalText(value.unit)
  if (!name || description === undefined || isActive === undefined || unit === undefined) return null
  if ((quantity === null) !== (unit === null)) return null
  return { name, description, isActive, quantity, unit }
}

function tierInput(value: Body | null) {
  if (!value) return null
  const name = text(value.name), price = money(value.price), isActive = active(value.isActive)
  return name && price !== null && isActive !== undefined ? { name, price, isActive } : null
}

function tierItemInput(value: Body | null) {
  if (!value || typeof value.itemType !== "string" || !itemTypes.has(value.itemType as TierItemType)) return null
  const itemType = value.itemType as TierItemType
  const name = text(value.name), description = optionalText(value.description), unit = optionalText(value.unit), isActive = active(value.isActive)
  if (!name || description === undefined || unit === undefined || isActive === undefined) return null
  if (itemType === "inclusion" || itemType === "freebie") {
    const quantity = value.quantity == null ? null : positiveInteger(value.quantity)
    if ((quantity === null) !== (unit === null)) return null
    return { itemType, name, description, quantity, unit, price: 0, isActive }
  }
  const price = money(value.price)
  if (price === null) return null
  return { itemType, name, description, quantity: null, unit, price, isActive }
}

const invalid = (c: Context, message: string) => c.json({ message }, 400)

export async function getMerchantCatalogController(c: Context) {
  return handleServiceResponse(c, await getMerchantCatalog(c.get("merchant").businessId))
}
export async function createPackageController(c: Context) {
  const input = packageInput(await body(c));
  return input ? handleServiceResponse(c, await createPackage(c.get("merchant").businessId, input)) : invalid(c, "Valid name, description, and status are required")
}
export async function updatePackageController(c: Context) {
  const input = packageInput(await body(c));
  return input ? handleServiceResponse(c, await updatePackage(c.get("merchant").businessId, c.req.param("packageId")!, input)) : invalid(c, "Valid name, description, and status are required")
}
export async function createInclusionController(c: Context) {
  const input = inclusionInput(await body(c));
  return input ? handleServiceResponse(c, await createInclusion(c.get("merchant").businessId, c.req.param("packageId")!, input)) : invalid(c, "Provide a name and either both quantity and unit, or neither")
}
export async function updateInclusionController(c: Context) {
  const input = inclusionInput(await body(c));
  return input ? handleServiceResponse(c, await updateInclusion(c.get("merchant").businessId, c.req.param("packageId")!, c.req.param("inclusionId")!, input)) : invalid(c, "Provide a name and either both quantity and unit, or neither")
}
export async function createTierController(c: Context) {
  const input = tierInput(await body(c));
  return input ? handleServiceResponse(c, await createTier(c.get("merchant").businessId, c.req.param("packageId")!, input)) : invalid(c, "Valid tier name, fixed price, and status are required")
}
export async function updateTierController(c: Context) {
  const input = tierInput(await body(c));
  return input ? handleServiceResponse(c, await updateTier(c.get("merchant").businessId, c.req.param("packageId")!, c.req.param("tierId")!, input)) : invalid(c, "Valid tier name, fixed price, and status are required")
}
export async function duplicateTierController(c: Context) {
  return handleServiceResponse(c, await duplicateTier(c.get("merchant").businessId, c.req.param("packageId")!, c.req.param("tierId")!))
}
export async function createTierItemController(c: Context) {
  const input = tierItemInput(await body(c));
  return input ? handleServiceResponse(c, await createTierItem(c.get("merchant").businessId, c.req.param("packageId")!, c.req.param("tierId")!, input)) : invalid(c, "Invalid tier item")
}
export async function updateTierItemController(c: Context) {
  const input = tierItemInput(await body(c));
  return input ? handleServiceResponse(c, await updateTierItem(c.get("merchant").businessId, c.req.param("packageId")!, c.req.param("tierId")!, c.req.param("itemId")!, input)) : invalid(c, "Invalid tier item")
}
