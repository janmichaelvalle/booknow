import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/login/LoginForm";
import { supabase } from "@/lib/supabase";


export function LoginPage() {
  const navigate = useNavigate();

  async function handleLogin(email: string, password: string) {

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      console.error("Login failed:", authError.message)
      return
    }

    const userId = authData.user?.id

    if (!userId) {
      console.error("Logged-in user ID is missing")
      return
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('business_id')
      .eq('auth_user_id', userId)
      .maybeSingle()

    if (userError) {
      console.error("Failed to fetch app user:", userError.message)
      return
    }

    if (!userData) {
      console.error("No matching app user found")
      return
    }

    const businessId = userData?.business_id

    const { data: businessData, error: businessError } = await supabase
      .from('businesses')
      .select('slug')
      .eq('id', businessId)
      .maybeSingle()

    if (businessError) {
      console.error("Failed to fetch business:", businessError.message)
      return
    }

    if (!businessData) {
      console.error("Business not found")
      return
    }

    const businessSlug = businessData?.slug

    if (!businessSlug) {
      console.error("Business slug is missing")
      return
    }

    navigate(`/${businessSlug}/reservations`)

    // await pauses until the backend responds and const response stores the server's response
    // const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/login`,
    //   {
    //     method: "POST",
    //     headers: {
    //       // This tells that backend that FE is sending JSON data.
    //       "Content-Type": "application/json"

    //     },
    //     // JSON.stringify turns that JavaScript object into a JSON string so it can be sent over HTTP
    //     body: JSON.stringify({ email, password }),
    //   })
    // const data = await response.json()
    // console.log(response.status)
    // console.log(data)
    // if (!response.ok) {
    //   return
    // }
    // login(data.token)

  }

  // function handleLogin(email: string, password:string) { 
  //   // fake login
  //   login();
  //   navigate("/reservations");
  //   console.log(email)
  //   console.log(password)
  // }

  return (
    <div>
      <h1>Login Page</h1>
      {/* Passes prop onSubmit to LoginForm */}
      <LoginForm onSubmit={handleLogin} />
    </div>
  );
}
