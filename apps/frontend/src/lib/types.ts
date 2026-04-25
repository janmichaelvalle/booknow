export type QuotationValues = {
  eventDate: Date | undefined
  startTime: string
  endTime: string
  venue: string
  guestCount: number | undefined
  selectedPackage: "classic" | "vintage"
}


export type Reservation = {
  id: string
  eventDate: string
  guestCount: number
  selectedPackage: "classic" | "vintage"
  reservationStatus: string,
  paymentMethodId?: string | null
  paymentProofPath?: string | null
  rejectionReason?: string | null
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
}

export type PackagePricing = {
  id: string
  package_id: string
  min_guests: number
  max_guests: number | null
  price_per_guest: number
}

export type AddOn = {
  id: string
  name: string
  description: string | null
  price: number
}

export type Offerings = {
  packages: BusinessPackage[]
  packagePricing: PackagePricing[]
  addons: AddOn[]
}
