import { type Offerings, type QuotationValues } from "@/lib/types"


export function calculateQuotationTotals(values: QuotationValues, offerings: Offerings) {
  const guestCount = values.guestCount ?? 0

  const selectedPackage = offerings.packages.find(
    (pkg) => pkg.id === values.selectedPackage
  )

  const packageTiers = offerings.packageTiers
    .filter((tier) => tier.package_id === values.selectedPackage)
    .sort((a, b) => a.tier_value - b.tier_value)

  const recommendedTier =
    selectedPackage?.tier_type === "guests"
      ? packageTiers.find((tier) => tier.tier_value >= guestCount)
      : undefined

  const selectedTier = packageTiers.find(
    (tier) => tier.id === values.selectedPackageTier
  )

  const pricingQuantity =
    selectedPackage?.tier_type === "guests"
      ? guestCount
      : selectedTier?.tier_value ?? 0

  const packageTotal = selectedTier
    ? selectedTier.pricing_type === "fixed"
      ? selectedTier.price
      : selectedTier.price * pricingQuantity
    : 0


  const selectableTierItems = offerings.packageTierItems.filter(
    (item) =>
      item.package_tier_id === selectedTier?.id &&
      (item.item_type === "extra" || item.item_type === "upgrade")
  )

  const selectedItems = selectableTierItems
    .map((item) => {
      const quantity = values.selectedTierItems[item.id] ?? 0

      if (quantity <= 0) return null

      return {
        tierItemId: item.id,
        itemType: item.item_type,
        name: item.name,
        description: item.description,
        unit: item.unit,
        unitPrice: item.price,
        quantity,
        lineTotal: item.price * quantity,
      }
    })
    .filter((item) => item !== null)

  const selectedItemsTotal = selectedItems.reduce(
    (total, item) => total + item.lineTotal,
    0
  )

  const grandTotal = packageTotal + selectedItemsTotal


  return {
    guestCount,
    selectedPackage,
    packageTiers,
    recommendedTier,
    selectedTier,
    pricingQuantity,
    packageTotal,
    selectedItems,
    selectedItemsTotal,
    grandTotal,
  }
}