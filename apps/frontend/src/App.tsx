import { Navigate, Outlet, Route, Routes } from "react-router-dom"
import { Toaster } from "@/components/ui/sonner"
import useAuth from "@/context/useAuth"
import type { AppSurface } from "@/lib/app-host"
import { EditQuotationPage } from "@/pages/EditQuotationPage"
import { LoginPage } from "@/pages/LoginPage"
import { QuotationDetailsPage } from "@/pages/QuotationDetailsPage"
import { QuotationPage } from "@/pages/QuotationPage"
import { QuotationsListPage } from "@/pages/QuotationsListPage"
import { MerchantAppShell } from "@/components/merchant/MerchantAppShell"
import { MerchantQuotationDetailsPage } from "@/pages/MerchantQuotationDetailsPage"
import { MerchantSectionPage } from "@/pages/MerchantSectionPage"
import { MerchantAvailabilityPage } from "@/pages/MerchantAvailabilityPage"
import { MerchantPackagesPage } from "@/pages/MerchantPackagesPage"
import { MerchantPackageEditorPage } from "@/pages/MerchantPackageEditorPage"
import { MerchantTierEditorPage } from "@/pages/MerchantTierEditorPage"

export default function App({ surface }: { surface: AppSurface }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <main className="mx-auto min-h-screen w-full max-w-md bg-muted/30">
        {surface.kind === "public" ? <PublicRoutes /> :
          surface.kind === "admin" ? <AdminRoutes /> :
          <p className="p-4">This hostname is not configured for QuotationMonkey.</p>}
        <Toaster
          position={surface.kind === "admin" ? "top-center" : undefined}
          offset={surface.kind === "admin"
            ? { top: "calc(env(safe-area-inset-top, 0px) + 16px)" }
            : undefined}
          mobileOffset={surface.kind === "admin"
            ? {
                top: "calc(env(safe-area-inset-top, 0px) + 16px)",
                left: 16,
                right: 16,
              }
            : undefined}
        />
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
        <Route element={<MerchantAppShell />}>
          <Route path="/quotations" element={<QuotationsListPage />} />
          <Route path="/quotations/:quotationReference" element={<MerchantQuotationDetailsPage />} />
          <Route path="/packages" element={<MerchantPackagesPage />} />
          <Route path="/packages/new" element={<MerchantPackageEditorPage />} />
          <Route path="/packages/:packageId" element={<MerchantPackageEditorPage />} />
          <Route path="/packages/:packageId/tiers/new" element={<MerchantTierEditorPage />} />
          <Route path="/packages/:packageId/tiers/:tierId" element={<MerchantTierEditorPage />} />
          <Route path="/availability" element={<MerchantAvailabilityPage />} />
          <Route path="/settings" element={<MerchantSectionPage section="Settings" />} />
        </Route>
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
