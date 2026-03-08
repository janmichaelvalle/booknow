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
    if (!reservation) {
        if (isFetching) return <p>Loading</p>;
        return <p>Reservation not found.</p>;
    }
    
    /*
    reservationData is just a TypeScript safety alias after null-check.
    It is not new data.
    It tells TS: “from here onward, this is definitely not null
    */
    const reservationData = reservation;


    const totalPrice =
        reservationData.selectedPackage === "classic"
            ? reservationData.guestCount * 50
            : reservationData.guestCount * 100

    return (
        <>
            <h1>Event Date: {new Date(reservationData.eventDate).toLocaleDateString()}</h1>
            <h1>Number of guests: {reservationData.guestCount}</h1>
            <h1>Package: {reservationData.selectedPackage}</h1>
            <h1>Total Price: {totalPrice}</h1>
            <Button type="button" onClick={() =>
                navigate("/", {
                    state: {
                        eventDate: reservationData.eventDate,
                        guestCount: reservationData.guestCount,
                        selectedPackage: reservationData.selectedPackage,
                    }
                })}>
                Edit quotation
            </Button>
        </>
    )

}
