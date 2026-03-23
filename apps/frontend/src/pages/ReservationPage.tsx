import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { type Reservation } from "@/lib/types"
import { useEffect, useState } from "react"
import { EventDetails } from "@/components/quotation/EventDetails"
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { useForm } from "react-hook-form"
import { type QuotationValues } from "@/lib/types"
import { Link } from "react-router-dom"


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
    const { reservationNo } = useParams()
    const [reservation, setReservation] = useState<Reservation | null>(null)
    const [isFetching, setIsFetching] = useState<boolean>(false)

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
        if (!reservationNo) return

        async function loadReservation() {
            setIsFetching(true)

            const res = await fetch(
                `${import.meta.env.VITE_BASE_URL}/api/reservations/${reservationNo}`
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
            form.reset({
            eventDate: new Date(data.eventDate), // string -> Date
            guestCount: data.guestCount,
            selectedPackage: data.selectedPackage,
        })

            setIsFetching(false)
            setReservation(data)
        }

        loadReservation()
        
    }, [reservationNo, form])

    // Always prepare for errors
    // if (error) {
    //     return <></>
    // }

    // Show loading while reservation is still fetching
    if (!reservation) {
        if (isFetching) return <p>Loading</p>;
        return <p>Reservation not found.</p>;
    }






    const guestCount = form.watch("guestCount") ?? 0
    const classicPackagePrice = guestCount * 50
    const vintagePackagePrice = guestCount * 100

    return (
        <>
            <Link to="/reservations">Back</Link>
            <h1>This is the reservation page</h1>
            <EventDetails
                control={form.control}
            />
            <PackageDetails
                control={form.control}
                classicPackagePrice={classicPackagePrice}
                vintagePackagePrice={vintagePackagePrice}
            />

            <h1>Event Date: {new Date(reservation.eventDate).toLocaleDateString()}</h1>
            <h1>Number of guests: {reservation.guestCount}</h1>
            <h1>Package: {reservation.selectedPackage}</h1>
            Total Price:{" "}{reservation.selectedPackage === "classic" ? classicPackagePrice : vintagePackagePrice}
            <Button type="button" onClick={() =>
                navigate(`/reservation/${reservationNo}/edit`, {
                    state: {
                        eventDate: reservation.eventDate,
                        guestCount: reservation.guestCount,
                        selectedPackage: reservation.selectedPackage,
                    }
                })}>
                Edit quotation
            </Button>
        </>
    )

}
