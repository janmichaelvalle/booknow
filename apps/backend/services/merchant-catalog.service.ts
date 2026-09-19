import { supabase } from "../lib/supabase.js"
import type { ServiceResponse, TierItemType } from "../lib/types.js"

type PackageInput = { name: string; description: string | null; isActive: boolean }
type InclusionInput = { name: string; quantity: number | null; unit: string | null; description: string | null; isActive: boolean }
type TierInput = { name: string; price: number; isActive: boolean }
type TierItemInput = InclusionInput & { itemType: TierItemType; price: number }

const failure = (message: string, details: string, status: 400 | 404 | 409 | 500 = 500) => ({ error: { message, details, status } } as const)
const statusFor = (code?: string) => code === "23505" ? 409 as const : 500 as const

async function ownedPackage(businessId: string, packageId: string) {
  return supabase.from("business_packages").select("id").eq("id", packageId).eq("business_id", businessId).maybeSingle()
}

async function ownedTier(businessId: string, packageId: string, tierId: string) {
  const pkg = await ownedPackage(businessId, packageId)
  if (pkg.error || !pkg.data) return { error: pkg.error, data: null }
  return supabase.from("business_package_tiers").select("id").eq("id", tierId).eq("package_id", packageId).maybeSingle()
}

async function nextSort(table: string, column: string, parentId: string) {
  const { data } = await supabase.from(table).select("sort_order").eq(column, parentId).order("sort_order", { ascending: false }).limit(1)
  return (data?.[0]?.sort_order ?? 0) + 1
}

export async function getMerchantCatalog(businessId: string): Promise<ServiceResponse<unknown>> {
  const packages = await supabase.from("business_packages")
    .select("id, name, badge_text, description, sort_order, is_active")
    .eq("business_id", businessId).order("sort_order").order("name")
  if (packages.error) return failure("Failed to load packages", packages.error.message)
  const packageIds = packages.data.map((pkg) => pkg.id)
  if (!packageIds.length) return { data: { packages: [], packageInclusions: [], packageTiers: [], packageTierItems: [] } }

  const [inclusions, tiers] = await Promise.all([
    supabase.from("business_package_inclusions")
      .select("id, package_id, name, quantity, unit, description, sort_order, is_active")
      .in("package_id", packageIds).order("sort_order").order("name"),
    supabase.from("business_package_tiers")
      .select("id, package_id, name, price, sort_order, is_active")
      .in("package_id", packageIds).order("sort_order").order("name"),
  ])
  if (inclusions.error) return failure("Failed to load shared inclusions", inclusions.error.message)
  if (tiers.error) return failure("Failed to load tiers", tiers.error.message)
  const tierIds = tiers.data.map((tier) => tier.id)
  const items = tierIds.length
    ? await supabase.from("business_package_tier_items")
        .select("id, package_tier_id, item_type, name, quantity, unit, description, price, sort_order, is_active")
        .in("package_tier_id", tierIds).order("sort_order").order("name")
    : { data: [], error: null }
  if (items.error) return failure("Failed to load tier items", items.error.message)
  return { data: { packages: packages.data, packageInclusions: inclusions.data, packageTiers: tiers.data, packageTierItems: items.data } }
}

export async function createPackage(businessId: string, input: PackageInput): Promise<ServiceResponse<unknown>> {
  const sortOrder = await nextSort("business_packages", "business_id", businessId)
  const result = await supabase.from("business_packages").insert({
    business_id: businessId, name: input.name, description: input.description,
    is_active: input.isActive, sort_order: sortOrder,
  }).select("id, name, badge_text, description, sort_order, is_active").single()
  if (result.error) return failure("Failed to create package", result.error.message, statusFor(result.error.code))
  return { data: result.data }
}

export async function updatePackage(businessId: string, packageId: string, input: PackageInput): Promise<ServiceResponse<unknown>> {
  const owned = await ownedPackage(businessId, packageId)
  if (owned.error) return failure("Failed to verify package", owned.error.message)
  if (!owned.data) return failure("Package not found", "The package does not belong to this business", 404)
  const result = await supabase.from("business_packages").update({
    name: input.name, description: input.description, is_active: input.isActive,
  }).eq("id", packageId).select("id, name, badge_text, description, sort_order, is_active").single()
  if (result.error) return failure("Failed to update package", result.error.message, statusFor(result.error.code))
  return { data: result.data }
}

export async function createInclusion(businessId: string, packageId: string, input: InclusionInput): Promise<ServiceResponse<unknown>> {
  const owned = await ownedPackage(businessId, packageId)
  if (owned.error) return failure("Failed to verify package", owned.error.message)
  if (!owned.data) return failure("Package not found", "The package does not belong to this business", 404)
  const sortOrder = await nextSort("business_package_inclusions", "package_id", packageId)
  const result = await supabase.from("business_package_inclusions").insert({
    package_id: packageId, name: input.name, quantity: input.quantity, unit: input.unit,
    description: input.description, is_active: input.isActive, sort_order: sortOrder,
  }).select("id, package_id, name, quantity, unit, description, sort_order, is_active").single()
  if (result.error) return failure("Failed to add inclusion", result.error.message, statusFor(result.error.code))
  return { data: result.data }
}

