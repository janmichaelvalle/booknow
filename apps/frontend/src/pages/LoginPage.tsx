import { useNavigate } from "react-router-dom";

import useAuth from "@/context/useAuth";
import { LoginForm } from "@/components/login/LoginForm";


export function LoginPage() {
  const navigate = useNavigate();
  // Use the useAuth, instead of directly accessing the AuthContext
  const { login } = useAuth();



  function handleLogin() {
    // fake login
    login();
    navigate("/reservations");
  }

  return (
    <div>
      <h1>Login Page</h1>
      {/* Passes prop onSubmit to LoginForm */}
      <LoginForm onSubmit={handleLogin}/>
    </div>
  );
}
