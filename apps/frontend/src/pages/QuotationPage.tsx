import { EventDetails } from "@/components/quotation/EventDetails";
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { AddOns } from "@/components/quotation/AddOns";
import { SummaryDetails } from "@/components/quotation/SummaryDetails";
import { Button } from "@/components/ui/button"

import * as z from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { type Offerings, type QuotationValues } from "@/lib/types"
import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"
import { CustomerDetails } from "@/components/quotation/CustomerDetails"
import { calculateQuotationTotals } from "@/lib/quotation";

import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"



// The quotationSchema validates the user inputs
const quotationSchema = z.object({
  eventDate: z.date({
    error: (issue) =>
      issue.input === undefined ? "Event date is required" : "Invalid date",
  }),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required"),
  guestCount: z.number().int().min(1, "Guest count must be at least 1"),
  selectedPackage: z.string().min(1, "Package is required"),
  selectedAddOns: z.record(z.string(), z.number()),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.email("Valid email is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
})



export function QuotationPage() {

  const navigate = useNavigate()
  const { businessSlug } = useParams()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)


  const defaultValues: QuotationValues = {
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
  }

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


  const form = useForm({
    // Inital form state
    defaultValues: defaultValues,
    // Everytime a form values changes, checks the quotationSchema
    validators: {
      onChange: quotationSchema,
      onSubmit: quotationSchema,
    },
    onSubmit: async ({ value }) => {
      console.log("Submit reached")
      console.log(value)
      if (!businessSlug) {
        console.error("Business slug is missing from the URL")
        return
      }

      if (!value.eventDate) {
        console.error("Event date is required")
        return
      }

      const totals = calculateQuotationTotals(value, offerings)


      const payload = {
        eventDate: value.eventDate.toISOString(),
        startTime: value.startTime,
        endTime: value.endTime,
        venue: value.venue,
        guestCount: value.guestCount,
        selectedPackageId: value.selectedPackage,
        selectedAddOns: value.selectedAddOns,
        packageTotal: totals.packageTotal,
        addOnsTotal: totals.addOnsTotal,
        grandTotal: totals.grandTotal,
        customerName: value.customerName,
        customerEmail: value.customerEmail,
        customerPhone: value.customerPhone,
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

  async function handleReserveClick() {
    await form.validate('submit')

    if (!form.state.isFormValid) {
      return
    }

    setIsConfirmOpen(true)
  }
  return (
    <>
      <form
        onSubmit={(e) => {
          console.log("Form submit event fired")
          console.log("Current form values:", form.state.values)
          e.preventDefault()
          e.stopPropagation()
          handleReserveClick()
        }}
        className="space-y-6"
      >
        <EventDetails form={form} />
        {/* form.Subscribe watches part of the TanStack form state.
        The selector receives the full form state and returns only state.values,
        so this UI re-renders when the form values change. */}
        <form.Subscribe selector={(state) => state.values}>
          {(values) => {
            const totals = calculateQuotationTotals(values, offerings)


            return (
              <>
                <PackageDetails
                  form={form}
                  packages={offerings.packages}
                  packagePricing={offerings.packagePricing}
                  guestCount={totals.guestCount}

                />

                <AddOns
                  addons={offerings.addons}
                  form={form}
                />
                <SummaryDetails
                  basePrice={totals.packageTotal}
                  addOnsPrice={totals.addOnsTotal}
                  selectedAddOnItems={totals.selectedAddOnItems}
                  selectedPackageSummary={totals.selectedPackageSummary}
                />

                <CustomerDetails form={form} />

              </>
            )
          }}
        </form.Subscribe>
        <Button type="button" onClick={handleReserveClick}>Reserve Date</Button>
      </form>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={async () => {
          await toast.promise(
            async () => {
              await form.handleSubmit()
              setIsConfirmOpen(false)
            },
            {
              loading: "Submitting your reservation...",
              success: "Your reservation has been submitted successfully",
              error: "Something went wrong. Please try again.",
              position: "top-center",
            }
          )
        }}

      />
    </>


  )

}