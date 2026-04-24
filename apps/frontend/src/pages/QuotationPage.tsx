import { EventDetails } from "@/components/quotation/EventDetails";
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { AddOns } from "@/components/quotation/AddOns";
import { SummaryDetails } from "@/components/quotation/SummaryDetails";
import { Button } from "@/components/ui/button"

import * as z from "zod"
import { useNavigate, useParams } from "react-router-dom"
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
  const { businessSlug } = useParams()

  const defaultValues: QuotationValues = {
    eventDate: undefined,
    startTime: "",
    endTime: "",
    venue: "",
    guestCount: undefined,
    selectedPackage: "classic",
  }



  const form = useForm({
    // Inital form state
    defaultValues: defaultValues,
    // Everytime a form values changes, checks the quotationSchema
    validators: {
      onChange: quotationSchema,
    },
    onSubmit: async ({ value }) => {
      if (!businessSlug) {
        console.error("Business slug is missing from the URL")
        return
      }

      if (!value.eventDate) {
        console.error("Event date is required")
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


  return (
    <>
      <h1>This is the quotation page</h1>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          e.stopPropagation()
          form.handleSubmit()
        }}
        className="space-y-6"
      >
        <EventDetails form={form} />
        {/* form.Subscribe watches part of the TanStack form state.
        The selector receives the full form state and returns only state.values,
        so this UI re-renders when the form values change. */}
        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            const guestCount = values.guestCount ?? 0
            const classicPackagePrice = guestCount * 50
            const vintagePackagePrice = guestCount * 100
            const basePrice =
              values.selectedPackage === "classic"
                ? classicPackagePrice
                : vintagePackagePrice


            return (
              <>
                <PackageDetails
                  form={form}
                  classicPackagePrice={classicPackagePrice}
                  vintagePackagePrice={vintagePackagePrice}

                />
                <AddOns
                />
                <SummaryDetails
                  basePrice={basePrice}
                  addOnsPrice={2500}
                />
                <h1>Summary</h1>
                <p>
                  Event date:{" "}
                  {values.eventDate
                    ? values.eventDate.toLocaleDateString()
                    : "Not selected"}
                </p>
                <p>
                  Event time:{" "}
                  {values.startTime
                    ? values.startTime
                    : "Not selected"}
                </p>
                <p>Guests: {values.guestCount}</p>
                <p>Package: {values.selectedPackage || "None selected"}</p>
              </>
            )
          }}
        </form.Subscribe>
        <Button type="submit">Generate Quotation</Button>
      </form>
    </>


  )

}