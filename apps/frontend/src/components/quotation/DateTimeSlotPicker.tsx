import { useState } from "react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

export function DateTimeSlotPicker() {
    const today = new Date()
    const [date, setDate] = useState<Date>(today)
    const [time, setTime] = useState<string | null>(null)

    // Mock time slots data
  const timeSlots = [
  { available: false, time: "11:00 AM" },
  { available: false, time: "11:30 AM" },
  { available: false, time: "12:00 PM" },
  { available: true, time: "12:30 PM" },
  { available: true, time: "1:00 PM" },
  { available: true, time: "1:30 PM" },
  { available: true, time: "2:00 PM" },
  { available: true, time: "2:30 PM" },
  { available: true, time: "3:00 PM" },
  { available: true, time: "3:30 PM" },
  { available: true, time: "4:00 PM" },
  { available: true, time: "4:30 PM" },
  { available: true, time: "5:00 PM" },
  { available: true, time: "5:30 PM" },
  { available: true, time: "6:00 PM" },
  { available: true, time: "6:30 PM" },
  { available: true, time: "7:00 PM" },
  { available: true, time: "7:30 PM" },
  { available: false, time: "8:00 PM" },
  { available: false, time: "8:30 PM" },
  { available: true, time: "9:00 PM" },
  { available: true, time: "9:30 PM" },
]



    return (
        <Card className="w-full p-0">
            <CardContent className="p-0">
                <div className="flex flex-col">
                    <div className="flex justify-center">
                        <Calendar
                            disabled={[{ before: today }]}
                            mode="single"
                            onSelect={(newDate) => {
                                if (newDate) {
                                    setDate(newDate)
                                    setTime(null)
                                }
                            }}
                            selected={date}
                            className="w-full"
                        />
                    </div>
                    <div className="border-t">
               
                            <div className="py-4">
                                <div className="space-y-3">
                                    <div className="flex h-5 shrink-0 items-center px-4">
                                        <p className="text-sm font-medium">
                                            {format(date, "EEEE, d")}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-1.5 px-4">
                                        {timeSlots.map(({ time: timeSlot, available }) => (
                                            <Button
                                                className="w-full"
                                                disabled={!available}
                                                key={timeSlot}
                                                onClick={() => setTime(timeSlot)}
                                                size="sm"
                                                variant={time === timeSlot ? "default" : "outline"}
                                            >
                                                {timeSlot}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                    
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
