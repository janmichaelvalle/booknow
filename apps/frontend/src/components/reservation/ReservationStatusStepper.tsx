import {
  Stepper,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperTrigger,
} from "../reui/stepper"


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

const steps = [
  { step: 1, label: "Booking Review" },
  { step: 2, label: "Payment Due" },
  { step: 3, label: "Payment Review" },
  { step: 4, label: "Confirmed" },
]




export function ReservationStatusStepper({ reservationStatus }: ReservationStatusStepperProps) {
  const currentStep = currentStepByStatus[reservationStatus] ?? 1

  return (
    <Stepper value={currentStep} className="w-full">


      <StepperNav className="justify-center gap-6">

        {steps.map((item) => (
          <StepperItem key={item.step} step={item.step} className="not-last:flex-none">

            <div className="flex flex-col items-center gap-2">

              <StepperTrigger asChild>
                <StepperIndicator className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=completed]:bg-green-500 data-[state=completed]:text-white data-[state=inactive]:text-gray-500">
                  {item.step}
                </StepperIndicator>
              </StepperTrigger>
              <span className=" text-center text-sm leading-tight">
                {item.label}
              </span>

            </div>
          </StepperItem>
        ))}
      </StepperNav>
    </Stepper>
  )
}

