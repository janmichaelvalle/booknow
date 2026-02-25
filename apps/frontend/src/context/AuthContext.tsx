import { useState, useEffect, createContext } from 'react';

// createContext React docs
export const AuthContext = createContext({
    isAuthenticated: false,
    setIsAuthenticated: () => { }
});

const VALID_TOKEN = "token123";

// Not in react docs, but we need to wrap the AuthContext to manage auth states
export default function AuthProvider({ children }) {
    // States here
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        localStorage.setItem("token", "sdaskj123213lsdkaj")
        // sync isAuthenticated state to localStorage
        // if there's a backend auth already, fetch the token there and sync localStorage
        
    }, [])

    return (
        // React docs
        <AuthContext value={
            {
                isAuthenticated,
                setIsAuthenticated
            }
        }>
            {children}
        </AuthContext>
    )
}
