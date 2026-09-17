import { supabase } from "../lib/supabase.js"
import type {
  CloseReason,
  Quotation,
  QuotationFormBody,
  QuotationStatus,
  ServiceResponse,
  UpdateQuotationStatusBody,
} from "../lib/types.js"

type DatabaseError = {
  code?: string
  message?: string
  details?: string | null
}

type InclusionRow = {
  id: string
  item_type: "inclusion" | "freebie"
  name: string
  quantity: number
  unit: string
  description: string | null
  sort_order: number
}

type ItemRow = {
  id: string
  tier_item_id: string | null
  item_type: "extra" | "upgrade"
  item_name: string
  item_description: string | null
  unit: string
  unit_price: number | string
  quantity: number
  line_total: number | string
}

type PackageRow = {
  id: string
  package_id: string | null
  package_tier_id: string | null
  package_name: string
  tier_name: string
  price: number | string
  package_total: number | string
  selected_items_total: number | string
  total: number | string
  sort_order: number
  quotation_inclusions: InclusionRow[]
  quotation_items: ItemRow[]
}

type QuotationRow = {
  id: string
  quotation_reference: string
  business_id: string
  customer_name: string
  customer_email: string
  customer_phone: string
  event_date: string
  start_time: string
  end_time: string
  venue: string
  venue_place_id: string | null
  venue_locality: string
  venue_region: string
  occasion: string
  guest_count: number
  packages_total: number | string
  selected_items_total: number | string
  transportation_fee: number | string
  grand_total: number | string
  quotation_status: QuotationStatus
  close_reason: CloseReason | null
  close_reason_notes: string | null
  created_at: string
  updated_at: string
  quotation_packages: PackageRow[]
}

const QUOTATION_SELECT = `
  id,
  quotation_reference,
  business_id,
  customer_name,
  customer_email,
  customer_phone,
  event_date,
  start_time,
  end_time,
  venue,
  venue_place_id,
  venue_locality,
  venue_region,
  occasion,
  guest_count,
  packages_total,
  selected_items_total,
  transportation_fee,
  grand_total,
  quotation_status,
  close_reason,
  close_reason_notes,
  created_at,
  updated_at,
  quotation_packages (
    id,
    package_id,
    package_tier_id,
    package_name,
    tier_name,
    price,
    package_total,
    selected_items_total,
    total,
    sort_order,
    quotation_inclusions (
      id,
      item_type,
      name,
      quantity,
      unit,
      description,
      sort_order
    ),
    quotation_items (
      id,
      tier_item_id,
      item_type,
      item_name,
      item_description,
      unit,
      unit_price,
      quantity,
      line_total
    )
  )
`

function numberValue(value: number | string) {
  return Number(value)
}

