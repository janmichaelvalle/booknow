import {
  NumberField,
  NumberFieldDecrement,
  NumberFieldGroup,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/reui/number-field"
import { Badge } from "@/components/ui/badge"
import type {
  CalculatedPackage,
  PackageTierItem,
  SelectedPackageValue,
} from "@/lib/types"

type TierItemsProps = {
  packageTierItems: PackageTierItem[]
  selectedPackage: CalculatedPackage
  form: any
}

export function TierItems({
  packageTierItems,
  selectedPackage,
  form,
}: TierItemsProps) {
  const packageId = selectedPackage.package.id
  const items = packageTierItems
    .filter(
      (item) =>
        item.package_tier_id === selectedPackage.selectedTier.id &&
        (item.item_type === "extra" || item.item_type === "upgrade")
    )
    .sort((a, b) => a.sort_order - b.sort_order)

  if (items.length === 0) return null

  const selection = form.state.values.selectedPackages[
    packageId
  ] as SelectedPackageValue

  function changeQuantity(itemId: string, quantity: number) {
    const selections = form.state.values.selectedPackages as Record<
      string,
      SelectedPackageValue
    >
    const currentSelection = selections[packageId]
    if (!currentSelection) return

    const selectedTierItems = { ...currentSelection.selectedTierItems }
    if (quantity <= 0) {
      delete selectedTierItems[itemId]
    } else {
      selectedTierItems[itemId] = quantity
    }

    form.setFieldValue("selectedPackages", {
      ...selections,
      [packageId]: { ...currentSelection, selectedTierItems },
    })
  }

  return (
    <section className="space-y-3 border-t pt-3">
      <h3 className="text-sm font-semibold">Extras &amp; Upgrades</h3>

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
                changeQuantity(item.id, value ?? 0)
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
}
