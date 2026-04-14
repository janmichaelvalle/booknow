import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { QuotationPage } from "./pages/QuotationPage"
import { ReservationPage } from "./pages/ReservationPage"
import { ReservationsListPage } from "./pages/ReservationsListPage" 
import { LoginPage } from "./pages/LoginPage";
import useAuth from './context/useAuth' 
import { EditQuotationPage } from "./pages/EditQuotationPage"
import { Toaster } from "@/components/ui/sonner"


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
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto min-h-screen w-full max-w-md bg-muted/30">

    <Routes>
      <Route path="/:businessSlug" element={<QuotationPage />}/>
      <Route path="/:businessSlug/reservation/:reservationId" element={<ReservationPage />} />
      <Route path="/:businessSlug/reservation/:reservationId/edit" element={<EditQuotationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedPage />}>
        <Route path="/:businessSlug/reservations" element={<ReservationsListPage />} />
      </Route>
    </Routes>
    <Toaster />
    </main>
    </div>
  )
}

function ProtectedPage() {
  // 1. check auth status
  // 2. redirect to login if not logged in

  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) return null

  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <Outlet />
}



export default App
