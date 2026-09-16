import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import useAuth from "@/context/useAuth"
import type { Quotation } from "@/lib/types"
import { useQuery } from "@tanstack/react-query"
import { format } from "date-fns"
import { Link, useNavigate, useParams } from "react-router-dom"

export function QuotationsListPage() {
  const navigate = useNavigate()
  const { businessSlug } = useParams()
  const { logout } = useAuth()

  const { data: quotations = [], isPending } = useQuery({
    queryKey: ["quotations", businessSlug],
    queryFn: async (): Promise<Quotation[]> => {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/quotations`
      )
      if (!response.ok) throw new Error("Failed to fetch quotations")
      return (await response.json()).data ?? []
    },
    enabled: !!businessSlug,
  })

  if (!businessSlug) return <p>Missing business slug.</p>
  if (isPending) return <p className="p-4">Loading quotations...</p>

  return (
    <div className="space-y-4 p-4">
      <h1 className="text-xl font-semibold">Quotations</h1>

      {quotations.map((quotation) => (
        <Card key={quotation.id}>
          <CardHeader>
            <Link to={`/${businessSlug}/${quotation.quotationReference}`}>
              <CardTitle className="text-base">
                Quotation #{quotation.quotationReference}
              </CardTitle>
            </Link>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Row label="Status" value={quotation.quotationStatus} capitalize />
            <Row
              label="Event Date"
              value={format(new Date(quotation.eventDate), "MMMM d, yyyy")}
            />
            <Row label="Venue" value={quotation.venue} />
            <Row
              label="Packages"
              value={quotation.packages.map((pkg) => pkg.packageName).join(", ")}
            />
            <Row
              label="Grand Total"
              value={`₱${quotation.grandTotal.toLocaleString()}`}
            />
            <Row label="Customer" value={quotation.customerName} />
          </CardContent>
        </Card>
      ))}

      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          await logout()
          navigate("/login")
        }}
      >
        Logout
      </Button>
    </div>
  )
}

function Row({
  label,
  value,
  capitalize = false,
}: {
  label: string
  value: string
  capitalize?: boolean
}) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <span className={capitalize ? "capitalize" : "text-right"}>{value}</span>
    </div>
  )
}
