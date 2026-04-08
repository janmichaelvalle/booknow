import { useParams, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { type Reservation, type PaymentMethod } from "@/lib/types"
import { Link } from "react-router-dom"
import { EventDetailsCard } from "@/components/reservation/EventDetailsCard"
import { PackageDetailsCard } from "@/components/reservation/PackageDetailsCard"
import { PaymentMethodSelector } from "@/components/reservation/PaymentMethodSelector"
import { useQuery } from "@tanstack/react-query"
import { InfoIcon } from "lucide-react"
import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useEffect } from "react"
import useAuth from "@/context/useAuth"
import { ReservationStatusStepper } from "@/components/reservation/ReservationStatusStepper"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"


import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"



export function ReservationPage() {
    const { isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const { reservationId, businessSlug } = useParams()
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState("")
    const canSubmitPayment = !!selectedPaymentMethodId && !!selectedFile
    let statusTitle = ""
    let statusDescription = ""



    const { data: reservation, isPending: isReservationPending, error: reservationError, } = useQuery({
        queryKey: ["reservation", businessSlug, reservationId],
        queryFn: async (): Promise<Reservation> => {
            const res = await fetch(
                `${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/reservation/${reservationId}`
            )

            if (!res.ok) {
                throw new Error("Failed to fetch reservation")
            }

            const data = await res.json()
            return data.data
        },
        enabled: !!businessSlug && !!reservationId,
    })



    const { data: paymentMethods, isPending: isPaymentMethodsPending, error: paymentMethodsError } = useQuery({
        queryKey: ["paymentMethods", businessSlug],
        queryFn: async (): Promise<PaymentMethod[]> => {
            const res = await fetch(`${import.meta.env.VITE_BASE_URL}/api/businesses/${businessSlug}/payment-methods`)
            if (!res.ok) {
                throw new Error("Failed to fetch payment Methods")
            }
            const data = await res.json()
            return data.data ?? []
        },
        enabled: !!businessSlug,
        initialData: [],
    })

    useEffect(() => {
        console.log("reservation in useEffect:", reservation)
        if (reservation?.paymentMethodId) {
            setSelectedPaymentMethodId(reservation.paymentMethodId)
        }
    }, [reservation])


    if (!businessSlug || !reservationId) {
        return <p>Missing route parameters.</p>
    }

    if (!businessSlug || !reservationId) {
        return <p>Missing route parameters.</p>
    }

    if (isReservationPending) {
        return <p>Loading reservation...</p>
    }

    if (reservationError) {
        return <p>Failed to load reservation.</p>
    }

    if (!reservation) {
        return <p>Reservation not found.</p>
    }

    if (isPaymentMethodsPending) {
        return <p>Loading payment methods...</p>
    }

    if (paymentMethodsError) {
        return <p>Failed to load payment methods.</p>
    }


    const packagePrice = (reservation.selectedPackage === "classic" ? reservation.guestCount * 50 : reservation.guestCount * 100)

    if (reservation.reservationStatus === "pending_acceptance") {
        statusTitle = "Reservation pending acceptance"
        statusDescription =
            "Your reservation has been submitted and is waiting for the business to review it."
    }

    if (reservation.reservationStatus === "booking_rejected") {
        statusTitle = "Reservation rejected"
        statusDescription =
            "Your reservation request was not accepted by the business."
    }

    if (reservation.reservationStatus === "pending_payment") {
        statusTitle = "Payment required"
        statusDescription =
            "Your reservation was accepted. Please complete your payment to continue with the booking."
    }

    if (reservation.reservationStatus === "pending_verification") {
        statusTitle = "Payment pending verification"
        statusDescription =
            "We've received your payment proof. Your reservation will be confirmed once the payment is verified. No further action is needed at this time."
    }

    if (reservation.reservationStatus === "payment_rejected") {
        statusTitle = "Payment rejected"
        statusDescription =
            "Your payment proof was rejected. Please review the payment instructions and submit a new proof of payment."
    }

    if (reservation.reservationStatus === "confirmed") {
        statusTitle = "Reservation confirmed"
        statusDescription =
            "Your reservation has been confirmed. No further action is needed at this time."
    }

    async function handleSubmitPayment(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()

        if (!reservation || !selectedPaymentMethodId || !selectedFile) {
            return
        }

        const fileExt = selectedFile.name.split(".").pop()
        const filePath = `${reservation.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
            .from("payment-proofs")
            .upload(filePath, selectedFile, {
                cacheControl: "3600",
                upsert: false,
            })

        if (uploadError) {
            console.error("Upload failed:", uploadError.message)
            return
        }

        const { error: updateError } = await supabase
            .from("reservations")
            .update({
                payment_method_id: selectedPaymentMethodId,
                payment_proof_path: filePath,
                status: "pending_verification",
            })
            .eq("id", reservation.id)

        if (updateError) {
            console.error("Reservation update failed:", updateError.message)
            return
        }

        console.log("Payment submitted successfully")
    }

    const uploadedProofUrl = reservation.paymentProofPath
        ? supabase.storage
            .from("payment-proofs")
            .getPublicUrl(reservation.paymentProofPath).data.publicUrl
        : null


    const isPaymentLocked =
        reservation.reservationStatus === "pending_verification" ||
        reservation.reservationStatus === "confirmed"


    async function handleStatusUpdate(reservationStatus: string) {
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
            console.error("Failed to update reservation status")
            return
        }

        console.log("Reservation status updated")
    }
    

    return (
        <>
            <Link to={`/${businessSlug}/reservations`}>Back</Link>
            <h1>This is the reservation page</h1>
            <Alert>
                <InfoIcon />
                <AlertTitle>{statusTitle}</AlertTitle>
                <AlertDescription>
                    {statusDescription}
                </AlertDescription>
            </Alert>
            <div className="mt-6 mb-6">
                <ReservationStatusStepper
                reservationStatus = {reservation.reservationStatus} />
            </div>
            

            <EventDetailsCard
                reservation={reservation}
            />
            <PackageDetailsCard
                packagePrice={packagePrice}
                selectedPackage={reservation.selectedPackage} />
            <form onSubmit={handleSubmitPayment}>

                <PaymentMethodSelector
                    paymentMethods={paymentMethods}
                    packagePrice={packagePrice}
                    selectedPaymentMethodId={selectedPaymentMethodId}
                    setSelectedPaymentMethodId={setSelectedPaymentMethodId}
                    selectedFile={selectedFile}
                    setSelectedFile={setSelectedFile}
                    uploadedProofUrl={uploadedProofUrl}
                    disabled={isPaymentLocked}

                />
                <Button type="submit" disabled={!canSubmitPayment || isPaymentLocked}>
                    Submit Payment & Reserve Date
                </Button>
            </form>
            <Button disabled={isPaymentLocked} type="button" onClick={() =>
                navigate(`/${businessSlug}/reservation/${reservationId}/edit`, {
                    state: {
                        eventDate: reservation.eventDate,
                        guestCount: reservation.guestCount,
                        selectedPackage: reservation.selectedPackage,
                    }
                })}>
                Edit quotation
            </Button>
            {isAuthenticated && reservation.reservationStatus === "pending_verification" && (
                <>
                    <Button onClick={() => handleStatusUpdate("confirmed")}>
                        Accept Payment
                    </Button>

                    <Button onClick={() => handleStatusUpdate("payment_rejected")}>
                        Decline Payment
                    </Button>
                </>
            )}

            {isAuthenticated && reservation.reservationStatus === "pending_acceptance" && (
                <>
                    {/* <Button onClick={() => handleStatusUpdate("pending_payment")}> */}
                    <Button onClick={() => ConfirmDialog}>
                        Accept Booking
                    </Button>

                    <Button onClick={() => handleStatusUpdate("booking_rejected")}>
                        Decline Booking
                    </Button>
                </>
            )}





        </>
    )

}
