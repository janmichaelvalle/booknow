import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel, FieldSet, FieldTitle } from "@/components/ui/field"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Badge } from "@/components/ui/badge"
import type {
  BusinessPackage,
  PackageInclusion,
  PackageTier,
  PackageTierItem,
} from "../../lib/types"
import { useEffect } from "react"


type PackageDetailsProps = {
  packages: BusinessPackage[]
  packageInclusions: PackageInclusion[]
  packageTiers: PackageTier[]
  packageTierItems: PackageTierItem[]
  guestCount: number
  form: any
}

export function PackageDetails({
  packages,
  packageInclusions,
  packageTiers,
  packageTierItems,
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

                      const isSelected = field.state.value === pkg.id

                      const previewTier =
                        pkg.tier_type === "guests"
                          ? guestCount > 0
                            ? tiersForPackage.find(
                              (tier) => tier.tier_value >= guestCount
                            )
                            : undefined
                          : tiersForPackage[0]

                      const selectedManualTier =
                        pkg.tier_type !== "guests" && isSelected
                          ? tiersForPackage.find(
                            (tier) => tier.id === selectedPackageTierId
                          )
                          : undefined

                      const tierToDisplay =
                        pkg.tier_type === "guests"
                          ? previewTier
                          : selectedManualTier

                      const priceTier = tierToDisplay ?? previewTier

                      const pricingQuantity =
                        pkg.tier_type === "guests"
                          ? guestCount
                          : priceTier?.tier_value ?? 0

                      const previewPrice = priceTier
                        ? priceTier.pricing_type === "fixed"
                          ? priceTier.price
                          : priceTier.price * pricingQuantity
                        : null

                      const priceLabel =
                        pkg.tier_type === "guests" && guestCount <= 0
                          ? "Enter guest count"
                          : previewPrice === null
                            ? "Unavailable"
                            : pkg.tier_type !== "guests" && !selectedManualTier
                              ? `From ₱${previewPrice.toLocaleString()}`
                              : `₱${previewPrice.toLocaleString()}`

                      const sharedInclusions = packageInclusions
                        .filter((inclusion) => inclusion.package_id === pkg.id)
                        .sort((a, b) => a.sort_order - b.sort_order)

                      const tierInclusions = tierToDisplay
                        ? packageTierItems
                          .filter(
                            (item) =>
                              item.package_tier_id === tierToDisplay.id &&
                              (item.item_type === "inclusion" ||
                                item.item_type === "freebie")
                          )
                          .sort((a, b) => a.sort_order - b.sort_order)
                        : []

                      const displayedInclusions = [
                        ...tierInclusions.map((item) => ({
                          ...item,
                          displayKey: `tier-${item.id}`,
                        })),
                        ...sharedInclusions.map((item) => ({
                          ...item,
                          displayKey: `package-${item.id}`,
                        })),
                      ]

                   

 

                      return (
                        <div
                          key={pkg.id}
                          className={`rounded-xl border p-4 transition-colors ${isSelected ? "border-primary bg-muted/30" : ""
                            }`}
                        >
                          <Field orientation="horizontal" className="items-start">
                            <RadioGroupItem
                              value={pkg.id}
                              id={pkg.id}
                              className="mt-1"
                            />

                            <FieldContent>
                              <FieldLabel
                                htmlFor={pkg.id}
                                className="block w-full cursor-pointer"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <FieldTitle>{pkg.name}</FieldTitle>
                                  <FieldTitle>{priceLabel}</FieldTitle>
                                </div>
                              </FieldLabel>

                              {tierToDisplay && (
                                <Badge>
                                  {tierToDisplay.tier_value} {pkg.tier_type}
                                </Badge>
                              )}

                              <FieldDescription>{pkg.description}</FieldDescription>

                              {displayedInclusions.length > 0 && (
                                <div className="mt-3 space-y-2 border-t pt-3">
                                  <p className="text-sm font-medium">Inclusions:</p>

                                  <ul className="space-y-1.5 text-sm text-muted-foreground">
                                    {displayedInclusions.map((item) => (
                                      <li key={item.displayKey} className="flex gap-2">
                                        <span className="text-green-600">✓</span>

                                        <span>
                                          {item.quantity === 1
                                            ? item.name
                                            : `${item.quantity} ${item.unit} — ${item.name}`}
                                        </span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                             
                            </FieldContent>
                          </Field>
                        </div>
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
