import { EventDetails } from "@/components/quotation/EventDetails";
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { Button } from "@/components/ui/button"

import * as z from "zod"
import { useNavigate, useLocation, useParams } from "react-router-dom"
import { useEffect } from "react";
import { type QuotationValues } from "@/lib/types"
import { useForm } from "@tanstack/react-form"




// The quotationSchema validates the user inputs
const quotationSchema = z.object({
  eventDate: z.date(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required"),
  guestCount: z.number().int().min(1, "Guest count must be at least 1"),
  selectedPackage: z.enum(["classic", "vintage"]),
})




export function QuotationPage() {

  const navigate = useNavigate()
  const location = useLocation()
  const { businessSlug } = useParams()

  const incoming = location.state as QuotationValues | undefined   // This is the values coming from reservation page when user wants to edit

  const defaultValues: QuotationValues = {
    eventDate: undefined,
    startTime: "",
    endTime: "",
    venue: "",
    guestCount: undefined,
    selectedPackage: "classic",
  }


  const form = useForm({
    defaultValues: defaultValues,
    validators: {
      onChange: quotationSchema,
    },
    onSubmit: async ({ value }) => {
      if (!businessSlug) {
        console.error("Business slug is missing from the URL")
        return
      }

      const payload = {
        eventDate: value.eventDate.toISOString(),
        startTime: value.startTime,
        endTime: value.endTime,
        venue: value.venue,
        guestCount: value.guestCount,
        selectedPackage: value.selectedPackage,
      }

      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservation`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        console.error("Failed to create reservation")
        return
      }

      const json = await res.json()
      const reservationId = json?.data?.id

      if (!reservationId) {
        console.error("Reservation ID missing in response")
        return
      }

      navigate(`/${businessSlug}/reservation/${reservationId}`)
    },
  })


  useEffect(() => {
    if (incoming) {
      form.reset({
        eventDate: new Date(incoming.eventDate),
        guestCount: incoming.guestCount,
        selectedPackage: incoming.selectedPackage,
      })
    }
  }, [incoming, form])



  const classicPackagePrice = form.watch("guestCount") * 50
  const vintagePackagePrice = form.watch("guestCount") * 100

  // async function onSubmit(data: z.infer<typeof quotationSchema>) {

  //   // const selectedPackagePrice =
  //   // data.selectedPackage === "classic"
  //   //   ? classicPackagePrice
  //   //   : vintagePackagePrice

  //   if (!businessSlug) {
  //     console.error("Business slug is missing from the URL")
  //     return
  //   }

  //   const payload = {
  //     eventDate: data.eventDate.toISOString(),
  //     startTime: data.startTime,
  //     endTime: data.endTime,
  //     venue: data.venue,
  //     guestCount: data.guestCount,
  //     selectedPackage: data.selectedPackage,
  //   }


  //   const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservation`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(payload)
  //   })

  //   if (!res.ok) {
  //     console.error("Failed to create reservation")
  //     return
  //   }

  //   const json = await res.json()
  //   const reservationId = json?.data?.id

  //   if (!reservationId) {
  //     console.error("Reservation ID missing in response")
  //     return
  //   }

  //   navigate(`/${businessSlug}/reservation/${reservationId}`)

  // }


  return (
    <>
      <h1>This is the quotation page</h1>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <EventDetails
          control={form.control}
        />
        <PackageDetails
          control={form.control}
          classicPackagePrice={classicPackagePrice}
          vintagePackagePrice={vintagePackagePrice}
        />

        <h1>Summary</h1>
        <p>
          Event date:{" "}
          {form.watch("eventDate") ? form.watch("eventDate").toLocaleDateString() : "Not selected"}
        </p>
        <p>Guests: {form.watch("guestCount")}</p>
        <p>Package: {form.watch("selectedPackage") || "None selected"}</p>
        <p>
          {(form.watch("guestCount") ?? 0) &&
            (form.watch("selectedPackage") === "classic"
              ? classicPackagePrice
              : vintagePackagePrice)}
        </p>

        <Button type="submit">Generate Quotation</Button>
      </form>
    </>


  )

}