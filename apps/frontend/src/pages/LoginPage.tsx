import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { LoginForm } from "@/components/login/LoginForm"
import useAuth from "@/context/useAuth"
import { supabase } from "@/lib/supabase"

export function LoginPage() {
  const navigate = useNavigate()
  const { refreshMerchant } = useAuth()
  const [errorMessage, setErrorMessage] = useState("")

  async function handleLogin(email: string, password: string) {
    setErrorMessage("")
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrorMessage(error.message)
      return
    }

    try {
      const merchant = await refreshMerchant()
      if (!merchant) throw new Error("No business is linked to this account")
      navigate("/quotations", { replace: true })
    } catch {
      setErrorMessage("Your account could not be linked to a business. Contact support.")
    }
  }

  return (
    <div className="p-4">
      <LoginForm onSubmit={handleLogin} />
      {errorMessage && <p role="alert" className="mt-3 text-sm text-destructive">{errorMessage}</p>}
    </div>
  )
}
