import { createContext, useCallback, useEffect, useRef, useState } from "react"
import type { ReactNode } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"

export type Merchant = {
  authUserId: string
  businessId: string
  businessName: string
  businessSlug: string
}

type AuthContextType = {
  merchant: Merchant | null
  isAuthenticated: boolean
  isLoading: boolean
  refreshMerchant: () => Promise<Merchant | null>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | null>(null)

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const requestId = useRef(0)
  const queryClient = useQueryClient()

  const loadMerchant = useCallback(async (token: string | undefined): Promise<Merchant | null> => {
    const currentRequest = ++requestId.current
    if (!token) {
      setMerchant(null)
      setIsLoading(false)
      queryClient.removeQueries({ queryKey: ["quotations"] })
      return null
    }

    setIsLoading(true)
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error("Could not load merchant account")
      const result = await response.json() as { data: Merchant }
      if (currentRequest === requestId.current) setMerchant(result.data)
      return result.data
    } catch (error) {
      if (currentRequest === requestId.current) setMerchant(null)
      throw error
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false)
    }
  }, [queryClient])

  async function refreshMerchant() {
    const { data, error } = await supabase.auth.getSession()
    if (error) throw error
    return loadMerchant(data.session?.access_token)
  }

  useEffect(() => {
    let active = true
    void supabase.auth.getSession().then(({ data }) => {
      if (active) void loadMerchant(data.session?.access_token).catch(() => {})
    })

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "INITIAL_SESSION") return
      if (event === "SIGNED_OUT") {
        void loadMerchant(undefined)
      } else if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        void loadMerchant(session?.access_token).catch(() => {})
      }
    })
    return () => {
      active = false
      requestId.current += 1
      listener.subscription.unsubscribe()
    }
  }, [loadMerchant])

  async function logout() {
    await supabase.auth.signOut()
    void loadMerchant(undefined)
  }

  return (
    <AuthContext.Provider value={{
      merchant,
      isAuthenticated: merchant !== null,
      isLoading,
      refreshMerchant,
      logout,
    }}>
      {children}
    </AuthContext.Provider>
  )
}
