import { BusinessHeader } from "@/components/quotation/BusinessHeader"
import { QuotationDetailsCard } from "@/components/quotation/QuotationDetailsCard"
import type { BusinessInformation, Quotation } from "@/lib/types"
import { useQuery } from "@tanstack/react-query"
import { useNavigate, useParams } from "react-router-dom"

export function QuotationDetailsPage() {
  const navigate = useNavigate()
  const { businessSlug, quotationReference } = useParams()

  const { data: business } = useQuery({
    queryKey: ["business", businessSlug],
    queryFn: async (): Promise<BusinessInformation> => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}`
      )
      if (!response.ok) throw new Error("Failed to fetch business")
      return (await response.json()).data
    },
    enabled: !!businessSlug,
  })

  const {
    data: quotation,
    isPending,
    error,
  } = useQuery({
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

  if (!businessSlug || !quotationReference) return <p>Missing quotation reference.</p>
  if (isPending) return <p className="p-4">Loading quotation...</p>
  if (error || !quotation) return <p className="p-4">Quotation not found.</p>

  return (
    <div className="space-y-6 pb-10">
      {business && (
        <BusinessHeader
          logoUrl={business.logo_url ?? ""}
          businessName={business.name}
          description={business.description ?? ""}
        />
      )}
      <QuotationDetailsCard
        quotation={quotation}
        canEdit={quotation.quotationStatus === "open"}
        onEdit={() =>
          navigate(`/${businessSlug}/${quotation.quotationReference}/edit`)
        }
      />
    </div>
  )
}
