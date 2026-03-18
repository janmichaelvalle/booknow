import { useNavigate } from "react-router-dom";
import useAuth from "@/context/useAuth";
import { LoginForm } from "@/components/login/LoginForm";
import { supabase } from "@/lib/supabase";


export function LoginPage() {
  const navigate = useNavigate();

  async function handleLogin(email: string, password: string) {

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (data.session && !error) {
      console.log(data.user)
      navigate("/reservations")
    }
   


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
