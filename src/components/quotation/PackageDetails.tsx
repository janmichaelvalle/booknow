import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldTitle } from "@/components/ui/field"

import { Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/card"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Controller } from "react-hook-form"
import type { Control } from "react-hook-form"


type PackageDetailsProps = {
    classicPackagePrice: number
    vintagePackagePrice: number
    control: Control<FormValues>
}

type FormValues = {
  eventDate: Date
  guestCount: number
  selectedPackage: "classic" | "vintage"
}

export function PackageDetails( { classicPackagePrice, vintagePackagePrice, control}: PackageDetailsProps) {
  return (
    
    <>
    <Card>
      <CardHeader>
        <CardTitle>Select Package</CardTitle>
        <CardDescription>Choose the perfect package for your event</CardDescription>
      </CardHeader>
       <CardContent>
        <Controller 
        name = "selectedPackage"
        control={control}
        render = {({ field }) => (
            <FieldGroup>
      <FieldSet>
        <RadioGroup 
        value={field.value}
        onValueChange={field.onChange}
        >
          <FieldLabel htmlFor="classic">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Classic Package</FieldTitle>
                <FieldDescription>
                   Price: {classicPackagePrice > 0 ? classicPackagePrice : "Enter guest count first"}
                </FieldDescription>
                <FieldDescription>
                  Glassware: Shot Glasses
                </FieldDescription>
                <FieldDescription>
                  Best for debuts, birthdays, and college parties
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem 
              value="classic" 
              id="classic" 
              />
            </Field>
          </FieldLabel>
          <FieldLabel htmlFor="vintage">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Vintage Package</FieldTitle>
                 <FieldDescription>
                   Price: {vintagePackagePrice > 0 ? vintagePackagePrice : "Enter guest count first"}
                </FieldDescription>
                <FieldDescription>
                  Glassware: Cocktail Glasses
                </FieldDescription>
                <FieldDescription>
                  Perfect for wedding and corporate events.
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem 
              value="vintage" 
              id="vintage"
               />
            </Field>
          </FieldLabel>
        </RadioGroup>
      </FieldSet>
    </FieldGroup>

        )}
        />
      
       </CardContent>
    </Card>
    
   
    </>
  )
}
