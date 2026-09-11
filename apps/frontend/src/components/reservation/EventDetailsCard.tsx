import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { type Reservation } from "@/lib/types"
import {
    Calendar,
    Clock3,
    MapPin,
    PartyPopper,
    SquarePen,
    Users,
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

type EventDetailsCardProps = {
    reservation: Reservation
    onEdit: () => void
    canEdit: boolean
}

export function EventDetailsCard({ reservation, onEdit, canEdit }: EventDetailsCardProps) {
    const formattedDate = format(new Date(reservation.eventDate), "EEEE, MMMM d, yyyy")
    const formattedStartTime = format(new Date(`2000-01-01T${reservation.startTime}`), "h:mm a")
    const formattedEndTime = format(new Date(`2000-01-01T${reservation.endTime}`), "h:mm a")
    const formattedCreatedAt = format(
  new Date(reservation.createdAt),
  "MMMM d, yyyy"
)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                   <div>
  <CardTitle className="text-lg">
    Quotation #{reservation.quotationReference}
  </CardTitle>

  <p className="mt-1 text-sm text-muted-foreground">
    Prepared {formattedCreatedAt}
  </p>
</div>

                    {canEdit && (
                        <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
                            <SquarePen className="h-4 w-4" />
                            Edit
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-5">
                {/* Event Details */}
                <section>
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Event Details
                    </h2>

                    <div className="divide-y">
                        <div className="grid grid-cols-[20px_72px_1fr] items-start gap-3 py-3">
                            <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Date</span>
                            <span className="text-right text-sm font-medium">
                                {formattedDate}
                            </span>
                        </div>

                        <div className="grid grid-cols-[20px_72px_1fr] items-start gap-3 py-3">
                            <Clock3 className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Time</span>
                            <span className="text-right text-sm font-medium">
                                {formattedStartTime} – {formattedEndTime}
                            </span>
                        </div>

                        <div className="grid grid-cols-[20px_72px_1fr] items-start gap-3 py-3">
                            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Location</span>
                            <span className="break-words text-right text-sm font-medium">
                                {reservation.venue}
                            </span>
                        </div>

                        <div className="grid grid-cols-[20px_72px_1fr] items-start gap-3 py-3">
                            <PartyPopper className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Occasion</span>
                            <span className="text-right text-sm font-medium capitalize">
                                {reservation.occasion.replaceAll("-", " ")}
                            </span>
                        </div>

                        <div className="grid grid-cols-[20px_72px_1fr] items-start gap-3 py-3">
                            <Users className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Guests</span>
                            <span className="text-right text-sm font-medium">
                                {reservation.guestCount} pax
                            </span>
                        </div>
                    </div>
                </section>
                {/* Price Breakdown */}
                <section className="border-t pt-6">
                    <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                        Price Breakdown
                    </h2>

                    <div className="divide-y">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-3">
                            <span className="text-sm text-muted-foreground">
                                {reservation.selectedPackageName} for {reservation.guestCount} guests
                            </span>

                            <span className="whitespace-nowrap text-sm font-medium">
                                ₱{reservation.packageTotal.toLocaleString()}
                            </span>
                        </div>

                        {reservation.selectedAddOns.map((addon) => (
                            <div
                                key={addon.addonId}
                                className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-3"
                            >
                                <span className="text-sm text-muted-foreground">
                                    {addon.addonName}
                                </span>

                                <span className="whitespace-nowrap text-right text-sm font-medium">
                                    ₱{addon.addonPrice.toLocaleString()} × {addon.quantity}
                                </span>
                            </div>
                        ))}

                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 py-3">
                            <span className="text-sm text-muted-foreground">
                                Transportation fee
                            </span>

                            <span className="whitespace-nowrap text-sm font-medium">
                                ₱{reservation.transportationFee.toLocaleString()}
                            </span>
                        </div>
                    </div>

                    <div className="mt-2 flex items-center justify-between border-t pt-4">
                        <span className="font-semibold">Total Amount</span>

                        <span className="text-lg font-semibold">
                            ₱{reservation.grandTotal.toLocaleString()}
                        </span>
                    </div>
                </section>
                {/* Customer Details */}
                <section className="border-t pt-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Prepared for
                    </p>

                    <p className="mt-2 text-lg font-semibold">
                        {reservation.customerName}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground break-all">
                        {reservation.customerEmail}
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                        {reservation.customerPhone}
                    </p>
                </section>
            </CardContent>
        </Card>
    )
}