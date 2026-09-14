import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldTitle } from "@/components/ui/field"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import type { BusinessPackage, PackageTier } from "../../lib/types"
import { useEffect } from "react"

type PackageDetailsProps = {
  packages: BusinessPackage[]
  packageTiers: PackageTier[]
  guestCount: number
  form: any
}


export function PackageDetails({
  packages,
  packageTiers,
  guestCount,
  form,
}: PackageDetailsProps) {

  const selectedPackageId = form.state.values.selectedPackage
  const selectedPackageTierId = form.state.values.selectedPackageTier
  const selectedPackage = packages.find(
    (pkg) => pkg.id === selectedPackageId
  )

  const selectedPackageTiers = packageTiers
    .filter((tier) => tier.package_id === selectedPackageId)
    .sort((a, b) => a.tier_value - b.tier_value)

  const requiresManualTierSelection =
    selectedPackage !== undefined &&
    selectedPackage.tier_type !== "guests"


  useEffect(() => {
    const selectedPackage = packages.find(
      (pkg) => pkg.id === selectedPackageId
    )

    if (selectedPackage?.tier_type !== "guests") {
      return
    }

    const tiersForPackage = packageTiers
      .filter((tier) => tier.package_id === selectedPackageId)
      .sort((a, b) => a.tier_value - b.tier_value)

    const currentTier = tiersForPackage.find(
      (tier) => tier.id === selectedPackageTierId
    )

    const currentTierIsValid =
      currentTier !== undefined &&
      currentTier.tier_value >= guestCount

    if (currentTierIsValid) {
      return
    }

    const recommendedTier = tiersForPackage.find(
      (tier) => tier.tier_value >= guestCount
    )

    const nextTierId = recommendedTier?.id ?? ""

    if (nextTierId === selectedPackageTierId) {
      return
    }

    form.setFieldValue("selectedPackageTier", nextTierId)
    form.setFieldValue("selectedTierItems", {})
  }, [
    form,
    guestCount,
    packageTiers,
    packages,
    selectedPackageId,
    selectedPackageTierId,
  ])

  function handlePackageChange(
    packageId: string,
    handleChange: (value: string) => void
  ) {
    handleChange(packageId)

    const selectedPackage = packages.find((pkg) => pkg.id === packageId)

    const tiersForPackage = packageTiers
      .filter((tier) => tier.package_id === packageId)
      .sort((a, b) => a.tier_value - b.tier_value)

    const recommendedTier =
      selectedPackage?.tier_type === "guests"
        ? tiersForPackage.find((tier) => tier.tier_value >= guestCount)
        : undefined

    form.setFieldValue("selectedPackageTier", recommendedTier?.id ?? "")
    form.setFieldValue("selectedTierItems", {})
  }



  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Select Package</CardTitle>
          <CardDescription>Choose the package that best fits your event.</CardDescription>
        </CardHeader>
        <CardContent>

          <form.Field name="selectedPackage">
            {(field: any) => (
              <FieldGroup>
                <FieldSet>
                  <RadioGroup
                    value={field.state.value}
                    onValueChange={(packageId) =>
                      handlePackageChange(packageId, field.handleChange)
                    }
                  >
                    {packages.map((pkg) => {
                      const tiersForPackage = packageTiers
                        .filter((tier) => tier.package_id === pkg.id)
                        .sort((a, b) => a.tier_value - b.tier_value)

                      const previewTier =
                        pkg.tier_type === "guests"
                          ? tiersForPackage.find((tier) => tier.tier_value >= guestCount)
                          : tiersForPackage[0]

                      const pricingQuantity =
                        pkg.tier_type === "guests"
                          ? guestCount
                          : previewTier?.tier_value ?? 0

                      const previewPrice = previewTier
                        ? previewTier.pricing_type === "fixed"
                          ? previewTier.price
                          : previewTier.price * pricingQuantity
                        : null



                      return (
                        <FieldLabel key={pkg.id} htmlFor={pkg.id}>
                          <Field orientation="horizontal">
                            <RadioGroupItem value={pkg.id} id={pkg.id} />
                            <FieldContent>
                              <div className="flex items-start justify-between gap-4">
                                <FieldTitle>{pkg.name}</FieldTitle>

                                <FieldTitle>
                                  {previewPrice === null
                                    ? "Unavailable"
                                    : `${pkg.tier_type === "guests" ? "" : "From "}₱${previewPrice.toLocaleString()}`}
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
          {
            requiresManualTierSelection && (
              <form.Field name="selectedPackageTier">
                {(field: any) => (
                  <FieldGroup className="mt-4">
                    <FieldSet>
                      <FieldLabel>
                        Choose {selectedPackage.tier_type}
                      </FieldLabel>

                      <RadioGroup
                        value={field.state.value}
                        onValueChange={(tierId) => {
                          field.handleChange(tierId)
                          form.setFieldValue("selectedTierItems", {})
                        }}
                      >
                        {selectedPackageTiers.map((tier) => {
                          const tierTotal =
                            tier.pricing_type === "fixed"
                              ? tier.price
                              : tier.price * tier.tier_value

                          return (
                            <FieldLabel
                              key={tier.id}
                              htmlFor={`tier-${tier.id}`}
                            >
                              <Field orientation="horizontal">
                                <RadioGroupItem
                                  id={`tier-${tier.id}`}
                                  value={tier.id}
                                />

                                <FieldContent>
                                  <div className="flex items-center justify-between gap-4">
                                    <FieldTitle>
                                      {tier.tier_value} {selectedPackage.tier_type}
                                    </FieldTitle>

                                    <FieldTitle>
                                      ₱{tierTotal.toLocaleString()}
                                    </FieldTitle>
                                  </div>

                                  {tier.pricing_type === "per_unit" && (
                                    <FieldDescription>
                                      ₱{tier.price.toLocaleString()} per unit
                                    </FieldDescription>
                                  )}
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
            )
          }


        </CardContent>
      </Card>


    </>
  )
}
