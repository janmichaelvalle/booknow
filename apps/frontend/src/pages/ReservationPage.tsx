import { useLocation, Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { type QuotationValues } from "@/lib/types"



export function ReservationPage() {

   

    const navigate = useNavigate()
    const location = useLocation() // Gets route info object for current page
    const state = location.state as QuotationValues | undefined // Gets the passed data(location.state) as QuotationValues

    if (!state) return <Navigate to="/" replace />

    return (
        <>
            <h1>Event Date: {new Date(state.eventDate).toLocaleDateString()}</h1>
            <h1>Number of guests: {state.guestCount}</h1>
            <h1>Package: {state.selectedPackage}</h1>
            <h1>Total Price: {state.selectedPackagePrice}</h1>
            <Button type="button" onClick={() =>
                navigate("/", {
                    state: {
                        eventDate: state.eventDate,
                        guestCount: state.guestCount,
                        selectedPackage: state.selectedPackage,
                    }
                })}>
                Edit quotation
            </Button>
        </>
    )

}
