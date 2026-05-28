import { useParams } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { EventDetails } from "@/components/quotation/EventDetails"
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { type QuotationValues, type SelectedReservationAddOn, type Offerings, type Reservation } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"
import { useForm } from "@tanstack/react-form"
import { calculateQuotationTotals } from "@/lib/quotation";
import { AddOns } from "@/components/quotation/AddOns";
import { SummaryDetails } from "@/components/quotation/SummaryDetails";
import { CustomerDetails } from "@/components/quotation/CustomerDetails"



type EditQuotationFormProps = {
  reservation: Reservation
  offerings: Offerings
  businessSlug: string
  reservationId: string
}


export function EditQuotationPage() {

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

  if (!businessSlug || !reservationId) {
    return <p>Missing route parameters.</p>
  }

  if (isReservationPending) {
    return <p>Loading reservation...</p>
  }

  if (reservationError) {
    return <p>Failed to load reservation.</p>
  }

  if (!reservation) {
    return <p>Reservation not found.</p>
  }

  if (isOfferingPending) {
    return <p>Loading offerings...</p>
  }

  if (offeringsError) {
    return <p>Failed to load offerings.</p>
  }

  return (
    <EditQuotationForm
      reservation={reservation}
      offerings={offerings}
      businessSlug={businessSlug}
      reservationId={reservationId}
    />
  )
}

   function EditQuotationForm({
  reservation,
  offerings,
  businessSlug,
  reservationId,
}: EditQuotationFormProps) {

    // Instantiate navgiate
  const navigate = useNavigate()

  const selectedAddOnsResult = Object.fromEntries(
    reservation.selectedAddOns.map((addon: SelectedReservationAddOn) => [addon.addonId, addon.quantity])
  )

  const defaultValues: QuotationValues = {
    eventDate: new Date(reservation.eventDate),
    startTime: reservation.startTime,
    endTime: reservation.endTime,
    venue: reservation.venue,
    guestCount: reservation.guestCount,
    selectedPackage: reservation.selectedPackageId,
    selectedAddOns: selectedAddOnsResult,
    customerName: reservation.customerName,
    customerEmail: reservation.customerEmail,
    customerPhone: reservation.customerPhone
  }


  // Setup from with default values
  const form = useForm({
    defaultValues,

    onSubmit: async ({ value }) => {

      if (!businessSlug || !reservationId) {
        console.error("Missing route parameters")
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
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservation/${reservationId}`,
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

      navigate(`/${businessSlug}/reservation/${reservationId}`)

    },
  })


  return (
    <>
      <form
        onSubmit={(e) => {
          console.log("Form submit event fired")
          console.log("Current form values:", form.state.values)
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
        <Button type="submit">Save Changes</Button>
      </form>
    </>


  )
}
