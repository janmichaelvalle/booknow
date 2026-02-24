import { useParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { type Reservation } from "@/lib/types"
import { useEffect, useState } from "react"



export function ReservationPage() {


    const navigate = useNavigate()
    const { reservationNo } = useParams()
    const [reservation, setReservation] = useState<Reservation | null>(null)

    useEffect(() => {
        if (!reservationNo) return

        async function loadReservation() {
            const res = await fetch(
                `${import.meta.env.VITE_BASE_URL}/api/reservations/${reservationNo}`
            )
            if (!res.ok) return

            const json = await res.json()
            setReservation(json.data)
        }

        loadReservation()
    }, [reservationNo])




    if (!reservation) return <p>Reservation not found.</p>

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
