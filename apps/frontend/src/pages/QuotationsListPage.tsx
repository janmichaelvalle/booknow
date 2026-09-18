import { useState } from "react"
import { Link } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import useAuth from "@/context/useAuth"
import { fromDateOnly } from "@/lib/date-only"
import { merchantFetch } from "@/lib/merchant-api"
import type { Quotation, QuotationStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

type Filter = "all" | QuotationStatus
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "accepted", label: "Accepted" },
  { value: "booked", label: "Booked" },
  { value: "closed", label: "Closed" },
]

export function QuotationsListPage() {
  const { merchant } = useAuth()
  const businessSlug = merchant?.businessSlug
  const [filter, setFilter] = useState<Filter>("all")

  const { data: quotations = [], isPending, error, refetch } = useQuery({
    queryKey: ["quotations", businessSlug],
    queryFn: async (): Promise<Quotation[]> => {
      const response = await merchantFetch(`/api/businesses/${encodeURIComponent(businessSlug!)}/quotations`)
      if (!response.ok) throw new Error("Failed to fetch quotations")
      return (await response.json()).data ?? []
    },
    enabled: !!businessSlug,
  })

  const visible = filter === "all"
    ? quotations
    : quotations.filter((quotation) => quotation.quotationStatus === filter)

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Quotations</h1>
        <p className="text-sm text-muted-foreground">Your event enquiries and bookings.</p>
      </div>

      <div aria-label="Filter quotations by status" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {filters.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={filter === option.value}
            onClick={() => setFilter(option.value)}
            className={cn(
              "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filter === option.value
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading quotations…</p>
      ) : error ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>Could not load quotations.</p>
          <button type="button" className="font-medium underline" onClick={() => void refetch()}>
            Try again
          </button>
        </div>
      ) : visible.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="font-medium">
              {quotations.length === 0
                ? "No quotations yet"
                : `No ${filter} quotations`}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {quotations.length === 0
                ? "New customer quotations will appear here."
                : "Choose another status to see more quotations."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((quotation) => (
            <Link
              key={quotation.id}
              to={`/quotations/${encodeURIComponent(quotation.quotationReference)}`}
              className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={`Quotation ${quotation.quotationReference}, ${quotation.quotationStatus}, ${quotation.customerName}`}
            >
              <Card className="transition-colors hover:bg-accent/30">
                <CardContent className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-semibold">#{quotation.quotationReference}</span>
                    <Badge variant="secondary" className="capitalize">{quotation.quotationStatus}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {format(fromDateOnly(quotation.eventDate), "MMM d, yyyy")}
                      <span className="mx-1.5 text-muted-foreground">·</span>
                      {quotation.customerName}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{quotation.venue}</p>
                  </div>
                  <div className="flex items-end justify-between gap-3 border-t pt-3">
                    <p className="min-w-0 text-sm text-muted-foreground">
                      {quotation.packages.map((pkg) => pkg.packageName).join(", ")}
                    </p>
                    <span className="shrink-0 font-semibold">₱{quotation.grandTotal.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
