import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from "../ui/field"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const items = [
  { label: "Wedding", value: "wedding" },
  { label: "Debut", value: "debut" },
  { label: "Baptism", value: "baptism" },
  { label: "Kiddie Party", value: "kiddie-party" },
  { label: "Corporate Event", value: "corporate-event" },
  { label: "Birthday", value: "birthday" },
  { label: "Graduation", value: "graduation" },
  { label: "Other", value: "other" },
]

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Calendar, CalendarDayButton } from "@/components/ui/calendar"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarDays, MapPin, Users, CalendarClock } from "lucide-react"
import { addMonths, endOfMonth, format, startOfMonth, subMonths } from "date-fns"
import { useQuery } from "@tanstack/react-query"
import { createContext, useContext, useState } from "react"
import { fromDateOnly, toDateOnly, todayInManila } from "@/lib/date-only"
import { labelDayButton } from "react-day-picker"

import {
  VenueAutocomplete,
} from "./VenueAutoComplete"
import type { CoverageResult } from "@/lib/types"

type EventDetailsProps = {
  form: any
  businessSlug: string
  originalEventDate?: string
  venueCoverage: CoverageResult | null
  onVenueCoverageChange: (coverage: CoverageResult) => void
}

type UnavailableDatePopoverState = {
  openDate: string | null
  setOpenDate: (date: string | null) => void
}

const UnavailableDatePopoverContext = createContext<UnavailableDatePopoverState | null>(null)

function CalendarDayWithUnavailablePopover(
  props: React.ComponentProps<typeof CalendarDayButton>
) {
  const popover = useContext(UnavailableDatePopoverContext)

  if (!props.modifiers.unavailable || !popover) {
    return <CalendarDayButton {...props} />
  }

  const day = toDateOnly(props.day.date)

  return (
    <Popover
      open={popover.openDate === day}
      onOpenChange={(open) => {
        if (!open && popover.openDate === day) popover.setOpenDate(null)
      }}
    >
      <PopoverAnchor asChild>
        <div className="size-full">
          <CalendarDayButton {...props} aria-disabled="true" />
        </div>
      </PopoverAnchor>
      <PopoverContent
        side="bottom"
        sideOffset={6}
        className="w-48 p-3 text-sm"
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <p className="font-medium">Date unavailable</p>
        <p className="text-muted-foreground">Please choose another date.</p>
      </PopoverContent>
    </Popover>
  )
}


