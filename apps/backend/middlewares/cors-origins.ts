export function parseCorsOrigins(value: string | undefined): Set<string> {
  const origins = value?.split(",").map((origin) => origin.trim()).filter(Boolean) ?? []
  if (origins.length === 0) {
    throw new Error("CORS_ORIGINS must contain at least one exact origin")
  }

  for (const origin of origins) {
    let parsed: URL
    try {
      parsed = new URL(origin)
    } catch {
      throw new Error(`Invalid CORS origin: ${origin}`)
    }
    if (!(["http:", "https:"].includes(parsed.protocol)) || parsed.origin !== origin) {
      throw new Error(`CORS origin must be an exact http(s) origin: ${origin}`)
    }
  }

  return new Set(origins)
}
