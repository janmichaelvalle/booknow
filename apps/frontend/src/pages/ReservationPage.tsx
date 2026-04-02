import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { type Reservation, type PaymentMethod } from "@/lib/types"
import { Link } from "react-router-dom"
import { EventDetailsCard } from "@/components/reservation/EventDetailsCard"
import { PackageDetailsCard } from "@/components/reservation/PackageDetailsCard"
import { PaymentMethodSelector } from "@/components/reservation/PaymentMethodSelector"
import { useQuery } from "@tanstack/react-query"



export function ReservationPage() {
    const navigate = useNavigate()
    const { reservationId, businessSlug } = useParams()

    const { data: reservation, isPending: isReservationPending, error: reservationError,} = useQuery({
        queryKey: ["reservation", businessSlug, reservationId],
        queryFn: async (): Promise<Reservation> => {
            const res = await fetch(
                `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservation/${reservationId}`
            )

            if (!res.ok) {
                throw new Error("Failed to fetch reservation")
            }

            const data = await res.json()
            return data.data ?? []
        },
        enabled: !!businessSlug && !!reservationId,
    })


    const { data: paymentMethods, isPending: isPaymentMethodsPending, error: paymentMethodsError } = useQuery({
        queryKey: ["paymentMethods", businessSlug],
        queryFn: async (): Promise<PaymentMethod[]> => {
            const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/payment-methods`)
            if (!res.ok) {
                throw new Error("Failed to fetch payment Methods")
            }
            const data = await res.json()
            return data.data ?? []
        },
        enabled: !!businessSlug,
        initialData: [],
    })

    if (!businessSlug || !reservationId) {
        return <p>Missing route parameters.</p>
    }

    if (isReservationPending) {
        return <p>Loading reservation...</p>
    }

    if (reservationError) {
        return <p>Failed to load reservation.</p>
    }

    if (!reservation) {
        return <p>Reservation not found.</p>
    }

    if (isPaymentMethodsPending) {
        return <p>Loading payment methods...</p>
    }

    if (paymentMethodsError) {
        return <p>Failed to load payment methods.</p>
    }


    const packagePrice = (reservation.selectedPackage === "classic" ? reservation.guestCount * 50 : reservation.guestCount * 100)

    return (
        <>
            <Link to={`/${businessSlug}/reservations`}>Back</Link>
            <h1>This is the reservation page</h1>
            <Button type="button" onClick={() =>
                navigate(`/${businessSlug}/reservation/${reservationId}/edit`, {
                    state: {
                        eventDate: reservation.eventDate,
                        guestCount: reservation.guestCount,
                        selectedPackage: reservation.selectedPackage,
                    }
                })}>
                Edit quotation
            </Button>
            <EventDetailsCard
                reservation={reservation}
            />
            <PackageDetailsCard
                packagePrice={packagePrice}
                selectedPackage={reservation.selectedPackage} />
            <PaymentMethodSelector
                paymentMethods={paymentMethods}
                packagePrice={packagePrice}
            />
        </>
    )

}
