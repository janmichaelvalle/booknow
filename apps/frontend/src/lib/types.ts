export type TierType = "guests" | "hours" | "units"

export type PricingType = "fixed" | "per_unit"

export type TierItemType =
  | "inclusion"
  | "extra"
  | "upgrade"
  | "freebie"



export type CoverageResult = {
  isCovered: boolean
  transportationFee: number | null
}



export type QuotationValues = {
  eventDate: Date | undefined
  startTime: string
  endTime: string
  venue: string
  occasion: string
  occasionOther: string
  guestCount: number | undefined
  selectedPackage: string
  selectedPackageTier: string
  // The key is the tier-item ID and the value is the selected quantity.
  selectedTierItems: Record<string, number>
  customerName: string
  customerEmail: string
  customerPhone: string
}

export type SelectedReservationAddOn = {
  addonId: string
  addonName: string
  addonPrice: number,
  quantity: number
}

export type Reservation = {
  id: string
  quotationReference: string
  createdAt: string
  eventDate: string
  startTime: string
  endTime: string
  venue: string
  guestCount: number
  selectedPackageId: string
  selectedAddOns: SelectedReservationAddOn[],
  selectedPackageName?: string
  packageTotal: number
  addOnsTotal: number
  grandTotal: number
  reservationStatus?: string
  paymentMethodId?: string | null
  paymentProofPath?: string | null
  rejectionReason?: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
  transportationFee: number
}

export type PaymentMethodCategory =
  | "bank_transfer"
  | "e_wallet"
  | "pay_on_event"

export type PaymentMethod = {
  id: string
  category: PaymentMethodCategory
  providerName: string
  accountName: string
  accountNumber: string
  instructions: string | null
  isActive: boolean
}

export type BusinessPackage = {
  id: string
  name: string
  badge_text: string | null
  description: string | null
  tier_unit: string
}


export type PackageInclusion = {
  id: string
  package_id: string
  name: string
  quantity: number
  unit: string
  description: string | null
  sort_order: number
}

export type PackageTier = {
  id: string
  package_id: string
  tier_value: number
  pricing_type: PricingType
  price: number
}

export type PackageTierItem = {
  id: string
  package_tier_id: string
  item_type: TierItemType
  name: string
  quantity: number
  unit: string
  description: string | null
  price: number
  sort_order: number
}

export type Offerings = {
  packages: BusinessPackage[]
  packageInclusions: PackageInclusion[]
  packageTiers: PackageTier[]
  packageTierItems: PackageTierItem[]
}

export type SelectedAddOnItem = {
  id: string
  name: string
  price: number
  quantity: number
  lineTotal: number
}

export type SelectedPackageSummary = {
  name: string
  pricePerGuest: number
  guestCount: number
  basePrice: number
}


export type BusinessInformation = {
  name: string
  description: string | null
  logo_url: string | null
}

