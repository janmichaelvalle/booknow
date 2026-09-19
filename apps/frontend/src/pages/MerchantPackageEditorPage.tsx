import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Plus } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import useAuth from "@/context/useAuth"
import {
  createMerchantInclusion, createMerchantPackage, getMerchantCatalog,
  updateMerchantInclusion, updateMerchantPackage,
  type MerchantPackage, type MerchantPackageInclusion,
} from "@/lib/merchant-catalog"

export function MerchantPackageEditorPage() {
  const { packageId } = useParams()
  const { merchant } = useAuth()
  const query = useQuery({ queryKey: ["merchant-catalog", merchant?.businessId], queryFn: getMerchantCatalog, enabled: !!merchant })
  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading package…</p>
  if (query.error || !query.data) return <p role="alert">Could not load package.</p>
  const pkg = packageId === "new" || !packageId ? null : query.data.packages.find((item) => item.id === packageId) ?? null
  if (packageId && packageId !== "new" && !pkg) return <p role="alert">Package not found.</p>
  return <PackageEditor key={pkg?.id ?? "new"} pkg={pkg} catalog={query.data} />
}

function PackageEditor({ pkg, catalog }: { pkg: MerchantPackage | null; catalog: Awaited<ReturnType<typeof getMerchantCatalog>> }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { merchant } = useAuth()
  const [name, setName] = useState(pkg?.name ?? "")
  const [description, setDescription] = useState(pkg?.description ?? "")
  const [isActive, setIsActive] = useState(pkg?.is_active ?? true)
  const [editingInclusion, setEditingInclusion] = useState<MerchantPackageInclusion | "new" | null>(null)
  const dirty = name !== (pkg?.name ?? "") || description !== (pkg?.description ?? "") || isActive !== (pkg?.is_active ?? true)
  const allowNavigation = useRef(false)
  useEffect(() => {
    const handler = (event: BeforeUnloadEvent) => { if (dirty && !allowNavigation.current) event.preventDefault() }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirty])
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest("a[href]")
      if (anchor && dirty && !allowNavigation.current && !window.confirm("Discard your unsaved package changes?")) {
        event.preventDefault(); event.stopPropagation()
      }
    }
    document.addEventListener("click", handler, true)
    return () => document.removeEventListener("click", handler, true)
  }, [dirty])

  const save = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("Package name is required")
      if (pkg?.is_active && !isActive && !window.confirm("Hide this package from customers? Existing quotation snapshots will remain unchanged.")) throw new Error("CANCELLED")
      return pkg
        ? updateMerchantPackage(pkg.id, { name, description: description || null, isActive })
        : createMerchantPackage({ name, description: description || null, isActive })
    },
    onSuccess: async (saved) => {
      await queryClient.invalidateQueries({ queryKey: ["merchant-catalog", merchant?.businessId] })
      toast.success(pkg ? "Package saved" : "Package created")
      allowNavigation.current = !pkg
      if (!pkg) navigate(`/packages/${saved.id}`, { replace: true })
    },
  })
  const inclusions = pkg ? catalog.packageInclusions.filter((item) => item.package_id === pkg.id) : []
  const tiers = pkg ? catalog.packageTiers.filter((tier) => tier.package_id === pkg.id) : []

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild className="-ml-2"><Link to="/packages"><ChevronLeft /> Packages</Link></Button>
      <div><h1 className="text-2xl font-semibold">{pkg ? pkg.name : "New package"}</h1><p className="text-sm text-muted-foreground">Package details and available tiers.</p></div>
      <Card><CardHeader><CardTitle>Package details</CardTitle></CardHeader><CardContent className="space-y-4">
        <div className="space-y-2"><Label htmlFor="package-name">Name</Label><Input id="package-name" value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div className="space-y-2"><Label htmlFor="package-description">Description</Label><Textarea id="package-description" value={description} onChange={(e) => setDescription(e.target.value)} /></div>
      </CardContent></Card>

      {pkg && <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Shared inclusions</CardTitle><Button size="sm" variant="outline" onClick={() => setEditingInclusion("new")}><Plus /> Add</Button></CardHeader><CardContent className="divide-y">
        {inclusions.length === 0 && <p className="pb-4 text-sm text-muted-foreground">No shared inclusions.</p>}
        {inclusions.map((item) => <button key={item.id} type="button" onClick={() => setEditingInclusion(item)} className="flex w-full items-center justify-between gap-3 py-3 text-left"><span><span className="block font-medium">{item.quantity && item.unit ? `${item.quantity} ${item.unit} — ` : ""}{item.name}</span>{!item.is_active && <Badge variant="secondary">Hidden</Badge>}</span><ChevronRight className="size-4 text-muted-foreground" /></button>)}
      </CardContent></Card>}

      {pkg && <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Tiers</CardTitle><Button size="sm" variant="outline" asChild><Link to={`/packages/${pkg.id}/tiers/new`}><Plus /> Add</Link></Button></CardHeader><CardContent className="divide-y">
        {tiers.length === 0 && <p className="pb-4 text-sm text-muted-foreground">No tiers yet.</p>}
        {tiers.map((tier) => <Link key={tier.id} to={`/packages/${pkg.id}/tiers/${tier.id}`} className="flex items-center justify-between gap-3 py-3"><span><span className="block font-medium">{tier.name}</span><span className="text-sm text-muted-foreground">₱{tier.price.toLocaleString()}</span>{!tier.is_active && <Badge variant="secondary" className="ml-2">Hidden</Badge>}</span><ChevronRight className="size-4 text-muted-foreground" /></Link>)}
      </CardContent></Card>}

      <Card><CardHeader><CardTitle>Status</CardTitle></CardHeader><CardContent><Button type="button" variant={isActive ? "default" : "outline"} onClick={() => setIsActive((value) => !value)}>{isActive ? "Active" : "Hidden"}</Button><p className="mt-2 text-xs text-muted-foreground">Hidden packages are not shown to customers.</p></CardContent></Card>
      {save.error && save.error.message !== "CANCELLED" && <p role="alert" className="text-sm text-destructive">{save.error.message}</p>}
      <Button className="w-full" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : pkg ? "Save changes" : "Create package"}</Button>
      {pkg && editingInclusion && <InclusionDialog key={editingInclusion === "new" ? "new" : editingInclusion.id} packageId={pkg.id} item={editingInclusion} onClose={() => setEditingInclusion(null)} />}
    </div>
  )
}

