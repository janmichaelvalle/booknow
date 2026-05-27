import { type Offerings, type QuotationValues } from "@/lib/types"


export function calculateQuotationTotals(values: QuotationValues, offerings: Offerings) {
  const guestCount = values.guestCount ?? 0

  const selectedPricing = offerings.packagePricing.find((price) => {
    const matchesPackage = price.package_id === values.selectedPackage
    const matchesMinGuests = guestCount >= price.min_guests
    const matchesMaxGuests =
      price.max_guests === null || guestCount <= price.max_guests

    return matchesPackage && matchesMinGuests && matchesMaxGuests
  })

  const packageTotal = selectedPricing
    ? guestCount * selectedPricing.price_per_guest
    : 0

  const selectedPackage = offerings.packages.find(
    (pkg) => pkg.id === values.selectedPackage
  )

  const selectedPackageSummary = {
    name: selectedPackage?.name ?? "",
    pricePerGuest: selectedPricing?.price_per_guest ?? 0,
    guestCount,
    basePrice: packageTotal,
  }

  const addOnsTotal = offerings.addons.reduce((sum, addon) => {
    const quantity = values.selectedAddOns[addon.id] ?? 0
    return sum + addon.price * quantity
  }, 0)

  const selectedAddOnItems = offerings.addons
     // .map() goes through all items of the array one by one
    .map((addon) => {
        // quantity stores the selected quantities of that specific add-on
      const quantity = values.selectedAddOns[addon.id] ?? 0

      // If quantity is zero return nothing because the user did not select anything
      if (quantity === 0) return null

       // creates a new object
      return {
        id: addon.id,
        name: addon.name,
        price: addon.price,
        quantity,
        lineTotal: addon.price * quantity,
      }
    })
     // .filter removes null values in the array
    .filter(Boolean)

  return {
    guestCount,
    selectedPricing,
    selectedPackage,
    packageTotal,
    addOnsTotal,
    grandTotal: packageTotal + addOnsTotal,
    selectedPackageSummary,
    selectedAddOnItems,
  }
}