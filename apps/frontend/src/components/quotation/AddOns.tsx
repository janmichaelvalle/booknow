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

import { type AddOn } from "@/lib/types"



type AddOnsProps = {
  addons: AddOn[]
  form: any
}


export function AddOns({ addons, form }: AddOnsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Optional Add-ons</CardTitle>
        <CardDescription>
          Add extra liquor options to your package
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">

        <form.Field name="selectedAddOns">
          {(field: any) => (
            <>
              {addons.map((addon) => (
                <div
                  key={addon.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{addon.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {addon.description}
                    </p>
                    <p className="text-sm font-medium">
                      ₱{addon.price.toLocaleString()}.00
                    </p>
                  </div>

                  <div className="w-full max-w-32">
                    <NumberField
                      defaultValue={0}
                      min={0}
                      max={100}
                      size="sm"
                       value={field.state.value[addon.id] ?? 0}
                      onValueChange={(quantity) => {
                        field.handleChange({ 
                          // ...field.state.value copies all the existing key-value pairs from the current selectedAddOns object
                        ...field.state.value, 
                        [addon.id]: quantity
                        })
                      }}>

                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </div>
                </div>
              ))}
            </>
          )}
        </form.Field>
      </CardContent>
    </Card>
  )
}
