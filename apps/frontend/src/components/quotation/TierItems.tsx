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
import type { PackageTierItem } from "@/lib/types"

type TierItemsProps = {
  packageTierItems: PackageTierItem[]
  selectedPackageTierId: string
  form: any
}

export function TierItems({
  packageTierItems,
  selectedPackageTierId,
  form,
}: TierItemsProps) {
  if (!selectedPackageTierId) {
    return null
  }

  const selectableItems = packageTierItems
    .filter(
      (item) =>
        item.package_tier_id === selectedPackageTierId &&
        (item.item_type === "extra" ||
          item.item_type === "upgrade")
    )
    .sort((a, b) => a.sort_order - b.sort_order)

  if (selectableItems.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Extras &amp; Upgrades</CardTitle>

        <CardDescription>
          Customize your selected package with optional items.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form.Field name="selectedTierItems">
          {(field: any) => {
            const selectedItems = field.state.value ?? {}

            return (
              <div className="space-y-3">
                {selectableItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 rounded-lg border p-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium">{item.name}</p>

                        <Badge variant="outline">
                          {item.item_type === "upgrade"
                            ? "Upgrade"
                            : "Extra"}
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
                        value={selectedItems[item.id] ?? 0}
                        onValueChange={(quantity) => {
                          const nextQuantity = quantity ?? 0
                          const nextSelectedItems = {
                            ...selectedItems,
                          }

                          if (nextQuantity <= 0) {
                            delete nextSelectedItems[item.id]
                          } else {
                            nextSelectedItems[item.id] = nextQuantity
                          }

                          field.handleChange(nextSelectedItems)
                        }}
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
              </div>
            )
          }}
        </form.Field>
      </CardContent>
    </Card>
  )
}