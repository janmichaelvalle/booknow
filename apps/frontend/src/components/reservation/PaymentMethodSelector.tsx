
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { type PaymentMethod } from "@/lib/types"

type PaymentMethodSelectorProps = {
  paymentMethods: PaymentMethod[]
}


export function PaymentMethodSelector({ paymentMethods }: PaymentMethodSelectorProps) {
  return (
    <>
      <h1>Payment Selector</h1>
      <Card>
        <CardHeader>
          <CardTitle>Payment Selector</CardTitle>
          <CardDescription>Select your preferred payment option to reserve your date.</CardDescription>
        </CardHeader>

       <CardContent>
        <RadioGroup className="max-w-sm">
          {paymentMethods.map((paymentMethod) => (
            <FieldLabel
              key={paymentMethod.id}
              htmlFor={paymentMethod.id}
            >
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>{paymentMethod.providerName}</FieldTitle>
                </FieldContent>
                <RadioGroupItem
                  value={paymentMethod.id}
                  id={paymentMethod.id}
                />
              </Field>
            </FieldLabel>
          ))}
        </RadioGroup>
      </CardContent>
        

      <CardFooter>
        <p>Choose one payment method.</p>
      </CardFooter>
    </Card>
    </>
  )
}