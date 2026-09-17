import { TierItems } from "@/components/quotation/TierItems"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type {
  BusinessPackage,
  CalculatedPackage,
  PackageInclusion,
  PackageTier,
  PackageTierItem,
  SelectedPackageValue,
} from "@/lib/types"
import { X } from "lucide-react"

type PackageDetailsProps = {
  packages: BusinessPackage[]
  packageInclusions: PackageInclusion[]
  packageTiers: PackageTier[]
  packageTierItems: PackageTierItem[]
  calculatedPackages: CalculatedPackage[]
  form: any
}

export function PackageDetails({
  packages,
  packageInclusions,
  packageTiers,
  packageTierItems,
  calculatedPackages,
  form,
}: PackageDetailsProps) {
  const selections = form.state.values.selectedPackages as Record<
    string,
    SelectedPackageValue
  >

  function handleTierChange(packageId: string, tierId: string) {
    if (!tierId) return

    const currentSelection = selections[packageId]
    const tierChanged = currentSelection?.tierId !== tierId

    form.setFieldValue("selectedPackages", {
      ...selections,
      [packageId]: {
        tierId,
        selectedTierItems: tierChanged
          ? {}
          : currentSelection?.selectedTierItems ?? {},
      },
    })
  }

  function removePackage(packageId: string) {
    const nextSelections = { ...selections }
    delete nextSelections[packageId]
    form.setFieldValue("selectedPackages", nextSelections)
  }

  return (
    <section className="space-y-4" aria-labelledby="select-packages-heading">
      <div className="space-y-1">
        <h2 id="select-packages-heading" className="text-lg font-semibold">
          Select Packages
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose one or more packages for your event.
        </p>
      </div>

      {packages.map((pkg) => {
        const tiersForPackage = packageTiers
          .filter((tier) => tier.package_id === pkg.id)
          .sort((a, b) => a.sort_order - b.sort_order)
        const selection = selections[pkg.id]
        const selectedTier = tiersForPackage.find(
          (tier) => tier.id === selection?.tierId
        )
        const calculatedPackage = calculatedPackages.find(
          (entry) => entry.package.id === pkg.id
        )
        const sharedInclusions = packageInclusions
          .filter((inclusion) => inclusion.package_id === pkg.id)
          .sort((a, b) => a.sort_order - b.sort_order)
        const tierInclusions = selectedTier
          ? packageTierItems
              .filter(
                (item) =>
                  item.package_tier_id === selectedTier.id &&
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
          <Card key={pkg.id}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <CardTitle>{pkg.name}</CardTitle>
                {pkg.description && (
                  <CardDescription>{pkg.description}</CardDescription>
                )}
              </div>

              {selectedTier && calculatedPackage && (
                <div className="shrink-0 text-right">
                  <p className="font-semibold">
                    ₱{calculatedPackage.total.toLocaleString()}
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => removePackage(pkg.id)}
                  >
                    <X className="size-3" />
                    Remove
                  </Button>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Choose a package size</p>
                <ToggleGroup
                  type="single"
                  variant="outline"
                  spacing={2}
                  value={selection?.tierId ?? ""}
                  onValueChange={(tierId) => handleTierChange(pkg.id, tierId)}
                  aria-label={`Choose a package size for ${pkg.name}`}
                  className="!grid w-full grid-cols-2 gap-2"
                >
                  {tiersForPackage.map((tier) => {
                    const priceText = `₱${tier.price.toLocaleString()}`
                    return (
                      <ToggleGroupItem
                        key={tier.id}
                        value={tier.id}
                        aria-label={`${tier.name}, ${priceText}`}
                        className="h-auto w-full min-w-0 flex-col items-start justify-start gap-1 border-border bg-background px-3 py-3 text-left transition-colors hover:bg-accent/50 data-[state=on]:border-primary data-[state=on]:bg-primary/15 data-[state=on]:ring-2 data-[state=on]:ring-primary/25"
                      >
                        <span className="font-medium">
                          {tier.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {priceText}
                        </span>
                      </ToggleGroupItem>
                    )
                  })}
                </ToggleGroup>
              </div>

              {displayedInclusions.length > 0 && (
                <div className="space-y-2 border-t pt-3">
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

              {calculatedPackage && (
                <TierItems
                  selectedPackage={calculatedPackage}
                  packageTierItems={packageTierItems}
                  form={form}
                />
              )}
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
