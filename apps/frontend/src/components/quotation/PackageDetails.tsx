import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { calculateTierTotal } from "@/lib/quotation-calculation"
import type {
  BusinessPackage,
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
  form: any
}

export function PackageDetails({
  packages,
  packageInclusions,
  packageTiers,
  packageTierItems,
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
    <Card>
      <CardHeader>
        <CardTitle>Select Packages</CardTitle>
        <CardDescription>
          Choose one size from every package you want to include.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {packages.map((pkg) => {
          const tiersForPackage = packageTiers
            .filter((tier) => tier.package_id === pkg.id)
            .sort((a, b) => a.tier_value - b.tier_value)
          const selection = selections[pkg.id]
          const selectedTier = tiersForPackage.find(
            (tier) => tier.id === selection?.tierId
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
            <section key={pkg.id} className="rounded-xl border bg-background p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <h3 className="font-semibold">{pkg.name}</h3>
                  {pkg.description && (
                    <p className="text-sm text-muted-foreground">
                      {pkg.description}
                    </p>
                  )}
                </div>

                {selectedTier && (
                  <div className="shrink-0 text-right">
                    <p className="font-semibold">
                      ₱{calculateTierTotal(selectedTier).toLocaleString()}
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
              </div>

              <div className="mt-4 space-y-2">
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
                    const priceText = `₱${calculateTierTotal(tier).toLocaleString()}`
                    return (
                      <ToggleGroupItem
                        key={tier.id}
                        value={tier.id}
                        aria-label={`${tier.tier_value} ${pkg.tier_unit}, ${priceText}`}
                        className="h-auto w-full min-w-0 flex-col items-start justify-start gap-1 border-border bg-background px-3 py-3 text-left transition-colors hover:bg-accent/50 data-[state=on]:border-primary data-[state=on]:bg-primary/15 data-[state=on]:ring-2 data-[state=on]:ring-primary/25"
                      >
                        <span className="font-medium">
                          {tier.tier_value} {pkg.tier_unit}
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
            </section>
          )
        })}
      </CardContent>
    </Card>
  )
}
