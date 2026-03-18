
import { useContext } from 'react'
import { AuthContext } from './AuthContext'


// Custom hook (improvement notes: move this alongsie the context it's exposing)
export default function useAuth() {
    // Access to react hooks and component lifecycle

  // 1. Check if there's a token saved usually on localStorage (or Cookie)
  // 2. Return true if there is, otherwise, false

  // React docs
    const { isAuthenticated, logout} = useContext(AuthContext)
    // existing login function from AuthContext and passing it through the hook.
    
      return {
        isAuthenticated,
        logout,
      }
}