export function EventDetails({ form, businessSlug, originalEventDate, venueCoverage,
  onVenueCoverageChange, }: EventDetailsProps) {
  const [calendarMonth, setCalendarMonth] = useState(
    fromDateOnly(originalEventDate ?? todayInManila())
  )
  const [explainedUnavailableDate, setExplainedUnavailableDate] = useState<string | null>(null)
  const from = toDateOnly(startOfMonth(subMonths(calendarMonth, 1)))
  const to = toDateOnly(endOfMonth(addMonths(calendarMonth, 1)))
  const { data: availability, isPending: availabilityPending, isError: availabilityError } = useQuery({
    queryKey: ["availability", businessSlug, from, to],
    queryFn: async (): Promise<{ unavailableDates: string[] }> => {
      const query = new URLSearchParams({ from, to })
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/availability?${query}`
      )
      if (!response.ok) throw new Error("Failed to fetch availability")
      return (await response.json()).data
    },
    enabled: !!businessSlug,
  })
  const unavailableDates = new Set(availability?.unavailableDates ?? [])



  return (
    <>


      <Card>

        <CardHeader>
          <CardTitle>Event Details</CardTitle>
          <CardDescription>Tell us about your event</CardDescription>


        </CardHeader>
        <CardContent className="space-y-5">

          <Field>
            <FieldLabel className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4" />
              Date and Time
            </FieldLabel>

            <p className="text-sm text-muted-foreground">
              Choose your preferred event date and time.
            </p>

            <form.Field name="eventDate">
              {(field: any) => {
                const shouldShowError =
                  field.state.meta.isTouched || form.state.submissionAttempts > 0

                return (
                  <Field data-invalid={!field.state.meta.isValid && shouldShowError}>
                    <Popover onOpenChange={(open) => {
                      if (!open) setExplainedUnavailableDate(null)
                    }}>
                      <PopoverTrigger asChild>
                        <Button
                          type="button"
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !field.state.value && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {field.state.value ? format(field.state.value, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>

                      <PopoverContent className="w-auto p-0" align="start">
                        <UnavailableDatePopoverContext.Provider
                          value={{
                            openDate: explainedUnavailableDate,
                            setOpenDate: setExplainedUnavailableDate,
                          }}
                        >
                        <Calendar
                          mode="single"
                          month={calendarMonth}
                          onMonthChange={(month) => {
                            setCalendarMonth(month)
                            setExplainedUnavailableDate(null)
                          }}
                          selected={field.state.value}
                          modifiers={{
                            unavailable: (date) => {
                              const day = toDateOnly(date)
                              return day >= todayInManila() &&
                                day !== originalEventDate &&
                                !availabilityPending &&
                                !availabilityError &&
                                unavailableDates.has(day)
                            },
                          }}
                          modifiersClassNames={{
                            unavailable: "[&_button]:border [&_button]:border-rose-200 [&_button]:bg-rose-50 [&_button]:text-rose-700 [&_button:hover]:bg-rose-100 [&_button:hover]:text-rose-800 dark:[&_button]:border-rose-900 dark:[&_button]:bg-rose-950/40 dark:[&_button]:text-rose-300",
                          }}
                          labels={{
                            labelDayButton: (date, modifiers) =>
                              modifiers.unavailable
                                ? `${format(date, "EEEE, MMMM d, yyyy")}, unavailable`
                                : labelDayButton(date, modifiers),
                          }}
                          components={{
                            DayButton: CalendarDayWithUnavailablePopover,
                          }}
                          disabled={(date) => {
                            const day = toDateOnly(date)
                            const unchangedDate = day === originalEventDate
                            return day < todayInManila() ||
                              (!unchangedDate && (
                                availabilityPending || availabilityError
                              ))
                          }}
                          onSelect={(newDate) => {
                            if (newDate) {
                              const day = toDateOnly(newDate)
                              if (day !== originalEventDate && unavailableDates.has(day)) return
                              setExplainedUnavailableDate(null)
                              field.handleChange(newDate)
                            }
                          }}
                          onDayClick={(date, modifiers) => {
                            if (modifiers.unavailable) setExplainedUnavailableDate(toDateOnly(date))
                          }}
                        />
                        </UnavailableDatePopoverContext.Provider>
                        <span className="sr-only" role="status" aria-live="polite" aria-atomic="true">
                          {explainedUnavailableDate && unavailableDates.has(explainedUnavailableDate)
                            ? `${format(fromDateOnly(explainedUnavailableDate), "MMMM d")}, unavailable. Please choose another date.`
                            : ""}
                        </span>
                        {availabilityPending && <p className="px-3 pb-2 text-xs text-muted-foreground">Checking availability...</p>}
                        {availabilityError && <p className="px-3 pb-2 text-xs text-destructive">Availability could not be loaded. Try again.</p>}
                      </PopoverContent>
                    </Popover>

                    {field.state.value && unavailableDates.has(toDateOnly(field.state.value)) && (
                      <FieldDescription>
                        {toDateOnly(field.state.value) === originalEventDate
                          ? "This date is now unavailable for new quotations, but you can keep it on this quotation."
                          : "This date is no longer available. Please choose another date."}
                      </FieldDescription>
                    )}

                    {shouldShowError && field.state.meta.errors.length > 0 && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                )
              }}
            </form.Field>
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-3">
                <form.Field name="startTime">
                  {(startField: any) => (
                    <form.Field name="endTime">
                      {(endField: any) => (
                        <>
                          <div className="space-y-2">
                            <FieldLabel>Start time</FieldLabel>
                            <Input
                              type="time"
                              value={startField.state.value}
                              onChange={(e) => {
                                const startTime = e.target.value
                                startField.handleChange(startTime)

                                const [hours, minutes] = startTime.split(":").map(Number)
                                const endDate = new Date()
                                endDate.setHours(hours + 4, minutes)

                                const endTime = endDate.toTimeString().slice(0, 5)
                                endField.handleChange(endTime)
                              }}
                            />
                          </div>

                          <div className="space-y-2">
                            <FieldLabel>End time</FieldLabel>
                            <Input type="time" value={endField.state.value} disabled />
                          </div>
                        </>
                      )}
                    </form.Field>
                  )}
                </form.Field>
              </div>
            </div>
          </Field>

          <form.Field
            name="venue"
            // Tanstack has a field object to help you control input
            children={(field: any) => (
              <Field data-invalid={!field.state.meta.isValid && field.state.meta.isTouched}>
                <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Venue
                </FieldLabel>
                <VenueAutocomplete
                  venue={field.state.value ?? ""}
                  onVenueSelect={(selection) => {
                    onVenueCoverageChange(selection.coverage)
                    if (selection.coverage.isCovered) {
                      field.handleChange(selection.address)
                      form.setFieldValue("venuePlaceId", selection.placeId)
                      form.setFieldValue("venueLocality", selection.locality)
                      form.setFieldValue("venueRegion", selection.region)
                    } else {
                      field.handleChange("")
                      form.setFieldValue("venuePlaceId", "")
                      form.setFieldValue("venueLocality", "")
                      form.setFieldValue("venueRegion", "")
                    }
                  }}
                />
                {venueCoverage?.isCovered === false && (
                  <FieldError>
                    Sorry, this venue is outside the supplier&apos;s Metro Manila coverage area.
                  </FieldError>
                )}

                {venueCoverage?.isCovered &&
                  venueCoverage.transportationFee !== null &&
                  venueCoverage.transportationFee > 0 && (
                    <FieldDescription className="text-amber-600">
                      An additional ₱
                      {venueCoverage.transportationFee.toLocaleString()}
                      {" "}transportation charge applies to this location.
                    </FieldDescription>
                  )}

                {venueCoverage?.isCovered &&
                  venueCoverage.transportationFee === 0 && (
                    <FieldDescription className="text-green-600">
                      This venue is within the service area with no additional transportation charge.
                    </FieldDescription>
                  )}

                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />
          <form.Field
            name="guestCount"
            children={(field: any) => (
              <Field data-invalid={!field.state.meta.isValid && field.state.meta.isTouched}>

                <FieldLabel htmlFor={field.name} className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Number of Guests
                </FieldLabel>

                <Input
                  id={field.name}
                  type="number"
                  min={1}
                  placeholder="Input number of guests"
                  value={field.state.value ?? ""}
                  onBlur={field.handleBlur}
                  onChange={(e) => {
                    const raw = e.target.value
                    const num = raw === "" ? undefined : Number(raw)

                    field.handleChange(num !== undefined && num < 1 ? 1 : num)
                  }}
                />

                {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                  <FieldError errors={field.state.meta.errors} />
                )}
              </Field>
            )}
          />
          <form.Field name="occasion">
            {(field: any) => (
              <Field
                className="w-full"
                data-invalid={
                  !field.state.meta.isValid &&
                  field.state.meta.isTouched
                }
              >
                <FieldLabel htmlFor={field.name}>
                  Occasion
                </FieldLabel>

                <Select
                  value={field.state.value ?? ""}
                  onValueChange={(value) => field.handleChange(value)}
                >

                  <SelectTrigger id={field.name} className="w-full">
                    <SelectValue placeholder="Select an occasion" />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectGroup>
                      {items.map((item) => (
                        <SelectItem
                          key={item.value}
                          value={item.value}
                        >
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                {field.state.value === "other" && (
                  <form.Field name="occasionOther">
                    {(otherField: any) => (
                      <Field>
                        <FieldLabel htmlFor={otherField.name}>
                          Please specify
                        </FieldLabel>

                        <Input
                          id={otherField.name}
                          placeholder="Enter the occasion"
                          value={otherField.state.value ?? ""}
                          onBlur={otherField.handleBlur}
                          onChange={(event) =>
                            otherField.handleChange(event.target.value)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                )}
                {field.state.meta.isTouched &&
                  field.state.meta.errors.length > 0 && (
                    <FieldError errors={field.state.meta.errors} />
                  )}

              </Field>
            )}
          </form.Field>
        </CardContent>

      </Card>
    </>
  )

}
