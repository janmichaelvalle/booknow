import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Quotation } from "@/lib/types"
import { format } from "date-fns"
import {
  Calendar,
  Clock3,
  MapPin,
  PartyPopper,
  SquarePen,
  Users,
} from "lucide-react"

type QuotationDetailsCardProps = {
  quotation: Quotation
  onEdit: () => void
  canEdit: boolean
}

export function QuotationDetailsCard({
  quotation,
  onEdit,
  canEdit,
}: QuotationDetailsCardProps) {
  const formattedDate = format(new Date(quotation.eventDate), "EEEE, MMMM d, yyyy")
  const formattedCreatedAt = format(new Date(quotation.createdAt), "MMMM d, yyyy")
  const formattedStartTime = format(
    new Date(`2000-01-01T${quotation.startTime}`),
    "h:mm a"
  )
  const formattedEndTime = format(
    new Date(`2000-01-01T${quotation.endTime}`),
    "h:mm a"
  )

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg">
              Quotation #{quotation.quotationReference}
            </CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Prepared {formattedCreatedAt}
            </p>
          </div>
          {canEdit && (
            <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
              <SquarePen className="size-4" />
              Edit
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Event Details
          </h2>
          <div className="divide-y">
            {[
              [Calendar, "Date", formattedDate],
              [Clock3, "Time", `${formattedStartTime} – ${formattedEndTime}`],
              [MapPin, "Location", quotation.venue],
              [PartyPopper, "Occasion", quotation.occasion.replaceAll("-", " ")],
              [Users, "Guests", `${quotation.guestCount} pax`],
            ].map(([Icon, label, value]) => {
              const RowIcon = Icon as typeof Calendar
              return (
                <div
                  key={String(label)}
                  className="grid grid-cols-[20px_72px_1fr] items-start gap-3 py-3"
                >
                  <RowIcon className="mt-0.5 size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{String(label)}</span>
                  <span className="break-words text-right text-sm font-medium capitalize">
                    {String(value)}
                  </span>
                </div>
              )
            })}
          </div>
        </section>

        <section className="border-t pt-6">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Price Breakdown
          </h2>

          <div className="space-y-5">
            {quotation.packages.map((quotedPackage) => (
              <div key={quotedPackage.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{quotedPackage.packageName}</p>
                    <p className="text-sm text-muted-foreground">
                      {quotedPackage.tierName}
                    </p>
                  </div>
                  <span className="whitespace-nowrap font-medium">
                    ₱{quotedPackage.packageTotal.toLocaleString()}
                  </span>
                </div>

                {quotedPackage.inclusions.length > 0 && (
                  <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
                    {quotedPackage.inclusions.map((inclusion) => (
                      <li key={inclusion.id} className="flex gap-2">
                        <span className="text-green-600">✓</span>
                        <span>
                          {inclusion.quantity === 1
                            ? inclusion.name
                            : `${inclusion.quantity} ${inclusion.unit} — ${inclusion.name}`}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {quotedPackage.selectedItems.length > 0 && (
                  <div className="mt-3 divide-y border-t">
                    {quotedPackage.selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start justify-between gap-4 py-2 text-sm"
                      >
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="whitespace-nowrap">
                          ₱{item.unitPrice.toLocaleString()} × {item.quantity}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {quotedPackage.selectedItemsTotal > 0 && (
                  <div className="flex justify-between border-t pt-3 text-sm font-medium">
                    <span>Package subtotal</span>
                    <span>₱{quotedPackage.total.toLocaleString()}</span>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Packages</span>
              <span>₱{quotation.packagesTotal.toLocaleString()}</span>
            </div>
            {quotation.selectedItemsTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Extras &amp; upgrades</span>
                <span>₱{quotation.selectedItemsTotal.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Transportation fee</span>
              <span>₱{quotation.transportationFee.toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-4 text-lg font-semibold">
              <span>Total Amount</span>
              <span>₱{quotation.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </section>

        <section className="border-t pt-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Prepared for
          </p>
          <p className="mt-2 text-lg font-semibold">{quotation.customerName}</p>
          <p className="mt-1 break-all text-sm text-muted-foreground">
            {quotation.customerEmail}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {quotation.customerPhone}
          </p>
        </section>
      </CardContent>
    </Card>
  )
}
