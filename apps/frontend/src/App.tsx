import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import useAuth from "@/context/useAuth"
import type { AppSurface } from "@/lib/app-host"
import { EditQuotationPage } from "@/pages/EditQuotationPage"
import { LoginPage } from "@/pages/LoginPage"
import { QuotationDetailsPage } from "@/pages/QuotationDetailsPage"
import { QuotationPage } from "@/pages/QuotationPage"
import { QuotationsListPage } from "@/pages/QuotationsListPage"

export default function App({ surface }: { surface: AppSurface }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto min-h-screen w-full max-w-md bg-muted/30">
        {surface.kind === "public" ? <PublicRoutes /> :
          surface.kind === "admin" ? <AdminRoutes /> :
          <p className="p-4">This hostname is not configured for QuotationMonkey.</p>}
        <Toaster />
      </main>
    </div>
  )
}

function PublicRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<NotFound />} />
      <Route path="/:businessSlug/quotations" element={<NotFound />} />
      <Route path="/:businessSlug" element={<QuotationPage />} />
      <Route path="/:businessSlug/:quotationReference" element={<QuotationDetailsPage />} />
      <Route path="/:businessSlug/:quotationReference/edit" element={<EditQuotationPage />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/quotations" replace />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route element={<RequireMerchant />}>
        <Route path="/quotations" element={<QuotationsListPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

function AdminLogin() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (isAuthenticated) return <Navigate to="/quotations" replace />
  return <LoginPage />
}

function RequireMerchant() {
  const { isAuthenticated, isLoading } = useAuth()
  if (isLoading) return null
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return <Outlet />
}

function NotFound() {
  return <p className="p-4">Page not found.</p>
}
