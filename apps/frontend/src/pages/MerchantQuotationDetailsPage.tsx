import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { format } from "date-fns"
import { ArrowLeft } from "lucide-react"
import { Link, useParams } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import useAuth from "@/context/useAuth"
import { fromDateOnly } from "@/lib/date-only"
import { merchantFetch } from "@/lib/merchant-api"
import type { CloseReason, Quotation, QuotationStatus } from "@/lib/types"

const closeReasons: { value: CloseReason; label: string }[] = [
  { value: "customer_chose_another_supplier", label: "Customer chose another supplier" },
  { value: "no_response", label: "No response" },
  { value: "event_cancelled", label: "Event cancelled" },
  { value: "unavailable_on_event_date", label: "Unavailable on event date" },
  { value: "event_date_passed", label: "Event date passed" },
  { value: "other", label: "Other" },
]

function formatTime(value: string) {
  const date = new Date(`2000-01-01T${value}`)
  return Number.isNaN(date.getTime()) ? value : format(date, "h:mm a")
}

export function MerchantQuotationDetailsPage() {
  const { quotationReference } = useParams()
  const { merchant } = useAuth()
  const queryClient = useQueryClient()
  const [showCloseForm, setShowCloseForm] = useState(false)
  const [closeReason, setCloseReason] = useState<CloseReason | "">("")
  const [closeReasonNotes, setCloseReasonNotes] = useState("")
  const [actionError, setActionError] = useState("")

  const { data: quotation, isPending, error, refetch } = useQuery({
    queryKey: ["merchant-quotation", merchant?.businessId, quotationReference],
    queryFn: async (): Promise<Quotation> => {
      const response = await merchantFetch(
        `/api/merchant/quotations/${encodeURIComponent(quotationReference!)}`
      )
      if (!response.ok) throw new Error("Could not load quotation")
      return (await response.json()).data
    },
    enabled: !!merchant && !!quotationReference,
  })

  const statusMutation = useMutation({
    mutationFn: async (nextStatus: QuotationStatus): Promise<Quotation> => {
      const response = await merchantFetch(
        `/api/businesses/${encodeURIComponent(merchant!.businessSlug)}/quotations/${encodeURIComponent(quotationReference!)}/status`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quotationStatus: nextStatus,
            ...(nextStatus === "closed" && {
              closeReason,
              closeReasonNotes: closeReasonNotes.trim() || null,
            }),
          }),
        }
      )
      if (!response.ok) {
        const body = await response.json().catch(() => ({})) as { message?: string }
        if (response.status === 409) {
          throw new Error(body.message ?? "This status change is no longer available.")
        }
        throw new Error(body.message ?? "Could not update quotation status.")
      }
      return (await response.json()).data
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(
        ["merchant-quotation", merchant?.businessId, quotationReference],
        updated
      )
      void queryClient.invalidateQueries({ queryKey: ["quotations", merchant?.businessSlug] })
      setActionError("")
      setShowCloseForm(false)
      setCloseReason("")
      setCloseReasonNotes("")
    },
    onError: (mutationError) => setActionError(mutationError.message),
  })

  function changeStatus(nextStatus: QuotationStatus) {
    setActionError("")
    statusMutation.mutate(nextStatus)
  }

  if (!quotationReference) return <p>Missing quotation reference.</p>

  return (
    <div className="space-y-5">
      <Link to="/quotations" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium hover:underline">
        <ArrowLeft aria-hidden="true" className="size-4" /> Quotations
      </Link>
      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading quotation…</p>
      ) : error || !quotation ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>Could not load this quotation.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>Try again</Button>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <h1 className="min-w-0 break-all text-2xl font-semibold">#{quotation.quotationReference}</h1>
            <Badge variant="secondary" className="mt-1 capitalize">{quotation.quotationStatus}</Badge>
          </div>

          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-1 text-sm">
              <p className="font-medium">{quotation.customerName}</p>
              <p className="break-all text-muted-foreground">{quotation.customerEmail}</p>
              <p className="text-muted-foreground">{quotation.customerPhone}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Event</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Date" value={format(fromDateOnly(quotation.eventDate), "MMM d, yyyy")} />
              <DetailRow label="Time" value={`${formatTime(quotation.startTime)} – ${formatTime(quotation.endTime)}`} />
              <DetailRow label="Venue" value={quotation.venue} />
              <DetailRow label="Occasion" value={quotation.occasion.replaceAll("-", " ")} />
              <DetailRow label="Guests" value={String(quotation.guestCount)} />
            </CardContent>
          </Card>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">Packages</h2>
            {quotation.packages.map((pkg) => (
              <Card key={pkg.id}>
                <CardHeader>
                  <CardTitle>{pkg.packageName}</CardTitle>
                  <p className="text-sm text-muted-foreground">{pkg.tierName}</p>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  {pkg.inclusions.length > 0 && (
                    <div>
                      <p className="mb-2 font-medium">Inclusions &amp; freebies</p>
                      <ul className="space-y-1 text-muted-foreground">
                        {pkg.inclusions.map((item) => (
                          <li key={item.id}>
                            {item.quantity === 1 ? item.name : `${item.quantity} ${item.unit} — ${item.name}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {pkg.selectedItems.length > 0 && (
                    <div>
                      <p className="mb-2 font-medium">Extras &amp; upgrades</p>
                      <div className="space-y-2">
                        {pkg.selectedItems.map((item) => (
                          <DetailRow key={item.id} label={`${item.name} × ${item.quantity}`}
                            value={`₱${item.lineTotal.toLocaleString()}`} />
                        ))}
                      </div>
                    </div>
                  )}
                  <DetailRow label="Package total" value={`₱${pkg.total.toLocaleString()}`} />
                </CardContent>
              </Card>
            ))}
          </section>

          <Card>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Transportation" value={`₱${quotation.transportationFee.toLocaleString()}`} />
              <div className="flex items-start justify-between gap-3 border-t pt-3 text-lg font-semibold">
                <span>Grand total</span>
                <span>₱{quotation.grandTotal.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {quotation.quotationStatus !== "closed" && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold">Manage status</h2>
              <div className="flex flex-wrap gap-2">
                {quotation.quotationStatus === "open" && (
                  <Button disabled={statusMutation.isPending} onClick={() => changeStatus("accepted")}>
                    Accept quotation
                  </Button>
                )}
                {quotation.quotationStatus === "accepted" && (
                  <Button disabled={statusMutation.isPending} onClick={() => changeStatus("booked")}>
                    Mark as booked
                  </Button>
                )}
                <Button
                  type="button"
                  variant="outline"
                  disabled={statusMutation.isPending}
                  onClick={() => {
                    setActionError("")
                    setShowCloseForm((current) => !current)
                  }}
                >
                  Close quotation
                </Button>
              </div>
              {showCloseForm && (
                <div className="space-y-3 rounded-lg border bg-card p-4">
                  <label htmlFor="close-reason" className="text-sm font-medium">Reason for closing</label>
                  <Select value={closeReason} onValueChange={(value) => setCloseReason(value as CloseReason)}>
                    <SelectTrigger id="close-reason" className="w-full">
                      <SelectValue placeholder="Select a reason" />
                    </SelectTrigger>
                    <SelectContent>
                      {closeReasons.map((reason) => (
                        <SelectItem key={reason.value} value={reason.value}>{reason.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <label htmlFor="close-notes" className="text-sm font-medium">
                    Notes {closeReason === "other" ? "(required)" : "(optional)"}
                  </label>
                  <Input id="close-notes" value={closeReasonNotes}
                    onChange={(event) => setCloseReasonNotes(event.target.value)}
                    placeholder="Add context for your team" />
                  <Button
                    type="button"
                    variant="destructive"
                    disabled={statusMutation.isPending || !closeReason || (closeReason === "other" && !closeReasonNotes.trim())}
                    onClick={() => changeStatus("closed")}
                  >
                    Confirm close
                  </Button>
                </div>
              )}
              {actionError && <p role="alert" className="text-sm text-destructive">{actionError}</p>}
            </section>
          )}
        </>
      )}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="min-w-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-right font-medium">{value}</span>
    </div>
  )
}
