
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


export function PaymentMethodSelector () {
    return (
        <>
        <h1>Payment Selector</h1>
        <Card>
  <CardHeader>
    <CardTitle>Payment Selector</CardTitle>
    <CardDescription>Select your preferred payment option to reserve your date.</CardDescription>
  </CardHeader>
  <CardContent>
    <RadioGroup defaultValue="bdo-bank-transfer" className="max-w-sm">
      <FieldLabel htmlFor="plus-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>BDO</FieldTitle>
          </FieldContent>
          <RadioGroupItem value="plus" id="plus-plan" />
        </Field>
      </FieldLabel>
      <FieldLabel htmlFor="pro-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Pro</FieldTitle>
            <FieldDescription>For growing businesses.</FieldDescription>
          </FieldContent>
          <RadioGroupItem value="pro" id="pro-plan" />
        </Field>
      </FieldLabel>
      <FieldLabel htmlFor="enterprise-plan">
        <Field orientation="horizontal">
          <FieldContent>
            <FieldTitle>Enterprise</FieldTitle>
            <FieldDescription>
              For large teams and enterprises.
            </FieldDescription>
          </FieldContent>
          <RadioGroupItem value="enterprise" id="enterprise-plan" />
        </Field>
      </FieldLabel>
    </RadioGroup>
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>
        </>
    )
}