export async function updateInclusion(businessId: string, packageId: string, inclusionId: string, input: InclusionInput): Promise<ServiceResponse<unknown>> {
  const owned = await ownedPackage(businessId, packageId)
  if (owned.error) return failure("Failed to verify package", owned.error.message)
  if (!owned.data) return failure("Package not found", "The package does not belong to this business", 404)
  const existing = await supabase.from("business_package_inclusions").select("id").eq("id", inclusionId).eq("package_id", packageId).maybeSingle()
  if (existing.error) return failure("Failed to verify inclusion", existing.error.message)
  if (!existing.data) return failure("Inclusion not found", "The inclusion does not belong to this package", 404)
  const result = await supabase.from("business_package_inclusions").update({
    name: input.name, quantity: input.quantity, unit: input.unit,
    description: input.description, is_active: input.isActive,
  }).eq("id", inclusionId).select("id, package_id, name, quantity, unit, description, sort_order, is_active").single()
  if (result.error) return failure("Failed to update inclusion", result.error.message, statusFor(result.error.code))
  return { data: result.data }
}

export async function createTier(businessId: string, packageId: string, input: TierInput): Promise<ServiceResponse<unknown>> {
  const owned = await ownedPackage(businessId, packageId)
  if (owned.error) return failure("Failed to verify package", owned.error.message)
  if (!owned.data) return failure("Package not found", "The package does not belong to this business", 404)
  const sortOrder = await nextSort("business_package_tiers", "package_id", packageId)
  const result = await supabase.from("business_package_tiers").insert({
    package_id: packageId, name: input.name, price: input.price,
    is_active: input.isActive, sort_order: sortOrder,
  }).select("id, package_id, name, price, sort_order, is_active").single()
  if (result.error) return failure("Failed to create tier", result.error.message, statusFor(result.error.code))
  return { data: result.data }
}

export async function updateTier(businessId: string, packageId: string, tierId: string, input: TierInput): Promise<ServiceResponse<unknown>> {
  const owned = await ownedTier(businessId, packageId, tierId)
  if (owned.error) return failure("Failed to verify tier", owned.error.message)
  if (!owned.data) return failure("Tier not found", "The tier does not belong to this business package", 404)
  const result = await supabase.from("business_package_tiers").update({
    name: input.name, price: input.price, is_active: input.isActive,
  }).eq("id", tierId).select("id, package_id, name, price, sort_order, is_active").single()
  if (result.error) return failure("Failed to update tier", result.error.message, statusFor(result.error.code))
  return { data: result.data }
}

export async function duplicateTier(businessId: string, packageId: string, tierId: string): Promise<ServiceResponse<{ id: string }>> {
  const owned = await ownedTier(businessId, packageId, tierId)
  if (owned.error) return failure("Failed to verify tier", owned.error.message)
  if (!owned.data) return failure("Tier not found", "The tier does not belong to this business package", 404)
  const result = await supabase.rpc("duplicate_business_package_tier", {
    p_business_id: businessId, p_package_id: packageId, p_tier_id: tierId,
  })
  if (result.error) return failure("Failed to duplicate tier", result.error.message, statusFor(result.error.code))
  return { data: { id: String(result.data) } }
}

export async function createTierItem(businessId: string, packageId: string, tierId: string, input: TierItemInput): Promise<ServiceResponse<unknown>> {
  const owned = await ownedTier(businessId, packageId, tierId)
  if (owned.error) return failure("Failed to verify tier", owned.error.message)
  if (!owned.data) return failure("Tier not found", "The tier does not belong to this business package", 404)
  const sortOrder = await nextSort("business_package_tier_items", "package_tier_id", tierId)
  const result = await supabase.from("business_package_tier_items").insert({
    package_tier_id: tierId, item_type: input.itemType, name: input.name,
    quantity: input.quantity, unit: input.unit, description: input.description,
    price: input.price, is_active: input.isActive, sort_order: sortOrder,
  }).select("id, package_tier_id, item_type, name, quantity, unit, description, price, sort_order, is_active").single()
  if (result.error) return failure("Failed to add tier item", result.error.message, statusFor(result.error.code))
  return { data: result.data }
}

export async function updateTierItem(businessId: string, packageId: string, tierId: string, itemId: string, input: TierItemInput): Promise<ServiceResponse<unknown>> {
  const owned = await ownedTier(businessId, packageId, tierId)
  if (owned.error) return failure("Failed to verify tier", owned.error.message)
  if (!owned.data) return failure("Tier not found", "The tier does not belong to this business package", 404)
  const existing = await supabase.from("business_package_tier_items").select("id").eq("id", itemId).eq("package_tier_id", tierId).maybeSingle()
  if (existing.error) return failure("Failed to verify item", existing.error.message)
  if (!existing.data) return failure("Item not found", "The item does not belong to this tier", 404)
  const result = await supabase.from("business_package_tier_items").update({
    item_type: input.itemType, name: input.name, quantity: input.quantity,
    unit: input.unit, description: input.description, price: input.price,
    is_active: input.isActive,
  }).eq("id", itemId).select("id, package_tier_id, item_type, name, quantity, unit, description, price, sort_order, is_active").single()
  if (result.error) return failure("Failed to update tier item", result.error.message, statusFor(result.error.code))
  return { data: result.data }
}
