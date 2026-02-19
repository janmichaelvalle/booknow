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
}