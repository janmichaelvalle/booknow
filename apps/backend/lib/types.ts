// Business types
export type BusinessRow = {
  id: string
  name: string
  slug: string
  description: string | null
  phone: string | null
  email: string | null
  facebook_url: string | null
  instagram_url: string | null
  logo_url: string | null
}

export type ServiceError = {
  message: string
  details?: string
  status: 400 | 404 | 409 | 500
}

export type BusinessResult =
  | { error: ServiceError }
  | { business: BusinessRow }

export type ServiceResponse<T> =
  | { data: T }
  | { error: ServiceError }

// Payment method types remain for the independent merchant settings API.
export type PaymentMethodCategory =
  | "bank_transfer"
  | "e_wallet"
  | "pay_on_event"

export type PaymentMethodDbRow = {
  id: string
  business_id: string
  category: PaymentMethodCategory
  provider_name: string
  account_name: string
  account_number: string
  instructions: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export type PaymentMethod = {
  id: string
  category: PaymentMethodCategory
  providerName: string
  accountName: string
  accountNumber: string
  instructions: string | null
  isActive: boolean
}

export type TierItemType = "inclusion" | "extra" | "upgrade" | "freebie"
export type QuotationStatus = "open" | "accepted" | "booked" | "closed"
export type CloseReason =
  | "customer_chose_another_supplier"
  | "no_response"
  | "event_cancelled"
  | "unavailable_on_event_date"
  | "event_date_passed"
  | "other"

export type SelectedTierItemInput = {
  tierItemId: string
  quantity: number
}

export type SelectedPackageInput = {
  packageId: string
  tierId: string
  selectedItems: SelectedTierItemInput[]
}

export type QuotationFormBody = {
  eventDate: string
  startTime: string
  endTime: string
  venue: string
  venuePlaceId?: string
  venueLocality: string
  venueRegion: string
  occasion: string
  guestCount: number
  packages: SelectedPackageInput[]
  customerName: string
  customerEmail: string
  customerPhone: string
}

export type QuotationInclusion = {
  id: string
  itemType: "inclusion" | "freebie"
  name: string
  quantity: number | null
  unit: string | null
  description: string | null
  sortOrder: number
}

export type QuotationItem = {
  id: string
  tierItemId: string | null
  itemType: "extra" | "upgrade"
  name: string
  description: string | null
  unit: string | null
  unitPrice: number
  quantity: number
  lineTotal: number
}

export type QuotationPackage = {
  id: string
  packageId: string | null
  tierId: string | null
  packageName: string
  tierName: string
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

export type UpdateQuotationStatusBody = {
  quotationStatus: QuotationStatus
  closeReason?: CloseReason | null
  closeReasonNotes?: string | null
}
