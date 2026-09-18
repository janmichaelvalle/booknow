import { Button } from "@/components/ui/button"
import useAuth from "@/context/useAuth"
import { useNavigate } from "react-router-dom"

export function MerchantSectionPage({ section }: { section: "Packages" | "Settings" }) {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">{section}</h1>
      <p className="text-sm text-muted-foreground">
        {section === "Settings"
          ? "Business and account settings are coming soon."
          : `${section} management is coming soon.`}
      </p>
      {section === "Settings" && (
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            await logout()
            navigate("/login", { replace: true })
          }}
        >
          Log out
        </Button>
      )}
    </div>
  )
}
