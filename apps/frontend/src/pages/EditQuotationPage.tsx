import type { Reservation } from "@/lib/types"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useParams } from "react-router-dom"
import { Link } from "react-router-dom"
import { EventDetails } from "@/components/quotation/EventDetails"
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { type QuotationValues } from "@/lib/types"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

// Pick creates a smaller type from QuotationValues using only the fields this form needs.
type EditQuotationFormValues = Pick<
  QuotationValues,
  "eventDate" | "guestCount" | "selectedPackage"
>



export function EditQuotationPage() {

  // Instantiate navgiate
   const navigate = useNavigate()

  // Gets the reservationNo in the URL parameter
  const { reservationNo } = useParams()
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [isFetching, setIsFetching] = useState<boolean>(false)

  // Setup from with default values
  const form = useForm<EditQuotationFormValues>({
    defaultValues: {
      eventDate: undefined,
      guestCount: undefined,
      selectedPackage: "classic",
    },
  })


  useEffect(() => {
    // If there is no reservationNo from the URL, stop immediately.
    if (!reservationNo) return

    async function loadReservation() {
      setIsFetching(true)

      // // Fetch the reservation that matches the reservationNo from the URL.
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/reservations/${reservationNo}`)

      // converts the response into JavaScript data
      const json = await res.json()
      // Treat json.data as a Reservation object.
      const data = json.data as Reservation

      // Replaces the form's current values with fetched data
      form.reset({
        // Convert the API date string into a JavaScript Date object for the form.
        eventDate: new Date(data.eventDate),
        guestCount: data.guestCount,
        selectedPackage: data.selectedPackage,
      })

      // When fetching and form reset is done, remove loading state and add reservation data
      setIsFetching(false)
      setReservation(data)

    }
    // Call loadReservation function
    loadReservation()

    // reservationNo, form is a dependency array which tells react to run this effect again when these two change.
  }, [reservationNo, form])



  // Show loading while reservation is still fetching
  if (!reservation) {
    if (isFetching) return <p>Loading</p>;
    return <p>Reservation not found.</p>;
  }


  const guestCount = form.watch("guestCount") ?? 0
  const classicPackagePrice = guestCount * 50
  const vintagePackagePrice = guestCount * 100

  // Data comes from react hook form 
  async function onSubmit(data: EditQuotationFormValues) {
  
  
  // if reservationNo is missing, stop the function immediately
  if (!reservationNo) return

  // Takes the values in the form and converts data to what the API requires to submitted.
  const payload = {
    eventDate: data.eventDate.toISOString(),
    guestCount: data.guestCount,
    selectedPackage: data.selectedPackage,
  }

  
  // Send the updated reservation data to the backend API.
  const res = await fetch(
    `${import.meta.env.VITE_BASE_URL}/api/reservations/${reservationNo}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  )

  if (!res.ok) {
    console.error("Failed to update reservation")
    return
  }

  navigate(`/reservation/${reservationNo}`)
}



  return (
    <>
      <h1>This is the edit quotation</h1>
      <Link to="/reservations/${resevationNo}">Back</Link>

      <form onSubmit={form.handleSubmit(onSubmit)}>
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

      <Button type="submit">Save Changes</Button>
      </form>
    </>
  )
}
