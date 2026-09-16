export type PricingType = "fixed" | "per_unit"
export type TierItemType = "inclusion" | "extra" | "upgrade" | "freebie"
export type QuotationStatus = "open" | "accepted" | "booked" | "closed"
export type CloseReason =
  | "customer_chose_another_supplier"
  | "no_response"
  | "event_cancelled"
  | "unavailable_on_event_date"
  | "event_date_passed"
  | "other"

export type CoverageResult = {
  isCovered: boolean
  transportationFee: number | null
}

export type VenueSelection = {
  address: string
  placeId: string
  locality: string
  region: string
  coverage: CoverageResult
}

export type SelectedPackageValue = {
  tierId: string
  selectedTierItems: Record<string, number>
}

export type QuotationValues = {
  eventDate: Date | undefined
  startTime: string
  endTime: string
  venue: string
  venuePlaceId: string
  venueLocality: string
  venueRegion: string
  occasion: string
  occasionOther: string
  guestCount: number | undefined
  selectedPackages: Record<string, SelectedPackageValue>
  customerName: string
  customerEmail: string
  customerPhone: string
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

export type CalculatedSelectedItem = {
  tierItemId: string
  itemType: "extra" | "upgrade"
  name: string
  description: string | null
  unit: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export type CalculatedPackage = {
  package: BusinessPackage
  selectedTier: PackageTier
  packageTotal: number
  selectedItems: CalculatedSelectedItem[]
  selectedItemsTotal: number
  total: number
}

export type QuotationInclusion = {
  id: string
  itemType: "inclusion" | "freebie"
  name: string
  quantity: number
  unit: string
  description: string | null
  sortOrder: number
}

export type QuotationItem = {
  id: string
  tierItemId: string | null
  itemType: "extra" | "upgrade"
  name: string
  description: string | null
  unit: string
  unitPrice: number
  quantity: number
  lineTotal: number
}

export type QuotationPackage = {
  id: string
  packageId: string | null
  tierId: string | null
  packageName: string
  tierUnit: string
  tierValue: number
  pricingType: PricingType
  price: number
  packageTotal: number
  selectedItemsTotal: number
  total: number
  sortOrder: number
  inclusions: QuotationInclusion[]
  selectedItems: QuotationItem[]
}

export type Quotation = {
  id: string
  quotationReference: string
  businessId: string
  createdAt: string
  updatedAt: string
  eventDate: string
  startTime: string
  endTime: string
  venue: string
  venuePlaceId: string | null
  venueLocality: string
  venueRegion: string
  occasion: string
  guestCount: number
  customerName: string
  customerEmail: string
  customerPhone: string
  packages: QuotationPackage[]
  packagesTotal: number
  selectedItemsTotal: number
  transportationFee: number
  grandTotal: number
  quotationStatus: QuotationStatus
  closeReason: CloseReason | null
  closeReasonNotes: string | null
}

export type BusinessInformation = {
  name: string
  description: string | null
  logo_url: string | null
}
