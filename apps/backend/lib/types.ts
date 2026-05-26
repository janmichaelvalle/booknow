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
export type SelectedPackageId = string

export type ReservationDbRow = {
  id: string
  event_date: string
  start_time: string
  end_time: string
  venue: string
  guest_count: number
  selected_package_id: SelectedPackageId
  package_total: number
  addons_total: number
  grand_total: number
  status: string
  payment_method_id: string | null
  payment_proof_path: string | null
  rejection_reason: string | null
  customer_name: string
  customer_email: string
  customer_phone: string
}

export type SelectedReservationAddOn = {
  addonId: string
  addonName: string
  addonPrice: number,
  quantity: number
}


export type Reservation = {
  id: string
  eventDate: string
  startTime: string
  endTime: string
  venue: string
  guestCount: number
  selectedPackageId: SelectedPackageId
  selectedAddOns: SelectedReservationAddOn[],
  packageTotal: number
  addOnsTotal: number
  grandTotal: number
  selectedPackageName?: string
  reservationStatus?: string
  paymentMethodId?: string | null
  paymentProofPath?: string | null
  rejectionReason?: string | null
  customerName: string
  customerEmail: string
  customerPhone: string
}

export type ReservationFormBody = {
  eventDate: string
  startTime: string
  endTime: string
  venue: string
  guestCount: number
  selectedPackageId: string
  packageTotal: number
  addOnsTotal: number
  grandTotal: number
  selectedAddOns: Record<string, number>
  customerName: string
  customerEmail: string
  customerPhone: string
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