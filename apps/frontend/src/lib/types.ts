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
