import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"


import { Field, FieldLabel, FieldError } from "../ui/field"


import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { CalendarDays, MapPin, Users,  CalendarClock } from "lucide-react"



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
            <CalendarClock  className="h-4 w-4" />
            Date and Time
          </FieldLabel>

          <p className="text-sm text-muted-foreground">
            Choose your preferred event date and available time slot.
          </p>
        
          <form.Field name="eventDate">
            {(field: any) => (
              <Popover>
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
                  <Calendar
                    mode="single"
                    selected={field.state.value}
                    disabled={[{ before: new Date() }]}
                    onSelect={(newDate) => {
                      if (newDate) {
                        field.handleChange(newDate)
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            )}
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