import type {
  CalculatedPackage,
  Offerings,
  PackageTier,
  QuotationValues,
} from "@/lib/types"

export function calculateTierTotal(tier: PackageTier) {
  return tier.pricing_type === "fixed"
    ? tier.price
    : tier.price * tier.tier_value
}

export function calculateQuotationTotals(
  values: QuotationValues,
  offerings: Offerings
) {
  const selectedPackages = Object.entries(values.selectedPackages)
    .map(([packageId, selection]): CalculatedPackage | null => {
      const selectedPackage = offerings.packages.find(
        (pkg) => pkg.id === packageId
      )
      const selectedTier = offerings.packageTiers.find(
        (tier) =>
          tier.id === selection.tierId && tier.package_id === packageId
      )

      if (!selectedPackage || !selectedTier) {
        return null
      }

      const packageTotal = calculateTierTotal(selectedTier)
      const selectedItems = offerings.packageTierItems
        .filter(
          (item) =>
            item.package_tier_id === selectedTier.id &&
            (item.item_type === "extra" || item.item_type === "upgrade")
        )
        .map((item) => {
          const quantity = selection.selectedTierItems[item.id] ?? 0
          if (quantity <= 0) return null

          return {
            tierItemId: item.id,
            itemType: item.item_type as "extra" | "upgrade",
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

      return {
        package: selectedPackage,
        selectedTier,
        packageTotal,
        selectedItems,
        selectedItemsTotal,
        total: packageTotal + selectedItemsTotal,
      }
    })
    .filter((pkg) => pkg !== null)

  const packagesTotal = selectedPackages.reduce(
    (total, pkg) => total + pkg.packageTotal,
    0
  )
  const selectedItemsTotal = selectedPackages.reduce(
    (total, pkg) => total + pkg.selectedItemsTotal,
    0
  )

  return {
    selectedPackages,
    packagesTotal,
    selectedItemsTotal,
    grandTotal: packagesTotal + selectedItemsTotal,
  }
}
