import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


import { Field, FieldLabel, FieldError } from "../ui/field"


import { Input } from "@/components/ui/input"
import { Controller } from "react-hook-form"
import type { Control } from "react-hook-form"
import { DateTimeSlotPicker } from "./DateTimeSlotPicker"
import { CalendarDays, MapPin, Users } from "lucide-react"



type FormValues = {
  eventDate: Date
  startTime: string
  endTime: string
  venue: string
  guestCount: number
  selectedPackage: "classic" | "vintage"
}


type EventDetailsProps = {
  control: Control<FormValues>
}


export function EventDetails({ control }: EventDetailsProps) {

  return (

    <Card>
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
        <CardDescription>Tell us about your event</CardDescription>

      </CardHeader>
      <CardContent className="space-y-5">

        <Field>
          <FieldLabel className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4" />
            Date and Time
          </FieldLabel>

          <p className="text-sm text-muted-foreground">
            Choose your preferred event date and available time slot.
          </p>
          <DateTimeSlotPicker />
        </Field>

        <Controller
          name="venue"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="venue" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Venue
              </FieldLabel>

              <Input
                id="venue"
                placeholder="Enter venue"
                value={field.value ?? ""}
                onChange={field.onChange}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />


        {/* <Controller
          name="eventDate"
          control={control}
          render={({ field, fieldState }) => (
            <Field>
              <FieldLabel htmlFor="date"> Event Date</FieldLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    id="date"
                    className="justify-start font-normal"
                  >
                    {field.value ? field.value.toLocaleDateString() : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    defaultMonth={field.value}
                    captionLayout="dropdown"
                    onSelect={(date) => {
                      field.onChange(date)
                      setOpen(false) // Close popover after date pick
                    }}
                  />
                </PopoverContent>
              </Popover>
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}

        /> */}
        <Controller
          name="guestCount"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="guestCount" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of Guests
              </FieldLabel>

              <Input
                id="guestCount"
                type="number"
                min={1}
                placeholder="Input number of guests"
                value={field.value ?? ""}
                onChange={(e) => {
                  const raw = e.target.value
                  const num = raw === "" ? undefined : Number(raw)
                  // If user entered 0 or negative, force it to 1.
                  field.onChange(num !== undefined && num < 1 ? 1 : num)
                }}
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        {/* <Controller
          name="startTime"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="startTime">Start Time</FieldLabel>
              <Input
                id="startTime"
                type="time"
                value={field.value ?? ""}
                onChange={field.onChange}
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        /> */}
        {/* 
        <Controller
          name="endTime"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="endTime">End Time</FieldLabel>
              <Input
                id="endTime"
                type="time"
                value={field.value ?? ""}
                onChange={field.onChange}
                className="appearance-none bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
              />
              {fieldState.error && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        /> */}




      </CardContent>

    </Card>
  )

}