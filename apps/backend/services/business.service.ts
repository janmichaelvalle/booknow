import { supabase } from "../lib/supabase.js";
import { BusinessRow } from "../lib/types.js";
import type { BusinessResult } from "../lib/types.js";

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
        status: 500,
      }
    }
  }
  if (!data) {
    return {
      error: {
        message: "Business not found",
        status: 404,
      }
    }
  }
  return {
    business: data as BusinessRow,
  }
}

// Gets all packages of the business
export async function getAllOfferings(businessId: string) {
  const packagesResult = await supabase
    .from("business_packages")
    .select("id, name, badge_text, description")
    .eq("business_id", businessId)
    .eq("is_active", true)

  if (packagesResult.error) {
    return {
      error: {
        message: "Failed to fetch packages",
        details: packagesResult.error.message,
        status: 500,
      }
    }
  }


  if (!packagesResult.data || packagesResult.data.length === 0) {
    return {
      error: {
        message: "No packages found",
        status: 404,
      }
    }
  }
  const packageIds = packagesResult.data.map((pkg) => pkg.id)

  const packageTiersResult = await supabase
    .from("business_package_tiers")
    .select("id, package_id, guest_capacity, fixed_price")
    .in("package_id", packageIds)
    .eq("is_active", true)
    .order("guest_capacity", { ascending: true })

  if (packageTiersResult.error) {
    return {
      error: {
        message: "Failed to fetch package tiers",
        details: packageTiersResult.error.message,
        status: 500,
      },
    }
  }

  if (!packageTiersResult.data || packageTiersResult.data.length === 0) {
    return {
      error: {
        message: "No active package tiers found",
        status: 404,
      },
    }
  }

  const addonsResult = await supabase
    .from("business_addons")
    .select("id, name, description, price")
    .eq("business_id", businessId)
    .eq("is_active", true)

  if (addonsResult.error) {
    return {
      error: {
        message: "Failed to fetch add-ons",
        details: addonsResult.error.message,
        status: 500,
      }
    }
  }

  return {
    data: {
      packages: packagesResult.data,
      packageTiers: packageTiersResult.data,
      addons: addonsResult.data,
    },
  }
}
