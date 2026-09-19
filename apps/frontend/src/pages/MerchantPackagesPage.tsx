import { useQuery } from "@tanstack/react-query"
import { ChevronRight, Plus } from "lucide-react"
import { Link } from "react-router-dom"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import useAuth from "@/context/useAuth"
import { getMerchantCatalog } from "@/lib/merchant-catalog"

export function MerchantPackagesPage() {
  const { merchant } = useAuth()
  const query = useQuery({
    queryKey: ["merchant-catalog", merchant?.businessId],
    queryFn: getMerchantCatalog,
    enabled: !!merchant,
  })

  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading packages…</p>
  if (query.error || !query.data) return <p role="alert" className="text-sm">Could not load packages.</p>

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Packages</h1>
          <p className="text-sm text-muted-foreground">Manage the packages customers can select.</p>
        </div>
        <Button asChild size="sm"><Link to="/packages/new"><Plus /> Add package</Link></Button>
      </div>

      {query.data.packages.length === 0 ? (
        <Card><CardContent className="py-8 text-center text-sm text-muted-foreground">No packages yet.</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {query.data.packages.map((pkg) => {
            const tiers = query.data.packageTiers.filter((tier) => tier.package_id === pkg.id)
            const activePrices = tiers.filter((tier) => tier.is_active).map((tier) => tier.price)
            return (
              <Card key={pkg.id} className="gap-0 py-0">
                <Link to={`/packages/${pkg.id}`} className="flex items-center justify-between gap-4 rounded-xl p-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className="min-w-0 space-y-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate font-semibold">{pkg.name}</span>
                      {!pkg.is_active && <Badge variant="secondary">Hidden</Badge>}
                    </span>
                    <span className="block text-sm text-muted-foreground">{tiers.length} tier{tiers.length === 1 ? "" : "s"}</span>
                    <span className="block text-sm">
                      {activePrices.length ? `Starting at ₱${Math.min(...activePrices).toLocaleString()}` : "No active tiers"}
                    </span>
                  </span>
                  <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
