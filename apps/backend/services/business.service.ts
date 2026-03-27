import { supabase } from "../lib/supabase.js";
import { BusinessRow } from "../types/business.types.js";

// Get businesss slug
export async function getBusinessBySlug(slug: string) {
  const { data, error } = await supabase
    .from('businesses')
    .select('id,name,slug')
    .eq('slug', slug)
    .maybeSingle()

  return {
    business: data as BusinessRow | null,
    error,
  }
}

