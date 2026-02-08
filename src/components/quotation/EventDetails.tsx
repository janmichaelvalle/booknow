import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { Button } from "../ui/button"
import { Calendar } from "../ui/calendar"
import { Field,  FieldLabel, FieldDescription} from "../ui/field"
import { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import { Input } from "@/components/ui/input"
import * as React from "react"


type EventDetailsProps = {
  eventDate?: Date
  guestCount: number
  onEventDateChange: (date: Date | undefined) => void
  onGuestCountChange: (count: number) => void
}




export function EventDetails( {eventDate, guestCount, onEventDateChange, onGuestCountChange} : EventDetailsProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(undefined)
    return (
    
    <Card>
  <CardHeader>
    <CardTitle>Event Details</CardTitle>
    <CardDescription>Tell us about your event</CardDescription>
    {/* <CardAction>Card Action</CardAction> */}
  </CardHeader>
  <CardContent>
     <Field>
      <FieldLabel htmlFor="date"> Event Date</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className="justify-start font-normal"
          >
            {date ? date.toLocaleDateString() : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            defaultMonth={date}
            captionLayout="dropdown"
            onSelect={(date) => {
              setDate(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
       <Field>
          <FieldLabel htmlFor="username">Number of Guests</FieldLabel>
          <Input id="username" type="text" placeholder="Input number of guests" />
        </Field>

    
  </CardContent>
  <CardFooter>
    <p>Card Footer</p>
  </CardFooter>
</Card>
    )
    
}