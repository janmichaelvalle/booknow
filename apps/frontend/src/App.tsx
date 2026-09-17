import { Routes, Route, Navigate, Outlet, useMatch } from "react-router-dom"
import { QuotationPage } from "./pages/QuotationPage"
import { QuotationDetailsPage } from "./pages/QuotationDetailsPage"
import { QuotationsListPage } from "./pages/QuotationsListPage"
import { LoginPage } from "./pages/LoginPage";
import useAuth from './context/useAuth' 
import { EditQuotationPage } from "./pages/EditQuotationPage"
import { Toaster } from "@/components/ui/sonner"


function App() {

  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto min-h-screen w-full max-w-md bg-muted/30">

    <Routes>
      <Route path="/:businessSlug" element={<QuotationPage />}/>
      <Route path="/:businessSlug/:quotationReference" element={<QuotationDetailsPage />} />
      <Route path="/:businessSlug/:quotationReference/edit" element={<EditQuotationPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedPage />}>
        <Route path="/:businessSlug/quotations" element={<QuotationsListPage />} />
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

  const { isAuthenticated, isLoading, merchant } = useAuth()
  const businessSlug = useMatch("/:businessSlug/quotations")?.params.businessSlug

  if (isLoading) return null

  if (!isAuthenticated) return <Navigate to="/login" replace />

  if (businessSlug !== merchant?.businessSlug) {
    return <Navigate to={`/${merchant?.businessSlug}/quotations`} replace />
  }

  return <Outlet />
}



export default App
