import { BusinessHeader } from "@/components/quotation/BusinessHeader"
import { CustomerDetailsDialog } from "@/components/quotation/CustomerDetailsDialog"
import { EventDetails } from "@/components/quotation/EventDetails"
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { StickyOrderSummary } from "@/components/quotation/StickyOrderSummary"
import { calculateQuotationTotals } from "@/lib/quotation-calculation"
import { toDateOnly } from "@/lib/date-only"
import type {
  BusinessInformation,
  CoverageResult,
  Offerings,
  QuotationValues,
} from "@/lib/types"
import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import * as z from "zod"

const selectedPackageSchema = z.object({
  tierId: z.string().min(1),
  selectedTierItems: z.record(z.string(), z.number().int().min(0)),
})

const quotationDetailsSchema = z
  .object({
    eventDate: z.date({
      error: (issue) =>
        issue.input === undefined ? "Event date is required" : "Invalid date",
    }),
    startTime: z.string().min(1, "Start time is required"),
    endTime: z.string().min(1, "End time is required"),
    venue: z.string().min(1, "Venue is required"),
    venuePlaceId: z.string(),
    venueLocality: z.string().min(1, "Select a venue from the suggestions"),
    venueRegion: z.string().min(1, "Select a venue from the suggestions"),
    occasion: z.string().min(1, "Occasion is required"),
    occasionOther: z.string(),
    guestCount: z.number().int().min(1, "Guest count must be at least 1"),
    selectedPackages: z
      .record(z.string(), selectedPackageSchema)
      .refine((packages) => Object.keys(packages).length > 0, {
        message: "At least one package is required",
      }),
  })
  .refine(
    (values) =>
      values.occasion !== "other" || values.occasionOther.trim().length > 0,
    {
      message: "Please specify the occasion",
      path: ["occasionOther"],
    }
  )

const quotationSchema = quotationDetailsSchema.safeExtend({
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.email("Valid email is required"),
  customerPhone: z.string().min(1, "Phone number is required"),
})

const emptyOfferings: Offerings = {
  packages: [],
  packageInclusions: [],
  packageTiers: [],
  packageTierItems: [],
}

export function QuotationPage() {
  const navigate = useNavigate()
  const { businessSlug } = useParams()
  const [venueCoverage, setVenueCoverage] = useState<CoverageResult | null>(null)
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(false)

  const defaultValues: QuotationValues = {
    eventDate: undefined,
    startTime: "",
    endTime: "",
    venue: "",
    venuePlaceId: "",
    venueLocality: "",
    venueRegion: "",
    occasion: "",
    occasionOther: "",
    guestCount: undefined,
    selectedPackages: {},
    customerName: "",
    customerEmail: "",
    customerPhone: "",
  }

  const { data: business } = useQuery({
    queryKey: ["business", businessSlug],
    queryFn: async (): Promise<BusinessInformation> => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}`
      )
      if (!response.ok) throw new Error("Failed to fetch business information")
      return (await response.json()).data
    },
    enabled: !!businessSlug,
  })

  const {
    data: offerings = emptyOfferings,
    isPending: isOfferingsPending,
    error: offeringsError,
  } = useQuery({
    queryKey: ["offerings", businessSlug],
    queryFn: async (): Promise<Offerings> => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/offerings`
      )
      if (!response.ok) throw new Error("Failed to fetch offerings")
      return (await response.json()).data ?? emptyOfferings
    },
    enabled: !!businessSlug,
  })

  const form = useForm({
    defaultValues,
    validators: { onSubmit: quotationSchema },
    onSubmit: async ({ value }) => {
      if (!businessSlug || !value.eventDate) {
        throw new Error("Missing required quotation information")
      }

      const packages = Object.entries(value.selectedPackages).map(
        ([packageId, selection]) => ({
          packageId,
          tierId: selection.tierId,
          selectedItems: Object.entries(selection.selectedTierItems)
            .filter(([, quantity]) => quantity > 0)
            .map(([tierItemId, quantity]) => ({ tierItemId, quantity })),
        })
      )

      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/quotations`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventDate: toDateOnly(value.eventDate),
            startTime: value.startTime,
            endTime: value.endTime,
            venue: value.venue,
            venuePlaceId: value.venuePlaceId,
            venueLocality: value.venueLocality,
            venueRegion: value.venueRegion,
            occasion:
              value.occasion === "other"
                ? value.occasionOther.trim()
                : value.occasion,
            guestCount: value.guestCount,
            packages,
            customerName: value.customerName,
            customerEmail: value.customerEmail,
            customerPhone: value.customerPhone,
          }),
        }
      )

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error ?? result.message ?? "Failed to create quotation")
      }

      navigate(`/${businessSlug}/${result.data.quotationReference}`)
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
        venueLocality: "venue from the suggestions",
        venueRegion: "venue from the suggestions",
        occasion: "occasion",
        occasionOther: "occasion",
        guestCount: "number of guests",
        selectedPackages: "package",
      }
      const missingFields = [
        ...new Set(
          result.error.issues.map(
            (issue) => fieldLabels[String(issue.path[0])] ?? String(issue.path[0])
          )
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

    await toast.promise(form.handleSubmit(), {
      loading: "Creating your quotation...",
      success: "Your quotation was created successfully.",
      error: (error) =>
        error instanceof Error ? error.message : "Something went wrong.",
      position: "top-center",
    })
  }

  if (isOfferingsPending) return <p className="p-4">Loading packages...</p>
  if (offeringsError) return <p className="p-4">Failed to load packages.</p>

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void handleCreateMyQuotationClick()
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
        businessSlug={businessSlug ?? ""}
        venueCoverage={venueCoverage}
        onVenueCoverageChange={setVenueCoverage}
      />

      <form.Subscribe selector={(state) => state.values}>
        {(values) => {
          const totals = calculateQuotationTotals(values, offerings)
          return (
            <>
              <PackageDetails
                form={form}
                packages={offerings.packages}
                packageInclusions={offerings.packageInclusions}
                packageTiers={offerings.packageTiers}
                packageTierItems={offerings.packageTierItems}
                calculatedPackages={totals.selectedPackages}
              />

              <StickyOrderSummary
                basePrice={totals.packagesTotal}
                addOnsPrice={totals.selectedItemsTotal}
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
  )
}
