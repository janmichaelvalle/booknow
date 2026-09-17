import { supabase } from "@/lib/supabase"

export async function merchantFetch(path: string, init?: RequestInit): Promise<Response> {
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session?.access_token) throw new Error("Merchant login required")

  const headers = new Headers(init?.headers)
  headers.set("Authorization", `Bearer ${data.session.access_token}`)
  return fetch(`${import.meta.env.VITE_BASE_URL}${path}`, { ...init, headers })
}
