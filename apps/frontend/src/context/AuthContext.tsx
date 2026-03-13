import { useState, useEffect, createContext } from 'react';
import type { ReactNode } from "react";

type AuthProviderProps = {
  children: ReactNode;
};

// Shape of the auth data
type AuthContextType = {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
};

// createContext React docs
// These are just fallback balues so React knows the shape of the context
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  login: () => { },
  logout: () => { },
});

const VALID_TOKEN = "token123";
const TOKEN_KEY = "token";

// Not in react docs, but we need to wrap the AuthContext to manage auth states (FOCUS ON THIS)
export default function AuthProvider({ children }: AuthProviderProps) {
  // States here
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Gets the token from localstorage
    const token = localStorage.getItem(TOKEN_KEY)

    // If the token is valid, setIsAuthenticated will be true
    setIsAuthenticated(token === VALID_TOKEN)
  }, [])


  function login() {
    localStorage.setItem(TOKEN_KEY, VALID_TOKEN);
    setIsAuthenticated(true);
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    setIsAuthenticated(false);
  }

  return (
    // All components inside this provider can access these values
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {/* children is just whatever components are wrapped inside the provider. */}
      {children}
    </AuthContext.Provider>
  );
}
