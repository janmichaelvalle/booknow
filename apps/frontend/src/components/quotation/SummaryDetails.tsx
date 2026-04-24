import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type SummaryDetailsProps = {
  basePrice: number
  addOnsPrice: number
}

export function SummaryDetails({
  basePrice,
  addOnsPrice,
}: SummaryDetailsProps) {
  const totalPrice = basePrice + addOnsPrice

  return (
    <Card>
      <CardHeader>
        <CardTitle>Summary</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Base Price</span>
          <span>PHP {basePrice.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Add-ons</span>
          <span>PHP {addOnsPrice.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between border-t pt-4 font-semibold">
          <span>Total</span>
          <span>PHP {totalPrice.toLocaleString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}
