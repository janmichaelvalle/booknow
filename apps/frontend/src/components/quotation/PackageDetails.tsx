import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldTitle } from "@/components/ui/field"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Martini, GlassWater, MailSearch } from "lucide-react"
import { type BusinessPackage, type PackagePricing } from "../../lib/types"

type PackageDetailsProps = {
  packages: BusinessPackage[]
  packagePricing: PackagePricing[]
  guestCount: number
  form: any
}



export function PackageDetails({ packages, packagePricing, guestCount, form }: PackageDetailsProps) {


  return (


    <>
      <Card>
        <CardHeader>
          <CardTitle>Select Package</CardTitle>
          <CardDescription>Every package includes 4 hours open bar, bartenders, and LED bar counter.</CardDescription>
        </CardHeader>
        <CardContent>

          <form.Field name="selectedPackage">
            {(field: any) => (
              <FieldGroup>
                <FieldSet>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={field.handleChange}
                  >

                    {packages.map((pkg) => {
                      const matchedPrice = packagePricing.find((price) => {
                        const matchesPackage = price.package_id === pkg.id
                        const matchesMinGuests = guestCount >= price.min_guests
                        const matchesMaxGuests =
                          price.max_guests === null || guestCount <= price.max_guests

                        return matchesPackage && matchesMinGuests && matchesMaxGuests
                      })
                      console.log("package:", pkg)
                      console.log("matchedPrice:", matchedPrice)

                      return (
                        <FieldLabel key={pkg.id} htmlFor={pkg.id}>
                          <Field orientation="horizontal">
                            <RadioGroupItem value={pkg.id} id={pkg.id} />
                            <FieldContent>
                              <div className="flex items-start justify-between gap-4">
                                <FieldTitle>{pkg.name}</FieldTitle>

                                <FieldTitle>
                                   ₱ {matchedPrice ? guestCount * matchedPrice.price_per_guest : 0}
                                </FieldTitle>
                              </div>

                              <Badge>{pkg.badge_text}</Badge>
                              <FieldDescription>{pkg.description}</FieldDescription>
                            </FieldContent>

                          </Field>
                        </FieldLabel>
                      )
                    })}



                  </RadioGroup>
                </FieldSet>
              </FieldGroup>
            )}
          </form.Field>

        </CardContent>
      </Card>


    </>
  )
}
