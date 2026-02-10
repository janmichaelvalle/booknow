import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Field, FieldLabel, FieldDescription, FieldError } from "../ui/field"
import { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Input } from "@/components/ui/input"
import * as React from "react"
import { Controller } from "react-hook-form"
import type { Control } from "react-hook-form"


type FormValues = {
  eventDate: Date
  guestCount: undefined
  selectedPackage: "classic" | "vintage"
}

type EventDetailsProps = {
  control: Control<FormValues>
}


export function EventDetails({ control }: EventDetailsProps) {
  const [open, setOpen] = React.useState(false)

  return (

    <Card>
      <CardHeader>
        <CardTitle>Event Details</CardTitle>
        <CardDescription>Tell us about your event</CardDescription>

      </CardHeader>
      <CardContent>
        <Controller
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

        />
        <Controller
          name="guestCount"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="guestCount">Number of Guests</FieldLabel>
              <Input
                id="guestCount"
                type="number"
                min={1}
                placeholder="Input number of guests"
                value={field.value}
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

      </CardContent>

    </Card>
  )

}