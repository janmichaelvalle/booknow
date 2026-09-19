import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { ChevronLeft, ChevronRight, Copy, Plus } from "lucide-react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import useAuth from "@/context/useAuth"
import {
  createMerchantTier, createMerchantTierItem, duplicateMerchantTier,
  getMerchantCatalog, updateMerchantTier, updateMerchantTierItem,
  type MerchantTier, type MerchantTierItem,
} from "@/lib/merchant-catalog"
import type { TierItemType } from "@/lib/types"

type ItemEditor = { item: MerchantTierItem | null; initialType: TierItemType } | null

export function MerchantTierEditorPage() {
  const { packageId, tierId } = useParams(); const { merchant } = useAuth()
  const query = useQuery({ queryKey: ["merchant-catalog", merchant?.businessId], queryFn: getMerchantCatalog, enabled: !!merchant })
  if (query.isPending) return <p className="text-sm text-muted-foreground">Loading tier…</p>
  if (query.error || !query.data || !packageId) return <p role="alert">Could not load tier.</p>
  const pkg = query.data.packages.find((item) => item.id === packageId)
  const tier = tierId === "new" || !tierId ? null : query.data.packageTiers.find((item) => item.id === tierId && item.package_id === packageId) ?? null
  if (!pkg || (tierId && tierId !== "new" && !tier)) return <p role="alert">Tier not found.</p>
  return <TierEditor key={tier?.id ?? "new"} packageId={packageId} packageName={pkg.name} tier={tier} items={tier ? query.data.packageTierItems.filter((item) => item.package_tier_id === tier.id) : []} />
}

function TierEditor({ packageId, packageName, tier, items }: { packageId: string; packageName: string; tier: MerchantTier | null; items: MerchantTierItem[] }) {
  const navigate = useNavigate(); const queryClient = useQueryClient(); const { merchant } = useAuth()
  const [name, setName] = useState(tier?.name ?? ""); const [price, setPrice] = useState(tier?.price.toString() ?? ""); const [isActive, setIsActive] = useState(tier?.is_active ?? true); const [itemEditor, setItemEditor] = useState<ItemEditor>(null)
  const dirty = name !== (tier?.name ?? "") || price !== (tier?.price.toString() ?? "") || isActive !== (tier?.is_active ?? true)
  const allowNavigation = useRef(false)
  useEffect(() => { const handler = (event: BeforeUnloadEvent) => { if (dirty && !allowNavigation.current) event.preventDefault() }; window.addEventListener("beforeunload", handler); return () => window.removeEventListener("beforeunload", handler) }, [dirty])
  useEffect(() => { const handler = (event: MouseEvent) => { const anchor = (event.target as Element | null)?.closest("a[href]"); if (anchor && dirty && !allowNavigation.current && !window.confirm("Discard your unsaved tier changes?")) { event.preventDefault(); event.stopPropagation() } }; document.addEventListener("click", handler, true); return () => document.removeEventListener("click", handler, true) }, [dirty])
  const save = useMutation({ mutationFn: async () => {
    const parsed = Number(price)
    if (!name.trim() || !Number.isFinite(parsed) || parsed < 0) throw new Error("A tier name and valid fixed price are required")
    if (tier?.is_active && !isActive && !window.confirm("Hide this tier from customers? Existing quotation snapshots will remain unchanged.")) throw new Error("CANCELLED")
    const input = { name, price: parsed, isActive }
    return tier ? updateMerchantTier(packageId, tier.id, input) : createMerchantTier(packageId, input)
  }, onSuccess: async (saved) => { await queryClient.invalidateQueries({ queryKey: ["merchant-catalog", merchant?.businessId] }); toast.success(tier ? "Tier saved" : "Tier created"); allowNavigation.current = !tier; if (!tier) navigate(`/packages/${packageId}/tiers/${saved.id}`, { replace: true }) } })
  const duplicate = useMutation({ mutationFn: () => duplicateMerchantTier(packageId, tier!.id), onSuccess: async ({ id }) => { await queryClient.invalidateQueries({ queryKey: ["merchant-catalog", merchant?.businessId] }); toast.success("Tier duplicated as Hidden"); allowNavigation.current = true; navigate(`/packages/${packageId}/tiers/${id}`) } })
  const included = items.filter((item) => item.item_type === "inclusion" || item.item_type === "freebie")
  const paid = items.filter((item) => item.item_type === "extra" || item.item_type === "upgrade")
  const rows = (list: MerchantTierItem[]) => list.length ? list.map((item) => <button key={item.id} type="button" onClick={() => setItemEditor({ item, initialType: item.item_type })} className="flex w-full items-center justify-between gap-3 py-3 text-left"><span><span className="block font-medium">{item.quantity && item.unit ? `${item.quantity} ${item.unit} — ` : ""}{item.name}</span>{(item.item_type === "extra" || item.item_type === "upgrade") && <span className="text-sm text-muted-foreground">₱{item.price.toLocaleString()}{item.unit ? ` / ${item.unit}` : ""}</span>} {!item.is_active && <Badge variant="secondary">Hidden</Badge>}</span><ChevronRight className="size-4 text-muted-foreground" /></button>) : <p className="pb-4 text-sm text-muted-foreground">No items yet.</p>

  return <div className="space-y-6">
    <Button variant="ghost" size="sm" asChild className="-ml-2"><Link to={`/packages/${packageId}`}><ChevronLeft /> {packageName}</Link></Button>
    <div><h1 className="text-2xl font-semibold">{tier ? tier.name : "New tier"}</h1><p className="text-sm text-muted-foreground">Merchant-defined package option with a fixed price.</p></div>
    <Card><CardHeader><CardTitle>Tier details</CardTitle></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="tier-name">Name</Label><Input id="tier-name" value={name} onChange={(e) => setName(e.target.value)} /></div><div className="space-y-2"><Label htmlFor="tier-price">Fixed price</Label><Input id="tier-price" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></div></CardContent></Card>
    {tier && <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Inclusions &amp; freebies</CardTitle><Button size="sm" variant="outline" onClick={() => setItemEditor({ item: null, initialType: "inclusion" })}><Plus /> Add</Button></CardHeader><CardContent className="divide-y">{rows(included)}</CardContent></Card>}
    {tier && <Card><CardHeader className="flex-row items-center justify-between"><CardTitle>Extras &amp; upgrades</CardTitle><Button size="sm" variant="outline" onClick={() => setItemEditor({ item: null, initialType: "extra" })}><Plus /> Add</Button></CardHeader><CardContent className="divide-y">{rows(paid)}</CardContent></Card>}
    <Card><CardHeader><CardTitle>Status</CardTitle></CardHeader><CardContent><Button type="button" variant={isActive ? "default" : "outline"} onClick={() => setIsActive((value) => !value)}>{isActive ? "Active" : "Hidden"}</Button><p className="mt-2 text-xs text-muted-foreground">Hidden tiers are not shown to customers.</p></CardContent></Card>
    {(save.error?.message !== "CANCELLED" && save.error || duplicate.error) && <p role="alert" className="text-sm text-destructive">{save.error?.message ?? duplicate.error?.message}</p>}
    <Button className="w-full" disabled={!dirty || save.isPending} onClick={() => save.mutate()}>{save.isPending ? "Saving…" : tier ? "Save changes" : "Create tier"}</Button>
    {tier && <Button className="w-full" variant="outline" disabled={duplicate.isPending} onClick={() => duplicate.mutate()}><Copy /> {duplicate.isPending ? "Duplicating…" : "Duplicate tier"}</Button>}
    {tier && itemEditor && <TierItemDialog key={itemEditor.item?.id ?? `new-${itemEditor.initialType}`} packageId={packageId} tierId={tier.id} editor={itemEditor} onClose={() => setItemEditor(null)} />}
  </div>
}

