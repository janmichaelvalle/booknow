import { EventDetails } from "@/components/quotation/EventDetails";
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { AddOns } from "@/components/quotation/AddOns";

import { CustomerDetailsDialog } from "@/components/quotation/CustomerDetailsDialog";

import * as z from "zod"
import { useNavigate, useParams } from "react-router-dom"
import { type Offerings, type QuotationValues, type CoverageResult } from "@/lib/types"
import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"

import { calculateQuotationTotals } from "@/lib/quotation";

import { useState } from "react";

import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"
import { type BusinessInformation } from "@/lib/types";
import { BusinessHeader } from "@/components/quotation/BusinessHeader";
import { StickyOrderSummary } from "@/components/quotation/StickyOrderSummary"


// The quotationSchema validates the user inputs 
const quotationDetailsSchema = z
  .object({
    eventDate: z.date({
      error: (issue) =>
        issue.input === undefined
          ? "Event date is required"
          : "Invalid date",
    }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    venue: z.string().min(1, "Venue is required"),
    occasion: z.string().min(1, "Occasion is required"),
    occasionOther: z.string(),
    guestCount: z
      .number()
      .int()
      .min(1, "Guest count must be at least 1"),
    selectedPackage: z.string().min(1, "Package is required"),
  })
  .refine(
    (values) =>
      values.occasion !== "other" ||
      values.occasionOther.trim().length > 0,
    {
      message: "Please specify the occasion",
      path: ["occasionOther"],
    }
  )

const quotationSchema = quotationDetailsSchema.safeExtend({
  selectedAddOns: z.record(z.string(), z.number()),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.email("Valid email is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
})




export function QuotationPage() {

  const [venueCoverage, setVenueCoverage] =
    useState<CoverageResult | null>(null)

  const navigate = useNavigate()
  const { businessSlug } = useParams()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false)


  const defaultValues: QuotationValues = {
    eventDate: undefined,
    startTime: "",
    endTime: "",
    venue: "",
    occasion: "",
    occasionOther: "",
    guestCount: undefined,
    selectedPackage: "",
    selectedAddOns: {},
    customerName: "",
    customerEmail: "",
    customerPhone: ""
  }

  const { data: business } = useQuery({
    queryKey: ["business", businessSlug],
    queryFn: async (): Promise<BusinessInformation> => {
      const res = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}`
      )
      if (!res.ok) {
        throw new Error("Failed to fetch business information")
      }
      const result = await res.json()
      return result.data
    },

    enabled: !!businessSlug,
  })

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
      // onChange: quotationSchema,
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

      const transportationFee = venueCoverage?.transportationFee ?? 0
      const totals = calculateQuotationTotals(value, offerings)
      const grandTotal = totals.grandTotal + transportationFee


      const payload = {
        eventDate: value.eventDate.toISOString(),
        startTime: value.startTime,
        endTime: value.endTime,
        venue: value.venue,
        occasion:
          value.occasion === "other"
            ? value.occasionOther.trim()
            : value.occasion,
        guestCount: value.guestCount,
        selectedPackageId: value.selectedPackage,
        selectedAddOns: value.selectedAddOns,
        packageTotal: totals.packageTotal,
        addOnsTotal: totals.addOnsTotal,
        transportationFee: transportationFee,
        grandTotal: grandTotal,
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



  function handleGetMyQuotationClick() {
    const result = quotationDetailsSchema.safeParse(form.state.values)


    if (!result.success) {
      const fieldLabels: Record<string, string> = {
        eventDate: "event date",
        startTime: "start time",
        endTime: "end time",
        venue: "venue",
        guestCount: "number of guests",
        selectedPackage: "package",
      }

      const missingFields = [
        ...new Set(
          result.error.issues.map((issue) => {
            const fieldName = String(issue.path[0])
            return fieldLabels[fieldName] ?? fieldName
          })
        ),
      ]

      const formattedFields = new Intl.ListFormat("en", {
        style: "long",
        type: "conjunction",
      }).format(missingFields)

      toast.error(`Please provide the ${formattedFields}.`, {
        position: "top-center",
      })

      return
    }

    if (!venueCoverage?.isCovered) {
      toast.error("Please select a venue within the service area", {
        position: "top-center",
      })

      return
    }

    setIsCustomerDetailsOpen(true)
  }


  async function handleCreateMyQuotationClick() {
    await form.validate("submit")

    if (!form.state.isFormValid) {
      toast.error("Please provide your complete customer details.", {
        position: "top-center",
      })

      return
    }

    await toast.promise(
      async () => {
        await form.handleSubmit()
      },
      {
        loading: "Creating your quotation...",
        success: "Your quotation was created successfully.",
        error: "Something went wrong. Please try again.",
        position: "top-center",
      }
    )
  }


  return (
    <>
      <form
        onSubmit={(e) => {
          console.log("Form submit event fired")
          console.log("Current form values:", form.state.values)
          e.preventDefault()
          e.stopPropagation()
          handleCreateMyQuotationClick()
        }}
        className="space-y-6 pb-40"
      >
        {business && (
          <BusinessHeader
            logoUrl={business.logo_url ?? ""}
            businessName={business.name}
            description={business.description ?? ""}
          />
        )}
        <EventDetails
          form={form}
          venueCoverage={venueCoverage}
          onVenueCoverageChange={setVenueCoverage}
        />
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


                <StickyOrderSummary
                  basePrice={totals.packageTotal}
                  addOnsPrice={totals.addOnsTotal}
                  transportationFee={venueCoverage?.transportationFee ?? 0}
                  onGetMyQuotationButtonClick={handleGetMyQuotationClick}
                />

                <CustomerDetailsDialog
                  form={form}
                  onCreateMyQuotationButtonClick={handleCreateMyQuotationClick}
                  open={isCustomerDetailsOpen}
                  onOpenChange={setIsCustomerDetailsOpen}
                />


              </>
            )
          }}
        </form.Subscribe>
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