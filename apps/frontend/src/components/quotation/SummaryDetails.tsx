import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { SelectedAddOnItem, SelectedPackageSummary } from "@/lib/types"

type SummaryDetailsProps = {
  basePrice: number
  addOnsPrice: number
  selectedAddOnItems: SelectedAddOnItem[]
  selectedPackageSummary: SelectedPackageSummary


}

export function SummaryDetails({
  basePrice,
  addOnsPrice,
  selectedAddOnItems,
  selectedPackageSummary
}: SummaryDetailsProps) {
  const totalPrice = basePrice + addOnsPrice

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
  <p className="text-sm font-medium text-muted-foreground">Package</p>
  <div className="flex items-center justify-between">
    <span>{selectedPackageSummary.name} ({selectedPackageSummary.guestCount} guests)</span>
    <span>₱ {selectedPackageSummary.basePrice.toLocaleString()}</span>
  </div>
</div>

       <div className="space-y-2">
  <p className="text-sm font-medium text-muted-foreground">Add-ons</p>
  {selectedAddOnItems.map((item) => (
    <div key={item.id} className="flex items-center justify-between">
      <span>{item.name}</span>
      <span>₱ {item.price.toLocaleString()} x {item.quantity} = ₱ {item.lineTotal.toLocaleString()}</span>
    </div>
  ))}
</div>
        

        <div className="flex items-center justify-between border-t pt-4 font-semibold">
          <span>Total</span>
          <span>₱ {totalPrice.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
