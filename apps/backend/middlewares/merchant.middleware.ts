import { createMiddleware } from "hono/factory"
import { supabase } from "../lib/supabase.js"
import type { BusinessRow } from "../lib/types.js"

export type Merchant = {
  authUserId: string
  businessId: string
  businessName: string
  businessSlug: string
}

type MerchantResolution =
  | { merchant: Merchant }
  | { status: 401 | 403 | 500; message: string }

type ResolveMerchant = (accessToken: string) => Promise<MerchantResolution>

async function resolveMerchant(accessToken: string): Promise<MerchantResolution> {
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken)
  if (authError || !authData.user) {
    return { status: 401, message: "Invalid or expired merchant session" }
  }

  const { data: user, error: userError } = await supabase
    .from("users")
    .select("business_id")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle()

  if (userError) return { status: 500, message: "Failed to resolve merchant" }
  if (!user) return { status: 403, message: "Merchant account is not linked to a business" }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, name, slug")
    .eq("id", user.business_id)
    .maybeSingle()

  if (businessError) return { status: 500, message: "Failed to resolve merchant business" }
  if (!business) return { status: 403, message: "Merchant business not found" }

  return {
    merchant: {
      authUserId: authData.user.id,
      businessId: business.id,
      businessName: business.name,
      businessSlug: business.slug,
    },
  }
}

// Exported factory lets the authorization boundary be tested without Supabase.
export function createMerchantAuthMiddleware(resolve: ResolveMerchant) {
  return createMiddleware(async (c, next) => {
    const authorization = c.req.header("Authorization") ?? ""
    const match = /^Bearer\s+(\S+)$/i.exec(authorization)
    if (!match) return c.json({ message: "Merchant authentication required" }, 401)

    const result = await resolve(match[1])
    if ("status" in result) {
      return c.json({ message: result.message }, result.status)
    }

    c.set("merchant", result.merchant)
    await next()
  })
}

export const merchantAuthMiddleware = createMerchantAuthMiddleware(resolveMerchant)

export const merchantBusinessMiddleware = createMiddleware(async (c, next) => {
  const merchant = c.get("merchant")
  const business = c.get("business")
  if (!merchant || !business || merchant.businessId !== business.id) {
    return c.json({ message: "You cannot access this business" }, 403)
  }
  await next()
})

declare module "hono" {
  interface ContextVariableMap {
    merchant: Merchant
    business: BusinessRow
  }
}
