import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type {
  CalculatedPackage,
  PackageTierItem,
  SelectedPackageValue,
} from "@/lib/types"

type TierItemsProps = {
  packageTierItems: PackageTierItem[]
  selectedPackages: CalculatedPackage[]
  form: any
}

export function TierItems({
  packageTierItems,
  selectedPackages,
  form,
}: TierItemsProps) {
  const packagesWithItems = selectedPackages
    .map((selectedPackage) => ({
      selectedPackage,
      items: packageTierItems
        .filter(
          (item) =>
            item.package_tier_id === selectedPackage.selectedTier.id &&
            (item.item_type === "extra" || item.item_type === "upgrade")
        )
        .sort((a, b) => a.sort_order - b.sort_order),
    }))
    .filter((entry) => entry.items.length > 0)

  if (packagesWithItems.length === 0) return null

  function changeQuantity(
    packageId: string,
    itemId: string,
    quantity: number
  ) {
    const selections = form.state.values.selectedPackages as Record<
      string,
      SelectedPackageValue
    >
    const selection = selections[packageId]
    if (!selection) return

    const selectedTierItems = { ...selection.selectedTierItems }
    if (quantity <= 0) {
      delete selectedTierItems[itemId]
    } else {
      selectedTierItems[itemId] = quantity
    }

    form.setFieldValue("selectedPackages", {
      ...selections,
      [packageId]: { ...selection, selectedTierItems },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extras &amp; Upgrades</CardTitle>
        <CardDescription>
          Optional items are grouped under the package they belong to.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {packagesWithItems.map(({ selectedPackage, items }) => {
          const packageId = selectedPackage.package.id
          const selection = form.state.values.selectedPackages[
            packageId
          ] as SelectedPackageValue

          return (
            <section key={packageId} className="space-y-3">
              <h3 className="text-sm font-semibold">
                {selectedPackage.package.name}
              </h3>

              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium">{item.name}</p>
                      <Badge variant="outline">
                        {item.item_type === "upgrade" ? "Upgrade" : "Extra"}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                    <p className="text-sm font-medium">
                      ₱{item.price.toLocaleString()} per {item.unit}
                    </p>
                  </div>

                  <div className="w-full max-w-32 shrink-0">
                    <NumberField
                      aria-label={`Quantity for ${item.name}`}
                      min={0}
                      max={item.item_type === "upgrade" ? 1 : 100}
                      size="sm"
                      value={selection.selectedTierItems[item.id] ?? 0}
                      onValueChange={(value) =>
                        changeQuantity(packageId, item.id, value ?? 0)
                      }
                    >
                      <NumberFieldGroup>
                        <NumberFieldDecrement />
                        <NumberFieldInput />
                        <NumberFieldIncrement />
                      </NumberFieldGroup>
                    </NumberField>
                  </div>
                </div>
              ))}
            </section>
          )
        })}
      </CardContent>
    </Card>
  )
}