function InclusionDialog({ packageId, item, onClose }: { packageId: string; item: MerchantPackageInclusion | "new"; onClose: () => void }) {
  const queryClient = useQueryClient(); const { merchant } = useAuth()
  const current = item === "new" ? null : item
  const [name, setName] = useState(current?.name ?? ""); const [quantity, setQuantity] = useState(current?.quantity?.toString() ?? ""); const [unit, setUnit] = useState(current?.unit ?? ""); const [description, setDescription] = useState(current?.description ?? ""); const [isActive, setIsActive] = useState(current?.is_active ?? true)
  const mutation = useMutation({ mutationFn: async () => {
    const parsed = quantity ? Number(quantity) : null
    if (!name.trim() || (!!quantity !== !!unit.trim()) || (parsed !== null && (!Number.isSafeInteger(parsed) || parsed <= 0))) throw new Error("Provide a name and either both quantity and unit, or neither")
    if (current?.is_active && !isActive && !window.confirm("Hide this inclusion from new quotations?")) throw new Error("CANCELLED")
    const input = { name, quantity: parsed, unit: unit.trim() || null, description: description || null, isActive }
    return current ? updateMerchantInclusion(packageId, current.id, input) : createMerchantInclusion(packageId, input)
  }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["merchant-catalog", merchant?.businessId] }); toast.success(current ? "Inclusion saved" : "Inclusion added"); onClose() } })
  return <Dialog open={item !== null} onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="sm:max-w-sm"><DialogHeader><DialogTitle>{current ? "Edit inclusion" : "Add inclusion"}</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div><div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Quantity (optional)</Label><Input inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div><div className="space-y-2"><Label>Unit (optional)</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} /></div></div><div className="space-y-2"><Label>Description (optional)</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>{current && <Button type="button" variant={isActive ? "default" : "outline"} onClick={() => setIsActive((value) => !value)}>{isActive ? "Active" : "Hidden"}</Button>}{mutation.error && mutation.error.message !== "CANCELLED" && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}</div><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Saving…" : current ? "Save" : "Add"}</Button></DialogFooter></DialogContent></Dialog>
}
