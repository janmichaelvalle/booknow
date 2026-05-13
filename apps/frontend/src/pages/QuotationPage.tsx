import { EventDetails } from "@/components/quotation/EventDetails";
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { AddOns } from "@/components/quotation/AddOns";
import { SummaryDetails } from "@/components/quotation/SummaryDetails";
import { Button } from "@/components/ui/button"

import * as z from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { type Offerings, type QuotationValues } from "@/lib/types"
import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query";
import { add } from "date-fns";


// The quotationSchema validates the user inputs
const quotationSchema = z.object({
  eventDate: z.date(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  venue: z.string().min(1, "Venue is required"),
  guestCount: z.number().int().min(1, "Guest count must be at least 1"),
  selectedPackage: z.string().min(1, "Package is required"),
  selectedAddOns: z.record(z.string(), z.number())
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
    selectedPackage: "",
    selectedAddOns: {}
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

            const selectedPricing = offerings.packagePricing.find((price) => {
              const matchesPackage = price.package_id === values.selectedPackage
              const matchesMinGuests = guestCount >= price.min_guests
              const matchesMaxGuests =
                price.max_guests === null || guestCount <= price.max_guests

              return matchesPackage && matchesMinGuests && matchesMaxGuests
            })

            const basePrice = selectedPricing
              ? guestCount * selectedPricing.price_per_guest
              : 0

            const selectedPackage = offerings.packages.find(
              (pkg) => pkg.id === values.selectedPackage
            )


            const selectedPackageSummary = {
              name: selectedPackage?.name ?? "",
              pricePerGuest: selectedPricing?.price_per_guest ?? 0,
              guestCount,
              basePrice,
            }


            const addsOnsTotal = offerings.addons.reduce((sum, addon) => {
              const quantity = values.selectedAddOns[addon.id] ?? 0
              return sum + addon.price * quantity
            }, 0)

            const selectedAddOnItems = offerings.addons
              // .map() goes through all items of the array one by one
              .map((addon) => {

                // quantity stores the selected quantities of that specific add-on
                const quantity = values.selectedAddOns[addon.id] ?? 0

                // If quantity is zero return nothing because the user did not select anything
                if (quantity === 0) return null

                // creates a new object
                return {
                  id: addon.id,
                  name: addon.name,
                  price: addon.price,
                  quantity: quantity,
                  lineTotal: addon.price * quantity,
                }
              })
              // .filter removes null values in the array
              .filter(Boolean)


            return (
              <>
                <PackageDetails
                  form={form}
                  packages={offerings.packages}
                  packagePricing={offerings.packagePricing}
                  guestCount={guestCount}

                />
                <AddOns
                  addons={offerings.addons}
                  form={form}
                />
                <SummaryDetails
                  basePrice={basePrice}
                  addOnsPrice={addsOnsTotal}
                  selectedAddOnItems={selectedAddOnItems}
                  selectedPackageSummary={selectedPackageSummary}
                />

              </>
            )
          }}
        </form.Subscribe>
        <Button type="submit">Generate Quotation</Button>
      </form>
    </>


  )

}