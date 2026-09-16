import { supabase } from "../lib/supabase.js"
import type { BusinessResult, BusinessRow } from "../lib/types.js"

export async function getBusinessBySlugOrError(slug: string): Promise<BusinessResult> {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, slug, description, phone, email, facebook_url, instagram_url, logo_url')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    return {
      error: {
        message: 'Failed to fetch business',
        details: error.message,
        status: 500 as const,
      }
    }
  }
  if (!data) {
    return {
      error: {
        message: "Business not found",
        status: 404 as const,
      }
    }
  }
  return {
    business: data as BusinessRow,
  }
}

// Gets all packages
export async function getAllOfferings(businessId: string) {
  const packagesResult = await supabase
    .from("business_packages")
    .select("id, name, badge_text, description, tier_unit")
    .eq("business_id", businessId)
    .eq("is_active", true)

  if (packagesResult.error) {
    return {
      error: {
        message: "Failed to fetch packages",
        details: packagesResult.error.message,
        status: 500 as const,
      }
    }
  }


  if (!packagesResult.data || packagesResult.data.length === 0) {
    return {
      error: {
        message: "No packages found",
        status: 404 as const,
      }
    }
  }
  const packageIds = packagesResult.data.map((pkg) => pkg.id)

  const packageInclusionsResult = await supabase
    .from("business_package_inclusions")
    .select("id, package_id, name, quantity, unit, description, sort_order")
    .in("package_id", packageIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (packageInclusionsResult.error) {
    return {
      error: {
        message: "Failed to fetch package inclusions",
        details: packageInclusionsResult.error.message,
        status: 500 as const,
      },
    }
  }


  // Gets all tiers of packages
  const packageTiersResult = await supabase
    .from("business_package_tiers")
    .select("id, package_id, tier_value, pricing_type, price")
    .in("package_id", packageIds)
    .eq("is_active", true)
    .order("tier_value", { ascending: true })

  if (packageTiersResult.error) {
    return {
      error: {
        message: "Failed to fetch package tiers",
        details: packageTiersResult.error.message,
        status: 500 as const,
      },
    }
  }

  if (!packageTiersResult.data || packageTiersResult.data.length === 0) {
    return {
      error: {
        message: "No active package tiers found",
        status: 404 as const,
      },
    }
  }

  // Gets all items of those tiers
  const packageTierIds = packageTiersResult.data.map((tier) => tier.id)
  const packageTierItemsResult = await supabase
    .from("business_package_tier_items")
    .select(`
    id,
    package_tier_id,
    item_type,
    name,
    quantity,
    unit,
    description,
    price,
    sort_order
  `)
    .in("package_tier_id", packageTierIds)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })

  if (packageTierItemsResult.error) {
    return {
      error: {
        message: "Failed to fetch package tier items",
        details: packageTierItemsResult.error.message,
        status: 500 as const,
      },
    }
  }

  return {
    data: {
      packages: packagesResult.data,
      packageInclusions: packageInclusionsResult.data,
      packageTiers: packageTiersResult.data,
      packageTierItems: packageTierItemsResult.data,
    },
  }
}
