import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button"


export function LoginPage() {
  const navigate = useNavigate();
  // Use the useAuth, instead of directly accessing the AuthContext
  const { login } = useContext(AuthContext);



  function handleLogin() {
    // fake login
    login();
    navigate("/reservations");
  }

  return (
    <div>
      <h1>Login Page</h1>
      <Button onClick={handleLogin}>Log in</Button>
    </div>
  );
}
