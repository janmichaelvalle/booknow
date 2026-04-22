import { useState } from "react"
import { format } from "date-fns"

import { FieldLabel } from "@/components/ui/field"

import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

type DateTimeSlotPickerProps = {
    form: any
}

export function DateTimeSlotPicker({ form }: DateTimeSlotPickerProps) {
    const today = new Date()
    const [time, setTime] = useState<string | null>(null)



    return (
        <Card className="w-full p-0">
            <CardContent className="p-0">
                <div className="flex flex-col">
                    <div className="flex justify-center">
                        <form.Field name="eventDate">
                            {(field: any) => (
                                <Calendar
                                    disabled={[{ before: today }]}
                                    mode="single"
                                    onSelect={(newDate) => {
                                        if (newDate) {
                                            field.handleChange(newDate)
                                            setTime(null)
                                        }
                                    }}
                                    selected={field.state.value}
                                    className="w-full"
                                />
                            )}
                        </form.Field>
                    </div>
                    <div className="border-t">

                        <div className="py-4">
                            <div className="space-y-3">
                                <div className="flex h-5 shrink-0 items-center px-4">
                                    <form.Subscribe selector={(state) => state.values.eventDate}>
                                        {(eventDate) => {
                                            return (
                                                <p className="text-sm font-medium">
                                                    {eventDate ? format(eventDate, "EEEE, d") : "Select a date"}
                                                </p>
                                            )
                                        }}
                                    </form.Subscribe>
                                </div>
                                <div className="grid grid-cols-2 gap-3 px-4">
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
                                                            <Input
                                                                type="time"
                                                                value={endField.state.value}
                                                                disabled
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </form.Field>
                                        )}
                                    </form.Field>
                                </div>

                            </div>
                        </div>

                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
