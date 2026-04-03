/* AuthContext should mainly answer:
is the user authenticated?
who is the user?
how do I log out?
*/


import { useState, useEffect, createContext } from 'react';
import type { ReactNode } from "react";
import { supabase } from "@/lib/supabase";

type AuthProviderProps = {
  children: ReactNode;
};

// Shape of the auth data
type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  logout: () => void;
};

// createContext React docs
// These are just fallback balues so React knows the shape of the context
export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: false,
  logout: () => { },
});


// Not in react docs, but we need to wrap the AuthContext to manage auth states (FOCUS ON THIS)
export default function AuthProvider({ children }: AuthProviderProps) {
  // Adds an isAuthenticated state
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)


  useEffect(() => {
    

    setIsLoading(true)
    // An async function that awaits the result of getSession(). If session exists and there is no error, user is authenticated

    
    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()
      setIsAuthenticated(Boolean(data.session) && !error)
      setIsLoading(false)
    }

    // Call the async function
    loadSession()

    /* onAuthStateChange documentation
    https://supabase.com/docs/reference/javascript/auth-signup#:~:text=Response-,Listen%20to%20auth%20events,-onAuthStateChange(callback)
    */
    // Create the listener variable deconstructed from onAuthStateChange. If session exists, user is authenticated
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(Boolean(session))
      setIsLoading(false)
    })


    // In useEffect, we can return a function. Unsubscribes from auth listener when component unmounts / before effect reruns. 
    return () => {
      listener.subscription.unsubscribe()
    }
    
    
  }, [])


  async function logout() {
    await supabase.auth.signOut()
    setIsAuthenticated(false)
  }

  return (
    // All components inside this provider can access these values
    <AuthContext.Provider value={{ isAuthenticated, logout, isLoading }}>
      {/* children is just whatever components are wrapped inside the provider. */}
      {children}
    </AuthContext.Provider>
  );
}
