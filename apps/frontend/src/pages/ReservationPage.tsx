import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { type QuotationValues, type Reservation, type PaymentMethod } from "@/lib/types"
import { Link } from "react-router-dom"
import {EventDetailsCard}  from "@/components/reservation/EventDetailsCard"
import { PackageDetailsCard } from "@/components/reservation/PackageDetailsCard"
import { PaymentMethodSelector } from "@/components/reservation/PaymentMethodSelector"



/* Pick is a TypeScript utility type that creates a smaller type from an existing one.
1. Start from QuotationValues.
2. Keep only these keys: "eventDate" | "guestCount" | "selectedPackage".
3. Create a new type called ReservationFormValues.

*/
type ReservationFormValues = Pick<
    QuotationValues,
    "eventDate" | "guestCount" | "selectedPackage"
>


export function ReservationPage() {
    const navigate = useNavigate()
    const { reservationId, businessSlug } = useParams()


    const [reservation, setReservation] = useState<Reservation | null>(null)
    const [isFetching, setIsFetching] = useState<boolean>(false)
    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])

    const form = useForm<ReservationFormValues>({
        defaultValues: {
            eventDate: undefined,
            guestCount: undefined,
            selectedPackage: "classic",
        },
    })

    // Pattern for properly fetching data and handle network (pending, ready, error) state

    // 1. Store data + loading + error (optional) state
    // 2. Set pending state to true when you're about to fetch
    // 3. Make sure to reset pending state after fetch or during errors
    // 4. Have a non-binary condition to check WHEN to show loading state (binary state isn'e enough)


    useEffect(() => {

        if (!businessSlug || !reservationId) return

        async function loadReservation() {
            setIsFetching(true)

            const res = await fetch(
                `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservation/${reservationId}`

            )
            if (!res.ok) {
                setIsFetching(false);
                setReservation(null);
                /*
                 return stops the function immediately.
                 So if res.ok is false:
                 set loading to false
                 clear reservation
                 exit loadReservation() right there
                */
                return;
            }

            const json = await res.json()
            const data = json.data as Reservation
           

            setIsFetching(false)
            setReservation(data)
        }

        loadReservation()

    }, [reservationId, businessSlug, form])

    // Always prepare for errors
    // if (error) {
    //     return <></>
    // }

    

    // START OF USE EFFECT FOR PAYMENT

    useEffect(() => {
        async function loadPaymentMethods() {
            setIsFetching(true)
        
         const res = await fetch(
                `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/payment-methods`

         )
           if (!res.ok) {
                setIsFetching(false);
                setReservation(null);
                return;
            }
            const json = await res.json()
            const data = json.data as PaymentMethod[]
           

            setIsFetching(false)
            setPaymentMethods(data)

        }

        loadPaymentMethods()

    })



    // END OF USER EFFECT PAYMENT


    if (!businessSlug || !reservationId) {
        return <p>Missing route parameters.</p>
    }

    // Show loading while reservation is still fetching
    if (!reservation) {
        if (isFetching) return <p>Loading</p>;
        return <p>Reservation not found.</p>;
    }


    const packagePrice = (reservation.selectedPackage === "classic" ? reservation.guestCount * 50: reservation.guestCount * 100)

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
                selectedPackage={reservation.selectedPackage}/>
            <PaymentMethodSelector
                paymentMethods = {paymentMethods}
            />
        </>
    )

}
