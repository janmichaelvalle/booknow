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
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"

// Pick creates a smaller type from QuotationValues using only the fields this form needs.
type EditQuotationFormValues = Pick<
  QuotationValues,
  "eventDate" | "guestCount" | "selectedPackage"
>



export function EditQuotationPage() {

  // Instantiate navgiate
  const navigate = useNavigate()

  // Gets the reservationNo in the URL parameter
  const { reservationId, businessSlug } = useParams()

  const { data: offerings, isPending: isOfferingPending, error: offeringsError } = useQuery({
    queryKey: ["offerings", businessSlug],
    queryFn: async (): Promise<Offerings> => {
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/offerings`)
      if (!res.ok) {
        throw new Error("Failed to fetch offerings")
      }
      const data = await res.json()
      return data.data ?? {
        packages: [],
        packagePricing: [],
        addons: [],
      }
    },
    enabled: !!businessSlug,
    initialData: {
      packages: [],
      packagePricing: [],
      addons: [],
    }

  })

  const { data: reservation, isPending: isReservationPending, error: reservationError, } = useQuery({
    queryKey: ["reservation", businessSlug, reservationId],
    queryFn: async (): Promise<Reservation> => {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservation/${reservationId}`
      )

      if (!res.ok) {
        throw new Error("Failed to fetch reservation")
      }

      const data = await res.json()
      return data.data
    },
    enabled: !!businessSlug && !!reservationId,
  })




  // Setup from with default values
  const form = useForm<EditQuotationFormValues>({
    defaultValues: {
      eventDate: undefined,
      startTime: "",
      endTime: "",
      venue: "",
      guestCount: undefined,
      selectedPackage: "",
      selectedAddOns: {},
      customerName: "",
      customerEmail: "",
      customerPhone: ""
    },
  })


  useEffect(() => {

    // If there is no reservationNo from the URL, stop immediately.
    if (!businessSlug || !reservationId) return


    async function loadReservation() {
      setIsFetching(true)

      // // Fetch the reservation that matches the reservationNo from the URL.
      const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservation/${reservationId}`)

      // converts the response into JavaScript data
      const json = await res.json()
      // Treat json.data as a Reservation object.
      const data = json.data as Reservation

      // Replaces the form's current values with fetched data
      form.reset({
        // Convert the API date string into a JavaScript Date object for the form.
        eventDate: new Date(data.eventDate),
        startTime: data.startTime,
        endTime: data.endTime,
        venue: data.venue,
        guestCount: data.guestCount,
        selectedPackage: data.selectedPackageName,
        selectedAddOns: data.selectedAddOns,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone
      })

      // When fetching and form reset is done, remove loading state and add reservation data
      setIsFetching(false)
      setReservation(data)

    }
    // Call loadReservation function
    loadReservation()

    // reservationNo, form is a dependency array which tells react to run this effect again when these two change.
  }, [reservationId, businessSlug, form])


  if (!businessSlug || !reservationId) {
    return <p>Missing route parameters.</p>
  }


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
    if (!businessSlug || !reservationId) return


    // Takes the values in the form and converts data to what the API requires to submitted.
    const payload = {
      eventDate: data.eventDate.toISOString(),
      guestCount: data.guestCount,
      selectedPackage: data.selectedPackage,
    }


    // Send the updated reservation data to the backend API.
    const res = await fetch(
      `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservation/${reservationId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )

    if (!res.ok) {
      throw new Error("Failed to update reservation")
    }


    navigate(`/${businessSlug}/reservation/${reservationId}`)
  }



  return (
    <>
      <h1>This is the edit quotation</h1>
      <Link to={`/${businessSlug}/reservation/${reservationId}`}>Back</Link>
      <form>
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

        <Button type="button" onClick={() => setIsConfirmOpen(true)}>
          Save Changes
        </Button>

      </form>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={async () => {
          await toast.promise(
            async () => {
              await form.handleSubmit(onSubmit)()
              setIsConfirmOpen(false)
            },
            {
              loading: "Updating reservation...",
              success: "Reservation updated successfully.",
              error: "Failed to update reservation.",
              position: "top-center",
            }
          )
        }}

      />


    </>
  )
}
