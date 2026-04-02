export type SelectedPackage = "classic" | "vintage"

export type ReservationDbRow = {
  id: string
  event_date: string
  guest_count: number
  selected_package: SelectedPackage
}


export type Reservation = {
  id: string
  eventDate: string
  guestCount: number
  selectedPackage: SelectedPackage,
  reservationStatus: string
}
