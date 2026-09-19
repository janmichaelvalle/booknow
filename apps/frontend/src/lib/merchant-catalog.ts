import { merchantFetch } from "@/lib/merchant-api"
import type { TierItemType } from "@/lib/types"

export type MerchantPackage = {
  id: string; name: string; badge_text: string | null; description: string | null
  sort_order: number; is_active: boolean
}
export type MerchantPackageInclusion = {
  id: string; package_id: string; name: string; quantity: number | null
  unit: string | null; description: string | null; sort_order: number; is_active: boolean
}
export type MerchantTier = {
  id: string; package_id: string; name: string; price: number
  sort_order: number; is_active: boolean
}
export type MerchantTierItem = {
  id: string; package_tier_id: string; item_type: TierItemType; name: string
  quantity: number | null; unit: string | null; description: string | null
  price: number; sort_order: number; is_active: boolean
}
export type MerchantCatalog = {
  packages: MerchantPackage[]
  packageInclusions: MerchantPackageInclusion[]
  packageTiers: MerchantTier[]
  packageTierItems: MerchantTierItem[]
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body) headers.set("Content-Type", "application/json")
  const response = await merchantFetch(path, { ...init, headers })
  const result = await response.json()
  if (!response.ok) throw new Error(result.message ?? result.error ?? "Catalog request failed")
  return result.data as T
}

export const getMerchantCatalog = () => request<MerchantCatalog>("/api/merchant/catalog")
export const createMerchantPackage = (input: unknown) => request<MerchantPackage>("/api/merchant/packages", { method: "POST", body: JSON.stringify(input) })
export const updateMerchantPackage = (id: string, input: unknown) => request<MerchantPackage>(`/api/merchant/packages/${id}`, { method: "PATCH", body: JSON.stringify(input) })
export const createMerchantInclusion = (packageId: string, input: unknown) => request<MerchantPackageInclusion>(`/api/merchant/packages/${packageId}/inclusions`, { method: "POST", body: JSON.stringify(input) })
export const updateMerchantInclusion = (packageId: string, id: string, input: unknown) => request<MerchantPackageInclusion>(`/api/merchant/packages/${packageId}/inclusions/${id}`, { method: "PATCH", body: JSON.stringify(input) })
export const createMerchantTier = (packageId: string, input: unknown) => request<MerchantTier>(`/api/merchant/packages/${packageId}/tiers`, { method: "POST", body: JSON.stringify(input) })
export const updateMerchantTier = (packageId: string, id: string, input: unknown) => request<MerchantTier>(`/api/merchant/packages/${packageId}/tiers/${id}`, { method: "PATCH", body: JSON.stringify(input) })
export const duplicateMerchantTier = (packageId: string, id: string) => request<{ id: string }>(`/api/merchant/packages/${packageId}/tiers/${id}/duplicate`, { method: "POST" })
export const createMerchantTierItem = (packageId: string, tierId: string, input: unknown) => request<MerchantTierItem>(`/api/merchant/packages/${packageId}/tiers/${tierId}/items`, { method: "POST", body: JSON.stringify(input) })
export const updateMerchantTierItem = (packageId: string, tierId: string, id: string, input: unknown) => request<MerchantTierItem>(`/api/merchant/packages/${packageId}/tiers/${tierId}/items/${id}`, { method: "PATCH", body: JSON.stringify(input) })
