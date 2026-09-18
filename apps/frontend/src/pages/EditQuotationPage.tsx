import { CustomerDetails } from "@/components/quotation/CustomerDetails"
import { EventDetails } from "@/components/quotation/EventDetails"
import { PackageDetails } from "@/components/quotation/PackageDetails"
import { Button } from "@/components/ui/button"
import { calculateQuotationTotals } from "@/lib/quotation-calculation"
import { fromDateOnly, toDateOnly } from "@/lib/date-only"
import type {
  CoverageResult,
  Offerings,
  Quotation,
  QuotationValues,
  SelectedPackageValue,
} from "@/lib/types"
import { useForm } from "@tanstack/react-form"
import { useQuery } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"

const knownOccasions = new Set([
  "wedding",
  "debut",
  "baptism",
  "kiddie-party",
  "corporate-event",
  "birthday",
  "graduation",
])

const emptyOfferings: Offerings = {
  packages: [],
  packageInclusions: [],
  packageTiers: [],
  packageTierItems: [],
}

export function EditQuotationPage() {
  const { businessSlug, quotationReference } = useParams()

  const { data: offerings = emptyOfferings, isPending: offeringsPending } =
    useQuery({
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

  const { data: quotation, isPending: quotationPending } = useQuery({
    queryKey: ["quotation", businessSlug, quotationReference],
    queryFn: async (): Promise<Quotation> => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/quotations/${quotationReference}`
      )
      if (!response.ok) throw new Error("Failed to fetch quotation")
      return (await response.json()).data
    },
    enabled: !!businessSlug && !!quotationReference,
  })

  if (!businessSlug || !quotationReference) return <p>Missing route parameters.</p>
  if (offeringsPending || quotationPending) return <p className="p-4">Loading...</p>
  if (!quotation) return <p className="p-4">Quotation not found.</p>

  return (
    <EditQuotationForm
      quotation={quotation}
      offerings={offerings}
      businessSlug={businessSlug}
      quotationReference={quotationReference}
    />
  )
}

type EditQuotationFormProps = {
  quotation: Quotation
  offerings: Offerings
  businessSlug: string
  quotationReference: string
}

function EditQuotationForm({
  quotation,
  offerings,
  businessSlug,
  quotationReference,
}: EditQuotationFormProps) {
  const navigate = useNavigate()
  const [venueCoverage, setVenueCoverage] = useState<CoverageResult>({
    isCovered: true,
    transportationFee: quotation.transportationFee,
  })

  const selectedPackages = Object.fromEntries(
    quotation.packages.flatMap((quotedPackage) => {
      if (!quotedPackage.packageId || !quotedPackage.tierId) return []

      const selection: SelectedPackageValue = {
        tierId: quotedPackage.tierId,
        selectedTierItems: Object.fromEntries(
          quotedPackage.selectedItems.flatMap((item) =>
            item.tierItemId ? [[item.tierItemId, item.quantity]] : []
          )
        ),
      }
      return [[quotedPackage.packageId, selection]]
    })
  )

  const isKnownOccasion = knownOccasions.has(quotation.occasion)
  const defaultValues: QuotationValues = {
    eventDate: fromDateOnly(quotation.eventDate),
    startTime: quotation.startTime,
    endTime: quotation.endTime,
    venue: quotation.venue,
    venuePlaceId: quotation.venuePlaceId ?? "",
    venueLocality: quotation.venueLocality,
    venueRegion: quotation.venueRegion,
    occasion: isKnownOccasion ? quotation.occasion : "other",
    occasionOther: isKnownOccasion ? "" : quotation.occasion,
    guestCount: quotation.guestCount,
    selectedPackages,
    customerName: quotation.customerName,
    customerEmail: quotation.customerEmail,
    customerPhone: quotation.customerPhone,
  }

  const form = useForm({
    defaultValues,
    onSubmit: async ({ value }) => {
      if (!value.eventDate) throw new Error("Event date is required")

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
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/quotations/${quotationReference}`,
        {
          method: "PUT",
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
        throw new Error(result.error ?? result.message ?? "Failed to update quotation")
      }
      navigate(`/${businessSlug}/${result.data.quotationReference}`)
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void toast.promise(form.handleSubmit(), {
          loading: "Saving quotation...",
          success: "Quotation updated.",
          error: (error) =>
            error instanceof Error ? error.message : "Failed to update quotation.",
          position: "top-center",
        })
      }}
      className="space-y-6 pb-10"
    >
      <EventDetails
        form={form}
        businessSlug={businessSlug}
        originalEventDate={quotation.eventDate}
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
            </>
          )
        }}
      </form.Subscribe>

      <CustomerDetails form={form} />
      <Button type="submit" className="w-full">Save Changes</Button>
    </form>
  )
}
