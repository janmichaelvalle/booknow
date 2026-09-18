const DAY_MS = 86_400_000

export function parseDateOnly(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const timestamp = Date.parse(`${value}T00:00:00Z`)
  return Number.isFinite(timestamp) &&
    new Date(timestamp).toISOString().slice(0, 10) === value
    ? timestamp
    : null
}

export function isValidAvailabilityRange(from: string, to: string): boolean {
  const start = parseDateOnly(from)
  const end = parseDateOnly(to)
  return start !== null && end !== null && end >= start && end - start <= 92 * DAY_MS
}
