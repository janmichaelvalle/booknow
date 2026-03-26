import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"

import { type Reservation } from "@/lib/types"


type EventDetailsCardProps = {
  reservation: Reservation
}


export function EventDetailsCard( {reservation} : EventDetailsCardProps) {
    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle>Event Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <p>Event Date: {reservation.eventDate}</p>
                </CardContent>
                <CardContent>
                    <p>Guests: {reservation.guestCount}</p>
                </CardContent>
            
            </Card>
        </>
    )
}