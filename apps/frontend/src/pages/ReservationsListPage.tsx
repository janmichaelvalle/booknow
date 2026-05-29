import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { type Reservation } from "@/lib/types"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import useAuth from "@/context/useAuth"
import { useNavigate, useParams, Link } from "react-router-dom"
import { CircleCheck, CircleX } from "lucide-react"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"
import { useState } from "react"
import { format } from "date-fns"






export function ReservationsListPage() {

  const navigate = useNavigate();
  const { businessSlug } = useParams()
  const queryClient = useQueryClient()
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [nextStatus, setNextStatus] = useState<string | null>(null)
  const [selectedReservationId, setSelectedReservationId] = useState<string | null>(null)



  async function fetchReservations(): Promise<Reservation[]> {
    const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservations`)
    const data = await res.json()
    return data.data
  }

  const { data: reservations, isPending } = useQuery({
    queryKey: ['reservations', businessSlug],
    queryFn: fetchReservations,
    initialData: []
  });

  if (isPending) return 'Loading...'

  const { logout } = useAuth()

  // Handler functions are used when we want to do multiple things for one user event.
  async function handleLogout() {
    console.log("Pressed logout")
    await logout()
    navigate("/login")

  }

  if (!businessSlug) {
    return <p>Missing business slug.</p>
  }

  async function handleStatusUpdate(reservationStatus: string, reservationId: string) {
    if (!businessSlug || !reservationId) return


    const res = await fetch(
      `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservation/${reservationId}/status`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationStatus,
          rejectionReason: reservationStatus === "booking_rejected" ? "Rejected by admin" : null,
        }),
      }
    )

    if (!res.ok) {
      throw new Error("Failed to update reservation status")
    }

    console.log("Reservation status updated")
  }

  

  return (
    <>
      <h1>All Reservations</h1>
      <div className="space-y-4">
        {reservations.map((reservation) => {

        const formattedDate = format(new Date(reservation.eventDate), "EEEE, MMMM d, yyyy")
        const formattedStartTime = format(new Date(`2000-01-01T${reservation.startTime}`), "h:mm a")
        const formattedEndTime = format(new Date(`2000-01-01T${reservation.endTime}`), "h:mm a")

          return (
          <Card>
            <CardHeader>
              <Link
                key={reservation.id}
                to={`/${businessSlug}/reservation/${reservation.id}`}
                className="block"
              >
                <CardTitle className="text-base">
                  Reservation #{reservation.id}
                </CardTitle>
              </Link>
            </CardHeader>

            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{reservation.reservationStatus}</span>
              </div>
              

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Event Date</span>
                <span>{ formattedDate }</span>
              </div>

               <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Venue</span>
                <span>{reservation.venue}</span>
              </div>

               <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Event Time</span>
                <span>{formattedStartTime } to {formattedEndTime}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Number of guests</span>
                <span>{reservation.guestCount}</span>
              </div>

              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Package</span>
                <span>{reservation.selectedPackageName}</span>
              </div>

      
               <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Grand Total</span>
                <span>₱ {reservation.grandTotal.toLocaleString()}</span>
              </div>

              
               <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Customer Name</span>
                <span> {reservation.customerName}</span>
              </div>





              {(reservation.reservationStatus === "pending_acceptance" ||
                reservation.reservationStatus === "pending_verification") && (
                  <div className="space-y-3 pt-3">
                    <Button
                      type="button"
                      className="h-11 w-full gap-3 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => {
                        setNextStatus(
                          reservation.reservationStatus === "pending_verification"
                            ? "confirmed"
                            : "pending_payment"
                        )

                        setIsConfirmOpen(true)
                        setSelectedReservationId(reservation.id)
                      }}
                    >
                      <CircleCheck className="size-4" />
                      {reservation.reservationStatus === "pending_verification"
                        ? "Approve Payment"
                        : "Approve Reservation"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="h-11 w-full gap-3"
                      onClick={() => {
                        setSelectedReservationId(reservation.id)
                        setNextStatus(
                          reservation.reservationStatus === "pending_verification"
                            ? "payment_rejected"
                            : "booking_rejected"
                        )

                        setIsConfirmOpen(true)
                      }}
                    >
                      <CircleX className="size-4" />
                      {reservation.reservationStatus === "pending_verification"
                        ? "Reject Payment"
                        : "Reject Reservation"}
                    </Button>


                  </div>
                )}

            </CardContent>

          </Card>
          )
        })}
      </div>

      <Button type="button" onClick={
        handleLogout
      }>Logout</Button>
      <ConfirmDialog
        open={isConfirmOpen}
        onOpenChange={setIsConfirmOpen}
        onConfirm={async () => {
          if (!nextStatus || !selectedReservationId) return

          await toast.promise(
            async () => {
              await handleStatusUpdate(nextStatus, selectedReservationId)

              await queryClient.invalidateQueries({
                queryKey: ["reservations", businessSlug],
              })
            },
            {
              loading: "Updating reservation...",
              success: "Reservation status updated successfully.",
              error: "Failed to update reservation.",
              position: "top-center"
            },

          )

          setIsConfirmOpen(false)
          setNextStatus(null)
          setSelectedReservationId(null)
        }}
      />

    </>
  )

}



