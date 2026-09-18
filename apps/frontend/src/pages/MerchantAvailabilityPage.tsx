import { useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { endOfMonth, format, startOfMonth } from "date-fns"
import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import useAuth from "@/context/useAuth"
import { fromDateOnly, toDateOnly, todayInManila } from "@/lib/date-only"
import {
  getMerchantAvailability,
  getMerchantDateEvents,
  saveDateCapacity,
  saveDefaultDailyCapacity,
  type MerchantAvailabilityDate,
} from "@/lib/merchant-availability"

type DateMode = "default" | "custom" | "unavailable"

function parseNonNegativeInteger(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null
  const number = Number(value)
  return Number.isSafeInteger(number) ? number : null
}

function capacityLabel(capacity: number | null) {
  return capacity === null ? "Unlimited" : `${capacity} event${capacity === 1 ? "" : "s"} per day`
}

export function MerchantAvailabilityPage() {
  const { merchant } = useAuth()
  const queryClient = useQueryClient()
  const today = todayInManila()
  const [month, setMonth] = useState(() => startOfMonth(fromDateOnly(today)))
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const from = toDateOnly(startOfMonth(month))
  const to = toDateOnly(endOfMonth(month))
  const queryKey = ["merchant-availability", merchant?.businessId, from, to]

  const { data, isPending, isFetching, isPlaceholderData, error, refetch } = useQuery({
    queryKey,
    queryFn: () => getMerchantAvailability(from, to),
    enabled: !!merchant,
    placeholderData: (previousData) => previousData,
  })
  const monthDates = isPlaceholderData ? [] : data?.dates ?? []
  const selected = monthDates.find((day) => day.date === selectedDate)
  const defaultCapacity = data?.defaultDailyCapacity ?? null
  const blocked = monthDates.filter((day) => day.overrideCapacity === 0)
  const atCapacity = monthDates.filter((day) =>
    day.overrideCapacity !== 0 &&
    day.effectiveCapacity !== null &&
    day.usedCapacity >= day.effectiveCapacity
  )
  const custom = monthDates.filter((day) =>
    day.overrideCapacity !== null && day.overrideCapacity > 0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Availability</h1>
        <p className="text-sm text-muted-foreground">Set how many events you can accept each day.</p>
      </div>

      {isPending ? (
        <p className="text-sm text-muted-foreground">Loading availability…</p>
      ) : error || !data ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>Could not load availability.</p>
          <Button type="button" variant="outline" onClick={() => void refetch()}>Try again</Button>
        </div>
      ) : (
        <>
          <DefaultCapacitySetting
            key={merchant?.businessId}
            current={defaultCapacity}
            dates={monthDates}
            onSaved={async () => {
              await queryClient.invalidateQueries({ queryKey: ["merchant-availability", merchant?.businessId] })
            }}
          />

          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select a date to view its events and capacity.
              </p>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center overflow-x-auto">
                <Calendar
                  mode="single"
                  month={month}
                  onMonthChange={(nextMonth) => {
                    setMonth(startOfMonth(nextMonth))
                    setSelectedDate(null)
                  }}
                  selected={selectedDate ? fromDateOnly(selectedDate) : undefined}
                  onSelect={(date) => {
                    setSelectedDate(date ? toDateOnly(date) : null)
                    if (date && toDateOnly(startOfMonth(date)) !== from) {
                      setMonth(startOfMonth(date))
                    }
                  }}
                  modifiers={{
                    past: { before: fromDateOnly(today) },
                    blocked: blocked.map((day) => fromDateOnly(day.date)),
                    atCapacity: atCapacity.map((day) => fromDateOnly(day.date)),
                    custom: custom.map((day) => fromDateOnly(day.date)),
                  }}
                  modifiersClassNames={{
                    past: "[&_button]:text-muted-foreground",
                    blocked: "[&_button]:bg-rose-50 [&_button]:text-rose-700 dark:[&_button]:bg-rose-950/40",
                    atCapacity: "[&_button]:bg-amber-50 [&_button]:text-amber-800 dark:[&_button]:bg-amber-950/40",
                    custom: "[&_button]:ring-1 [&_button]:ring-ring/50",
                  }}
                  className="[--cell-size:--spacing(10)]"
                />
              </div>
              {isFetching && (
                <p role="status" className="mt-2 text-center text-xs text-muted-foreground">
                  Updating calendar…
                </p>
              )}
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                <span><span aria-hidden="true" className="mr-1 text-rose-600">●</span> Unavailable</span>
                <span><span aria-hidden="true" className="mr-1 text-amber-600">●</span> At capacity</span>
                <span><span aria-hidden="true" className="mr-1">◯</span> Custom limit</span>
              </div>
            </CardContent>
          </Card>

          {selected ? (
            <SelectedDateDetails
              key={selected.date}
              day={selected}
              defaultCapacity={defaultCapacity}
              editable={selected.date >= today}
              businessId={merchant!.businessId}
              onSaved={async () => {
                await queryClient.invalidateQueries({ queryKey: ["merchant-availability", merchant?.businessId] })
              }}
            />
          ) : selectedDate && (isFetching || isPlaceholderData) ? (
            <p role="status" className="text-sm text-muted-foreground">
              Loading capacity for {format(fromDateOnly(selectedDate), "MMMM d, yyyy")}…
            </p>
          ) : null}
        </>
      )}
    </div>
  )
}

