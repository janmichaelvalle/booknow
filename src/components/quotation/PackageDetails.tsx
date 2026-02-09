import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"


type PackageDetailsProps = {
    selectedPackage: string
    onPackageChange: (value: string) => void
    classicPackagePrice: number
    vintagePackagePrice: number
}

export function PackageDetails( {selectedPackage, onPackageChange, classicPackagePrice, vintagePackagePrice}: PackageDetailsProps) {
  return (
    
    <>
    <Card>
      <CardHeader>
        <CardTitle>Select Package</CardTitle>
        <CardDescription>Choose the perfect package for your event</CardDescription>
      </CardHeader>
       <CardContent>
        <FieldGroup>
      <FieldSet>
        <RadioGroup 
        value={selectedPackage}
        onValueChange={onPackageChange}
        >
          <FieldLabel htmlFor="classic">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Classic Package</FieldTitle>
                <FieldDescription>
                  Price: {classicPackagePrice}
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
                  Price: {vintagePackagePrice}
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
       </CardContent>
    </Card>
    
   
    </>
  )
}
