// Business types
export type BusinessRow = {
  id: string
  name: string
  slug: string
}

export type BusinessResult =
  | {
      error: {
        message: string
        details?: string
        status: 404 | 500
      }
    }
  | {
      business: BusinessRow
    }

// Payment method types
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

// Reservation types
export type SelectedPackage = string

export type ReservationDbRow = {
  id: string
  event_date: string
  start_time: string
  end_time: string
  venue: string
  guest_count: number
  selected_package_id: SelectedPackage
  status: string
  payment_method_id: string | null
  payment_proof_path: string | null
  rejection_reason: string | null
}



export type Reservation = {
  id: string
  eventDate: string
  startTime: string
  endTime: string
  venue: string
  guestCount: number
  selectedPackageId: SelectedPackage
  reservationStatus?: string
  paymentMethodId?: string | null
  paymentProofPath?: string | null
  rejectionReason?: string | null
}


// Service response type
export type ServiceResponse<T> =
  | { data: T }
  | {
      error: {
        message: string
        details?: string
        status: 404 | 500
      }
    }