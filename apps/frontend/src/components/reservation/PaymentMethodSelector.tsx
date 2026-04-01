
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import {
  Field,
  FieldContent,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { type PaymentMethod } from "@/lib/types"
import { useState } from "react"

type PaymentMethodSelectorProps = {
  paymentMethods: PaymentMethod[],
  packagePrice: number,
}


export function PaymentMethodSelector({ paymentMethods, packagePrice }: PaymentMethodSelectorProps) {
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("")
  const selectedPaymentMethod = paymentMethods.find(
    // (method) => method.id === selectedPaymentMethodId
    (paymentMethod) => paymentMethod.id === selectedPaymentMethodId
  )

  return (
    <>

      <Card>
        <CardHeader>
          <CardTitle>Payment Selector</CardTitle>
          <CardDescription>Select your preferred payment option to reserve your date.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* RadioGroup  groups all radio buttons together */}
          <RadioGroup

            value={selectedPaymentMethodId}
            onValueChange={setSelectedPaymentMethodId}>
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
          {selectedPaymentMethod && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Instructions</CardTitle>
                <CardDescription>
                  Follow these instructions to complete your payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Account Name:</strong> {selectedPaymentMethod.accountName}</p>
                <p><strong>Account Number:</strong> {selectedPaymentMethod.accountNumber}</p>
                <p><strong>Amount:</strong> PHP {packagePrice}</p>
                <p>
                  {selectedPaymentMethod.instructions}
                </p>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader>
              <CardTitle>Upload Payment Screenshot</CardTitle>
              <CardDescription>
                Please upload a screenshot of your payment confirmation for verification
              </CardDescription>
            </CardHeader>

            <CardContent>
              <label
                htmlFor="payment-proof"
                className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 px-6 py-12 text-center"
              >
                <div className="mb-4 text-2xl">📤</div>

                <p className="text-lg font-medium text-gray-800">
                  Choose a file or drag & drop it here
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  JPEG, PNG, PDF, and MP4 formats, up to 50MB
                </p>

                <div className="mt-6 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700">
                  Browse File
                </div>
              </label>

              <input
                id="payment-proof"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.mp4"
                className="hidden"
              />
            </CardContent>
          </Card>


        </CardContent>

      </Card>
    </>
  )
}