function TierItemDialog({ packageId, tierId, editor, onClose }: { packageId: string; tierId: string; editor: NonNullable<ItemEditor>; onClose: () => void }) {
  const queryClient = useQueryClient(); const { merchant } = useAuth(); const current = editor.item
  const [itemType, setItemType] = useState<TierItemType>(current?.item_type ?? editor.initialType); const [name, setName] = useState(current?.name ?? ""); const [quantity, setQuantity] = useState(current?.quantity?.toString() ?? ""); const [unit, setUnit] = useState(current?.unit ?? ""); const [description, setDescription] = useState(current?.description ?? ""); const [price, setPrice] = useState(current?.price.toString() ?? ""); const [isActive, setIsActive] = useState(current?.is_active ?? true)
  const paid = itemType === "extra" || itemType === "upgrade"
  const mutation = useMutation({ mutationFn: async () => {
    if (!name.trim()) throw new Error("Item name is required")
    const parsedQuantity = quantity ? Number(quantity) : null; const parsedPrice = paid ? Number(price) : 0
    if (!paid && ((!!quantity !== !!unit.trim()) || (parsedQuantity !== null && (!Number.isSafeInteger(parsedQuantity) || parsedQuantity <= 0)))) throw new Error("Provide both quantity and unit, or leave both empty")
    if (paid && (!Number.isFinite(parsedPrice) || parsedPrice < 0)) throw new Error("Enter a valid price")
    if (current?.is_active && !isActive && !window.confirm("Hide this item from new quotations?")) throw new Error("CANCELLED")
    const input = { itemType, name, quantity: paid ? null : parsedQuantity, unit: unit.trim() || null, description: description || null, price: parsedPrice, isActive }
    return current ? updateMerchantTierItem(packageId, tierId, current.id, input) : createMerchantTierItem(packageId, tierId, input)
  }, onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ["merchant-catalog", merchant?.businessId] }); toast.success(current ? "Item saved" : "Item added"); onClose() } })
  return <Dialog open={editor !== null} onOpenChange={(open) => { if (!open) onClose() }}><DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-sm"><DialogHeader><DialogTitle>{current ? "Edit item" : "Add item"}</DialogTitle></DialogHeader><div className="space-y-4"><div className="space-y-2"><Label>Type</Label><Select value={itemType} onValueChange={(value) => setItemType(value as TierItemType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="inclusion">Inclusion</SelectItem><SelectItem value="freebie">Freebie</SelectItem><SelectItem value="extra">Extra</SelectItem><SelectItem value="upgrade">Upgrade</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>{paid ? <><div className="space-y-2"><Label>Price</Label><Input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} /></div><div className="space-y-2"><Label>Unit (optional)</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} /></div></> : <div className="grid grid-cols-2 gap-3"><div className="space-y-2"><Label>Quantity (optional)</Label><Input inputMode="numeric" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></div><div className="space-y-2"><Label>Unit (optional)</Label><Input value={unit} onChange={(e) => setUnit(e.target.value)} /></div></div>}<div className="space-y-2"><Label>Description (optional)</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></div>{current && <Button type="button" variant={isActive ? "default" : "outline"} onClick={() => setIsActive((value) => !value)}>{isActive ? "Active" : "Hidden"}</Button>}{mutation.error && mutation.error.message !== "CANCELLED" && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}</div><DialogFooter><Button variant="outline" onClick={onClose}>Cancel</Button><Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Saving…" : current ? "Save" : "Add"}</Button></DialogFooter></DialogContent></Dialog>
}
