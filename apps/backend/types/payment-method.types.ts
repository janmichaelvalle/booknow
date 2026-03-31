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
