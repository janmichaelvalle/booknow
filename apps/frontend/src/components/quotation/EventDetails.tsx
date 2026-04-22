import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


import { Field, FieldLabel, FieldError } from "../ui/field"


import { Input } from "@/components/ui/input"
import { DateTimeSlotPicker } from "./DateTimeSlotPicker"
import { CalendarDays, MapPin, Users } from "lucide-react"



type EventDetailsProps = {
  form: any
}


export function EventDetails({ form }: EventDetailsProps) {

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
          <DateTimeSlotPicker form={form} />
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

              <Input
                id={field.name}
                placeholder="Enter venue"
                // Actual value of the field
                value={field.state.value ?? ""}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />

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
                  console.log("raw:", raw)
                  console.log("num:", num)
                  console.log("guestCount onChange fired", e.target.value)
                  console.log("field value before change", field.state.value)
                  field.handleChange(num !== undefined && num < 1 ? 1 : num)
                }}
              />

              {field.state.meta.isTouched && field.state.meta.errors.length > 0 && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        />

      </CardContent>

    </Card>
  )

}