import { CalendarDays, FileText, Package, Settings } from "lucide-react"
import { NavLink, Outlet } from "react-router-dom"
import useAuth from "@/context/useAuth"
import { cn } from "@/lib/utils"

const sections = [
  { to: "/quotations", label: "Quotations", icon: FileText },
  { to: "/packages", label: "Packages", icon: Package },
  { to: "/availability", label: "Availability", icon: CalendarDays },
  { to: "/settings", label: "Settings", icon: Settings },
]

export function MerchantAppShell() {
  const { merchant } = useAuth()

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-4 py-4">
        <p className="text-xs font-medium text-muted-foreground">QuotationMonkey</p>
        <p className="truncate text-base font-semibold">{merchant?.businessName}</p>
      </header>

      <main className="px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      <nav aria-label="Merchant navigation" className="fixed inset-x-0 bottom-0 z-40">
        <div className="mx-auto grid w-full max-w-md grid-cols-4 border-t bg-background px-1 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] shadow-sm">
          {sections.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/quotations" ? false : true}
              className={({ isActive }) =>
                cn(
                  "flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 rounded-md px-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isActive && "bg-accent text-foreground"
                )
              }
            >
              <Icon aria-hidden="true" className="size-5" />
              <span className="truncate">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
