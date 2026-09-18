export type AppSurface = {
  kind: "public" | "admin" | "unsupported"
  basename?: string
}

const publicHostname = "quotationmonkey.com"
const adminHostname = "admin.quotationmonkey.com"

function isDevelopmentOrPreviewHost(hostname: string) {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname.endsWith(".vercel.app")
}

export function resolveAppSurface(hostname: string, pathname: string): AppSurface {
  if (hostname === publicHostname) return { kind: "public" }
  if (hostname === adminHostname) return { kind: "admin" }

  if (isDevelopmentOrPreviewHost(hostname)) {
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
      return { kind: "admin", basename: "/admin" }
    }
    return { kind: "public" }
  }

  return { kind: "unsupported" }
}

export function publicQuotationUrl(
  businessSlug: string,
  quotationReference: string,
  hostname: string,
  origin: string
) {
  const publicOrigin = isDevelopmentOrPreviewHost(hostname)
    ? origin
    : `https://${publicHostname}`

  return `${publicOrigin}/${encodeURIComponent(businessSlug)}/${encodeURIComponent(quotationReference)}`
}
