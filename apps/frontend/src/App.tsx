import { useContext } from 'react'
import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { QuotationPage } from "./pages/QuotationPage"
import { ReservationPage } from "./pages/ReservationPage"
import { ReservationsListPage } from "./pages/ReservationsListPage"
import { AuthContext } from './context/AuthContext'
import { LoginPage } from "./pages/LoginPage";


function App() {

  // useEffect(() => {
  //   fetch("http://localhost:3000/api/reservation", {
  //     method: "POST",
  //     headers: {
  //       type: "application/json"
  //     },
  //     body: JSON.stringify({

  //     })
  //   })
  //   .then((res) => res.json())
  //   .then((data) => console.log(data))
  // }, []) // initial load

  return (
    <Routes>
      <Route path="/" element={<QuotationPage />}/>
      <Route path="/reservation/:reservationNo" element={<ReservationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedPage />}>
        <Route path="/reservations" element={<ReservationsListPage />} />
      </Route>
    </Routes>
  )
}

function ProtectedPage() {
  // 1. check auth status
  // 2. redirect to login if not logged in

  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Outlet />
}

// Custom hook
function useAuth() {
  // Access to react hooks and component lifecycle

  // 1. Check if there's a token saved usually on localStorage (or Cookie)
  // 2. Return true if there is, otherwise, false

  // React docs
  const { isAuthenticated } = useContext(AuthContext)



  return {
    isAuthenticated,
  }
}

export default App
