import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { Button } from "@/components/ui/button"

export function LoginPage() {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);

  function handleLogin() {
    // fake login
    localStorage.setItem("token", "token123");
    setIsAuthenticated(true);

    // go to protected page
    navigate("/reservations");
  }

  return (
    <div>
      <h1>Login Page</h1>
      <Button onClick={handleLogin}>Log in</Button>
    </div>
  );
}
