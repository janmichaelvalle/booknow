import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

const liquorAddOns = [
  {
    id: "san-miguel-lychee",
    name: "San Miguel Flavored Beer",
    description: "Lychee 330 mL Can, Case of 24",
    price: 1629,
  },
  {
    id: "jack-daniels-old-no-7",
    name: "Jack Daniel's Old No. 7",
    description: "Tennessee Whiskey 1L",
    price: 1680,
  },
]

export function AddOns() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Optional Add-ons</CardTitle>
        <CardDescription>
          Add extra liquor options to your package
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {liquorAddOns.map((item) => (
          <div
            key={item.id}
            className="flex items-center justify-between gap-4 rounded-lg border p-4"
          >
            <div className="space-y-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">
                {item.description}
              </p>
              <p className="text-sm font-medium">
                ₱{item.price.toLocaleString()}.00
              </p>
            </div>

            <div className="w-full max-w-32">
              <NumberField defaultValue={0} min={0} max={100} size="sm">
                <NumberFieldGroup>
                  <NumberFieldDecrement />
                  <NumberFieldInput />
                  <NumberFieldIncrement />
                </NumberFieldGroup>
              </NumberField>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
