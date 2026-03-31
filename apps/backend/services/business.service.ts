import { supabase } from "../lib/supabase.js";
import { BusinessRow } from "../types/business.types.js";
import type { BusinessResult } from "../types/business.types.js";

export async function getBusinessBySlugOrError(slug: string): Promise<BusinessResult> {
  const { data, error } = await supabase
    .from('businesses')
    .select('id,name,slug')
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
