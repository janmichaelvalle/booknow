import {
  InteractiveStepper,
  InteractiveStepperIndicator,
  InteractiveStepperItem,
  InteractiveStepperSeparator,
  InteractiveStepperTitle,
  InteractiveStepperTrigger,
} from "@/components/ui/interactive-stepper"

type ReservationStatusStepperProps = {
  reservationStatus: string
}



const currentStepByStatus: Record<string, number> = {
  pending_acceptance: 1,
  booking_rejected: 1,
  pending_payment: 2,
  pending_verification: 3,
  payment_rejected: 3,
  confirmed: 4,
}



export function ReservationStatusStepper( {reservationStatus} : ReservationStatusStepperProps) {
    const currentStep = currentStepByStatus[reservationStatus] ?? 1
    const isBookingRejected = reservationStatus === "booking_rejected"
    const isPaymentRejected = reservationStatus === "payment_rejected"
   
  return (
   
    <InteractiveStepper defaultValue={currentStep} className="w-full px-4 py-4">
      <InteractiveStepperItem rejected={isBookingRejected} key="booking-review">
        <InteractiveStepperTrigger className="min-w-[4.5rem]">
          <InteractiveStepperIndicator />
          <div>
            <InteractiveStepperTitle className="ml-0 text-xs leading-tight sm:text-sm">
              Booking Review
            </InteractiveStepperTitle>
          </div>
        </InteractiveStepperTrigger>
        <InteractiveStepperSeparator className="mx-3" />
      </InteractiveStepperItem>

      <InteractiveStepperItem key="waiting-payment">
        <InteractiveStepperTrigger className="min-w-[4.5rem]">
          <InteractiveStepperIndicator />
          <div>
            <InteractiveStepperTitle className="ml-0 text-xs leading-tight sm:text-sm">
              Awaiting Payment
            </InteractiveStepperTitle>
          </div>
        </InteractiveStepperTrigger>
        <InteractiveStepperSeparator className="mx-3" />
      </InteractiveStepperItem>

      <InteractiveStepperItem key="payment-review" rejected={isPaymentRejected}>
        <InteractiveStepperTrigger className="min-w-[4.5rem]">
          <InteractiveStepperIndicator />
          <div>
            <InteractiveStepperTitle className="ml-0 text-xs leading-tight sm:text-sm">
              Payment Review
            </InteractiveStepperTitle>
          </div>
        </InteractiveStepperTrigger>
        <InteractiveStepperSeparator className="mx-3" />
      </InteractiveStepperItem>

      <InteractiveStepperItem key="completed">
        <InteractiveStepperTrigger className="min-w-[4.5rem]">
          <InteractiveStepperIndicator />
          <div>
            <InteractiveStepperTitle className="ml-0 text-xs leading-tight sm:text-sm">
              Completed
            </InteractiveStepperTitle>
          </div>
        </InteractiveStepperTrigger>
      </InteractiveStepperItem>

      


    </InteractiveStepper>
  )
}
