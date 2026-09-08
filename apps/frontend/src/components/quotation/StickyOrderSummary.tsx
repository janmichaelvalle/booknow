import { Button } from "@/components/ui/button"

type StickyOrderSummaryProps = {
  basePrice: number
  addOnsPrice: number
  transportationFee: number
  onContinue: () => void
}

export function StickyOrderSummary({
  basePrice,
  addOnsPrice,
  transportationFee,
  onContinue,
}: StickyOrderSummaryProps) {
    const totalPrice = basePrice + addOnsPrice + transportationFee

  if (totalPrice <= 0) {
    return null
  }
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 !mb-0">
      <div className="mx-auto w-full max-w-md border-t bg-background px-4 py-2 shadow-lg">
        <Button
          type="button"
          className="w-full"
          onClick={onContinue}
        >
          Get My Quotation — ₱{totalPrice.toLocaleString()}
        </Button>
      </div>
    </div>
  )
}