import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldTitle } from "@/components/ui/field"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import { Martini, GlassWater } from "lucide-react"


type PackageDetailsProps = {
  classicPackagePrice: number
  vintagePackagePrice: number
  form: any
}


export function PackageDetails({ classicPackagePrice, vintagePackagePrice, form }: PackageDetailsProps) {
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
                    <FieldLabel htmlFor="classic">
                      <Field orientation="horizontal">
                        <RadioGroupItem
                          value="classic"
                          id="classic"
                        />
                        <FieldContent>
                          <div className="flex items-start justify-between gap-4">
                            <FieldTitle>Classic Package</FieldTitle>

                            <FieldTitle>
                              ₱ {(classicPackagePrice > 0 ? classicPackagePrice : 0).toLocaleString()}
                            </FieldTitle>

                          </div>

                          <Badge variant="default">
                            <GlassWater data-icon="inline-start" />
                            5 shooters per guest
                          </Badge>

                          <FieldDescription>
                            Best for debuts, birthdays, and college parties
                          </FieldDescription>
                        </FieldContent>

                      </Field>
                    </FieldLabel>

                    <FieldLabel htmlFor="vintage">
                      <Field orientation="horizontal">
                        <RadioGroupItem
                          value="vintage"
                          id="vintage"
                        />
                        <FieldContent>
                          <div className="flex items-start justify-between gap-4">
                            <FieldTitle>Vintage Package</FieldTitle>

                            <FieldTitle>
                              ₱ {(vintagePackagePrice > 0 ? vintagePackagePrice : 0).toLocaleString()}
                            </FieldTitle>
                          </div>
                          <FieldDescription>
                            <Badge variant="default">
                              <Martini data-icon="inline-start" />
                              2 cocktails per guest
                            </Badge>

                          </FieldDescription>
                          <FieldDescription>
                            Perfect for wedding and corporate events.
                          </FieldDescription>
                        </FieldContent>

                      </Field>
                    </FieldLabel>
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
