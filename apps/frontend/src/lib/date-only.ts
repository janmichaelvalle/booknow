import { format, parseISO } from "date-fns"

export function toDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd")
}

export function fromDateOnly(value: string): Date {
  return parseISO(value)
}

export function todayInManila(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}`
}
