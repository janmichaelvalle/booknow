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

  const itemsForSelectedTier = packageTierItems.filter(
    (item) => item.package_tier_id === selectedPackageTierId
  )

  const includedItems = itemsForSelectedTier.filter(
    (item) => item.item_type === "inclusion" || item.item_type === "freebie"
  )

  const selectableItems = itemsForSelectedTier.filter(
    (item) => item.item_type === "extra" || item.item_type === "upgrade"
  )

  if (includedItems.length === 0 && selectableItems.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Package Details</CardTitle>
        <CardDescription>
          Review what is included and customize your selected tier.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {includedItems.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-medium">Included</h3>

            <div className="space-y-3">
              {includedItems.map((item) => (
                <div key={item.id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} {item.unit}
                      </p>
                    </div>

                    {item.item_type === "freebie" && (
                      <Badge variant="secondary">Freebie</Badge>
                    )}
                  </div>

                  {item.description && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      {item.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {selectableItems.length > 0 && (
          <section className="space-y-3">
            <div>
              <h3 className="font-medium">Extras and Upgrades</h3>
              <p className="text-sm text-muted-foreground">
                Add optional items to your package.
              </p>
            </div>

            <form.Field name="selectedTierItems">
              {(field: any) => (
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
                          value={field.state.value[item.id] ?? 0}
                          onValueChange={(quantity) => {
                            const nextQuantity = quantity ?? 0
                            const nextSelectedItems = {
                              ...field.state.value,
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
              )}
            </form.Field>
          </section>
        )}
      </CardContent>
    </Card>
  )
}
