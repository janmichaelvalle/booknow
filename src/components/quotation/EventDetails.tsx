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
    return (
    
    <Card>
  <CardHeader>
    <CardTitle>Event Details</CardTitle>
    <CardDescription>Tell us about your event</CardDescription>

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
            {eventDate ? eventDate.toLocaleDateString() : "Select date"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={eventDate}
            defaultMonth={eventDate}
            captionLayout="dropdown"
            onSelect={(date) => {
              // console.log("Selected date in EventDetails:", date)
              onEventDateChange(date)
              setOpen(false)
            }}
          />
        </PopoverContent>
      </Popover>
    </Field>
       <Field>
          <FieldLabel htmlFor="username">Number of Guests</FieldLabel>
          <Input 
          id="username" 
          type="number" 
          placeholder="Input number of guests" 
          value={guestCount}
          onChange={(e) => {
            // console.log("Guest count changed:", value)
            const value = Number(e.target.value)

            onGuestCountChange(value)
          }}
           />
        </Field>

    
  </CardContent>

</Card>
    )
    
}