function mapQuotation(row: QuotationRow): Quotation {
  const packages = [...(row.quotation_packages ?? [])]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((quotedPackage) => ({
      id: quotedPackage.id,
      packageId: quotedPackage.package_id,
      tierId: quotedPackage.package_tier_id,
      packageName: quotedPackage.package_name,
      tierName: quotedPackage.tier_name,
      price: numberValue(quotedPackage.price),
      packageTotal: numberValue(quotedPackage.package_total),
      selectedItemsTotal: numberValue(quotedPackage.selected_items_total),
      total: numberValue(quotedPackage.total),
      sortOrder: quotedPackage.sort_order,
      inclusions: [...(quotedPackage.quotation_inclusions ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((inclusion) => ({
          id: inclusion.id,
          itemType: inclusion.item_type,
          name: inclusion.name,
          quantity: inclusion.quantity,
          unit: inclusion.unit,
          description: inclusion.description,
          sortOrder: inclusion.sort_order,
        })),
      selectedItems: (quotedPackage.quotation_items ?? []).map((item) => ({
        id: item.id,
        tierItemId: item.tier_item_id,
        itemType: item.item_type,
        name: item.item_name,
        description: item.item_description,
        unit: item.unit,
        unitPrice: numberValue(item.unit_price),
        quantity: item.quantity,
        lineTotal: numberValue(item.line_total),
      })),
    }))

  return {
    id: row.id,
    quotationReference: row.quotation_reference,
    businessId: row.business_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    eventDate: row.event_date,
    startTime: row.start_time,
    endTime: row.end_time,
    venue: row.venue,
    venuePlaceId: row.venue_place_id,
    venueLocality: row.venue_locality,
    venueRegion: row.venue_region,
    occasion: row.occasion,
    guestCount: row.guest_count,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    packages,
    packagesTotal: numberValue(row.packages_total),
    selectedItemsTotal: numberValue(row.selected_items_total),
    transportationFee: numberValue(row.transportation_fee),
    grandTotal: numberValue(row.grand_total),
    quotationStatus: row.quotation_status,
    closeReason: row.close_reason,
    closeReasonNotes: row.close_reason_notes,
  }
}

function isQuotationReferenceCollision(error: DatabaseError | null) {
  return (
    error?.code === "23505" &&
    (error.message?.includes("quotations_quotation_reference_unique") ||
      error.details?.includes("quotation_reference"))
  )
}

function validateBody(body: QuotationFormBody): string | null {
  if (!Array.isArray(body.packages) || body.packages.length === 0) {
    return "At least one package is required"
  }

  if (new Set(body.packages.map((pkg) => pkg.packageId)).size !== body.packages.length) {
    return "A package can appear only once per quotation"
  }

  if (!body.venueLocality || !body.venueRegion) {
    return "A venue selected from autocomplete is required"
  }

  return null
}

export async function getQuotationsByBusiness(
  businessId: string
): Promise<ServiceResponse<Quotation[]>> {
  const { data, error } = await supabase
    .from("quotations")
    .select(QUOTATION_SELECT)
    .eq("business_id", businessId)
    .order("created_at", { ascending: false })

  if (error) {
    return {
      error: {
        message: "Failed to fetch quotations",
        details: error.message,
        status: 500,
      },
    }
  }

  return { data: ((data ?? []) as QuotationRow[]).map(mapQuotation) }
}

export async function getQuotationByReference(
  businessId: string,
  quotationReference: string
): Promise<ServiceResponse<Quotation>> {
  const { data, error } = await supabase
    .from("quotations")
    .select(QUOTATION_SELECT)
    .eq("business_id", businessId)
    .eq("quotation_reference", quotationReference.toUpperCase())
    .maybeSingle()

  if (error) {
    return {
      error: {
        message: "Failed to fetch quotation",
        details: error.message,
        status: 500,
      },
    }
  }

  if (!data) {
    return { error: { message: "Quotation not found", status: 404 } }
  }

  return { data: mapQuotation(data as QuotationRow) }
}

async function saveQuotation(
  businessId: string,
  body: QuotationFormBody,
  quotationId: string | null
): Promise<ServiceResponse<Quotation>> {
  const validationError = validateBody(body)
  if (validationError) {
    return { error: { message: validationError, status: 400 } }
  }

  const maximumAttempts = quotationId ? 1 : 3
  let saveError: DatabaseError | null = null
  let savedReference: string | null = null

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    const result = await supabase.rpc("save_quotation", {
      p_business_id: businessId,
      p_payload: body,
      p_quotation_id: quotationId,
    })

    saveError = result.error
    savedReference = result.data?.[0]?.quotation_reference ?? null

    if (!isQuotationReferenceCollision(result.error)) {
      break
    }
  }

  if (saveError || !savedReference) {
    return {
      error: {
        message: quotationId
          ? "Failed to update quotation"
          : "Failed to create quotation",
        details: saveError?.message ?? "No quotation returned",
        status: 500,
      },
    }
  }

  return getQuotationByReference(businessId, savedReference)
}

export function createQuotation(
  businessId: string,
  body: QuotationFormBody
) {
  return saveQuotation(businessId, body, null)
}

export async function updateQuotation(
  businessId: string,
  quotationReference: string,
  body: QuotationFormBody
): Promise<ServiceResponse<Quotation>> {
  const existing = await getQuotationByReference(businessId, quotationReference)
  if ("error" in existing) {
    return existing
  }

  return saveQuotation(businessId, body, existing.data.id)
}

export async function updateQuotationStatus(
  businessId: string,
  quotationReference: string,
  body: UpdateQuotationStatusBody
): Promise<ServiceResponse<Quotation>> {
  const payload = {
    quotation_status: body.quotationStatus,
    close_reason:
      body.quotationStatus === "closed" ? body.closeReason ?? null : null,
    close_reason_notes:
      body.quotationStatus === "closed" ? body.closeReasonNotes ?? null : null,
  }

  const { error } = await supabase
    .from("quotations")
    .update(payload)
    .eq("business_id", businessId)
    .eq("quotation_reference", quotationReference.toUpperCase())

  if (error) {
    return {
      error: {
        message: "Failed to update quotation status",
        details: error.message,
        status: 500,
      },
    }
  }

  return getQuotationByReference(businessId, quotationReference)
}
