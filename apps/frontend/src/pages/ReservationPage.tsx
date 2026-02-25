import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { type Reservation } from "@/lib/types"
import { useEffect, useState } from "react"



export function ReservationPage() {


    const navigate = useNavigate()
    const { reservationNo } = useParams()
    const [reservation, setReservation] = useState<Reservation | null>(null)
    const [isFetching, setIsFetching] = useState<boolean>(false)

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
                setIsFetching(false)
                setReservation(null)
            }

            const json = await res.json()
            
            setIsFetching(false)
            setReservation(json.data)
        }

        loadReservation()
    }, [reservationNo])

    // Always prepare for errors
    // if (error) {
    //     return <></>
    // }

    // Show loading while reservation is still fetching
    if (!reservation && isFetching) return <p>Loading</p>

    if (!reservation && !isFetching) return <p>Reservation not found.</p>

    const totalPrice =
        reservation.selectedPackage === "classic"
            ? reservation.guestCount * 50
            : reservation.guestCount * 100

    return (
        <>
            <h1>Event Date: {new Date(reservation.eventDate).toLocaleDateString()}</h1>
            <h1>Number of guests: {reservation.guestCount}</h1>
            <h1>Package: {reservation.selectedPackage}</h1>
            <h1>Total Price: {totalPrice}</h1>
            <Button type="button" onClick={() =>
                navigate("/", {
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
