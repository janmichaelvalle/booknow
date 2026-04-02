export type QuotationValues = {
    eventDate: Date
    guestCount: number
    selectedPackage: "classic" | "vintage"
    selectedPackagePrice: number
}


export type Reservation = {
  id: string
  eventDate: string
  guestCount: number
  selectedPackage: "classic" | "vintage"
  reservationStatus: string
  
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
