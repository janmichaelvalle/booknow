import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { type Reservation } from "@/lib/types"
import { Calendar, Clock3, MapPin, Users } from "lucide-react"
import { format } from "date-fns"

type EventDetailsCardProps = {
    reservation: Reservation
}

export function EventDetailsCard({ reservation }: EventDetailsCardProps) {
    const formattedDate = format(new Date(reservation.eventDate), "EEEE, MMMM d, yyyy")
    const formattedStartTime = format(new Date(`2000-01-01T${reservation.startTime}`), "h:mm a")
    const formattedEndTime = format(new Date(`2000-01-01T${reservation.endTime}`), "h:mm a")

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg uppercase tracking-wide">
                    Event Details
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-5">
                <div className="flex items-start gap-4 rounded-2xl bg-muted/40 p-5">
                    <Calendar className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="text-lg font-semibold">{formattedDate}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-muted/40 p-5">
                    <Clock3 className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="text-lg font-semibold">
                            {formattedStartTime} - {formattedEndTime}
                        </p>
                    </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-muted/40 p-5">
                    <MapPin className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="text-lg font-semibold">{reservation.venue}</p>
                    </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-muted/40 p-5">
                    <Users className="mt-1 h-5 w-5 text-muted-foreground" />
                    <div>
                        <p className="text-sm text-muted-foreground">Number of Guests</p>
                        <p className="text-lg font-semibold">{reservation.guestCount} pax</p>
                    </div>
                </div>
                <div className="my-8 border-t pt-8">
                    <h2 className="text-lg font-semibold uppercase tracking-wide text-muted-foreground">
                        Price Breakdown
                    </h2>
                </div>
                <div className="flex items-center justify-between text-xl">
                    <span className="text-muted-foreground">{reservation.selectedPackageName} for {reservation.guestCount} guests</span>
                    <span>{reservation.packageTotal} </span>
                </div>

                <div className="my-4 border-t" />

                <div className="flex items-center justify-between text-2xl font-semibold">
                    <span>Total Amount</span>
                    <span>PHP 28,000</span>
                </div>
            </CardContent>
        </Card>
    )
}