function DefaultCapacitySetting({
  current, dates, onSaved,
}: {
  current: number | null
  dates: MerchantAvailabilityDate[]
  onSaved: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Card className="gap-0 py-0">
        <DialogTrigger asChild>
          <button type="button" className="flex w-full items-center justify-between gap-4 rounded-xl p-4 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Default daily capacity</span>
              <span className="block text-sm text-muted-foreground">Normal capacity for each day</span>
            </span>
            <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
              {current === null ? "Unlimited" : `${current}/day`}
              <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground" />
            </span>
          </button>
        </DialogTrigger>
      </Card>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-sm">
        {open && (
          <DefaultCapacityEditor
            current={current}
            dates={dates}
            onSaved={onSaved}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function DefaultCapacityEditor({
  current, dates, onSaved, onClose,
}: {
  current: number | null
  dates: MerchantAvailabilityDate[]
  onSaved: () => Promise<void>
  onClose: () => void
}) {
  const [mode, setMode] = useState<"unlimited" | "limited">(current === null ? "unlimited" : "limited")
  const [draft, setDraft] = useState(current === null ? "1" : String(current))
  const mutation = useMutation({
    mutationFn: saveDefaultDailyCapacity,
    onSuccess: async () => {
      await onSaved()
      onClose()
      toast.success("Default daily capacity saved")
    },
  })
  const parsed = parseNonNegativeInteger(draft)
  const next = mode === "unlimited" ? null : parsed
  const isValid = mode === "unlimited" || parsed !== null
  const today = todayInManila()
  const affectedDate = next === null ? undefined : dates.find((day) =>
    day.date >= today &&
    day.overrideCapacity === null &&
    day.usedCapacity > next
  )

  return (
    <>
      <DialogHeader>
        <DialogTitle>Default daily capacity</DialogTitle>
        <DialogDescription>
          How many events can you accommodate on a normal day?
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <RadioGroup value={mode} onValueChange={(value) => setMode(value as typeof mode)}>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <RadioGroupItem value="unlimited" /> Unlimited
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <RadioGroupItem value="limited" /> Limit events per day
          </label>
        </RadioGroup>
        {mode === "limited" && (
          <div className="space-y-1">
            <label htmlFor="default-capacity" className="text-sm font-medium">Events per day</label>
            <Input id="default-capacity" type="number" min="0" step="1" inputMode="numeric"
              value={draft} onChange={(event) => setDraft(event.target.value)} />
          </div>
        )}
        {affectedDate && (
          <p role="status" className="text-sm text-amber-800 dark:text-amber-300">
            {affectedDate.usedCapacity} events are already accepted or booked on
            {" "}{format(fromDateOnly(affectedDate.date), "MMMM d")}. Those bookings remain;
            no additional events can be accepted at the new limit.
          </p>
        )}
        {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="button" disabled={mutation.isPending || !isValid || next === current}
          onClick={() => mutation.mutate(next)}>
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </>
  )
}

function SelectedDateDetails({
  day, defaultCapacity, editable, businessId, onSaved,
}: {
  day: MerchantAvailabilityDate
  defaultCapacity: number | null
  editable: boolean
  businessId: string
  onSaved: () => Promise<void>
}) {
  const { data: events, isPending, error, refetch } = useQuery({
    queryKey: ["merchant-date-events", businessId, day.date],
    queryFn: () => getMerchantDateEvents(day.date),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>{format(fromDateOnly(day.date), "MMMM d, yyyy")}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {day.effectiveCapacity === null
            ? `${day.usedCapacity} accepted or booked events · no daily limit`
            : `${day.usedCapacity} of ${day.effectiveCapacity} event slots used`}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPending ? (
          <p role="status" className="text-sm text-muted-foreground">Loading events…</p>
        ) : error ? (
          <div role="alert" className="space-y-2 text-sm">
            <p>Could not load events for this date.</p>
            <Button type="button" variant="outline" onClick={() => void refetch()}>Try again</Button>
          </div>
        ) : events?.length === 0 ? (
          <p className="text-sm text-muted-foreground">No events on this date.</p>
        ) : (
          <div className="space-y-2">
            {events?.map((event) => (
              <Link
                key={event.quotationReference}
                to={`/quotations/${encodeURIComponent(event.quotationReference)}`}
                className="block rounded-lg border p-3 transition-colors hover:bg-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`${event.status} event for ${event.customerName}, quotation ${event.quotationReference}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <Badge variant="secondary" className="mb-2 capitalize">{event.status}</Badge>
                    <p className="font-medium">{event.customerName}</p>
                    <p className="line-clamp-2 text-sm text-muted-foreground">
                      {event.packageNames.join(", ")}
                    </p>
                  </div>
                  <ChevronRight aria-hidden="true" className="mt-1 size-4 shrink-0 text-muted-foreground" />
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-sm">
                  <span className="text-muted-foreground">#{event.quotationReference}</span>
                  <span className="font-semibold">₱{event.grandTotal.toLocaleString("en-PH")}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
        {editable && (
          <DateCapacitySetting day={day} defaultCapacity={defaultCapacity} onSaved={onSaved} />
        )}
      </CardContent>
    </Card>
  )
}

function DateCapacitySetting({
  day, defaultCapacity, onSaved,
}: {
  day: MerchantAvailabilityDate
  defaultCapacity: number | null
  onSaved: () => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const summary = day.overrideCapacity === null
    ? `Default · ${defaultCapacity === null ? "Unlimited" : `${defaultCapacity}/day`}`
    : day.overrideCapacity === 0 ? "Unavailable" : `${day.overrideCapacity}/day`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button type="button" className="flex min-h-12 w-full items-center justify-between gap-3 rounded-lg border px-3 text-left text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <span className="font-medium">Capacity</span>
          <span className="flex items-center gap-1 text-muted-foreground">
            {summary}<ChevronRight aria-hidden="true" className="size-4" />
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-sm">
        {open && (
          <DateCapacityEditor
            day={day}
            defaultCapacity={defaultCapacity}
            onSaved={onSaved}
            onClose={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function DateCapacityEditor({
  day, defaultCapacity, onSaved, onClose,
}: {
  day: MerchantAvailabilityDate
  defaultCapacity: number | null
  onSaved: () => Promise<void>
  onClose: () => void
}) {
  const initialMode: DateMode = day.overrideCapacity === null
    ? "default" : day.overrideCapacity === 0 ? "unavailable" : "custom"
  const [mode, setMode] = useState<DateMode>(initialMode)
  const [draft, setDraft] = useState(day.overrideCapacity && day.overrideCapacity > 0
    ? String(day.overrideCapacity) : "1")
  const mutation = useMutation({
    mutationFn: (capacity: number | null) => saveDateCapacity(day.date, capacity),
    onSuccess: async () => {
      await onSaved()
      onClose()
      toast.success("Date capacity saved")
    },
  })
  const parsed = parseNonNegativeInteger(draft)
  const next = mode === "default" ? null : mode === "unavailable" ? 0 : parsed
  const isValid = mode !== "custom" || (parsed !== null && parsed > 0)
  const proposedCapacity = next === null ? defaultCapacity : next
  const belowUsage = proposedCapacity !== null && proposedCapacity < day.usedCapacity

  return (
    <>
      <DialogHeader>
        <DialogTitle>Capacity for {format(fromDateOnly(day.date), "MMMM d")}</DialogTitle>
        <DialogDescription>Choose this date&apos;s capacity.</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <RadioGroup value={mode} onValueChange={(value) => setMode(value as DateMode)}>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <RadioGroupItem value="default" />
            Use default ({capacityLabel(defaultCapacity)})
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <RadioGroupItem value="custom" /> Custom capacity
          </label>
          <label className="flex min-h-11 items-center gap-3 text-sm">
            <RadioGroupItem value="unavailable" /> Unavailable
          </label>
        </RadioGroup>
        {mode === "custom" && (
          <div className="space-y-1">
            <label htmlFor="date-capacity" className="text-sm font-medium">Events on this date</label>
            <Input id="date-capacity" type="number" min="1" step="1" inputMode="numeric"
              value={draft} onChange={(event) => setDraft(event.target.value)} />
          </div>
        )}
        {belowUsage && (
          <p role="status" className="text-sm text-amber-800 dark:text-amber-300">
            {day.usedCapacity} events are already accepted or booked on this date.
            No additional events can be accepted.
          </p>
        )}
        {mutation.error && <p role="alert" className="text-sm text-destructive">{mutation.error.message}</p>}
      </div>
      <DialogFooter>
        <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
        <Button type="button"
          disabled={mutation.isPending || !isValid || next === day.overrideCapacity}
          onClick={() => mutation.mutate(next)}>
          {mutation.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </>
  )
}
