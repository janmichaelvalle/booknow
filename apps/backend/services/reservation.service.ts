import { supabase } from "../lib/supabase.js";
import { getBusinessBySlugOrError } from "./business.service.js";
import type { Reservation, ReservationDbRow, ServiceResponse } from "../lib/types.js";



type ReservationFormBody = Pick<
    Reservation,
    "eventDate" | "guestCount" | "selectedPackage"
>

type UpdateReservationStatusBody = Pick<
    Reservation,
    "reservationStatus" | "rejectionReason"
>

export async function getReservationsByBusinessSlug(businessId: string):
    // this async function returns a Promise, and when that Promise finishes, the final value will match ServiceResult
    Promise<ServiceResponse<Reservation[]>> {

   
    const { data: rows, error } = await supabase
        .from('reservations')
        .select('id,event_date,guest_count,selected_package,status')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false })

    if (error) {
        return {
            error: {
                message: "Failed to fetch reservations",
                details: error.message,
                status: 500,
            }
        }
    }
    const reservations: Reservation[] = rows.map((row) => ({
        id: row.id,
        reservationStatus: row.status,
        eventDate: row.event_date,
        guestCount: row.guest_count,
        selectedPackage: row.selected_package,

    }))

    return { data: reservations }
}

export async function getSingleReservationByBusinessSlug(businessId: string, reservationId: string):
    Promise<ServiceResponse<Reservation>> {


    const { data: row, error } = await supabase
        .from('reservations')
        .select('id,event_date,guest_count,selected_package,status,payment_method_id,payment_proof_path,rejection_reason')
        .eq('id', reservationId)
        .eq('business_id', businessId)
        .maybeSingle()

    if (error) {
        return {
            error: {
                message: "Failed to fetch reservation",
                details: error.message,
                status: 500,
            }
        }
    }

    if (!row) {
        return {
            error: {
                message: "Reservation not found",
                status: 404,
            }
        }
    }

    const reservation: Reservation = {
        id: row.id,
        eventDate: row.event_date,
        guestCount: row.guest_count,
        selectedPackage: row.selected_package,
        reservationStatus: row.status,
        paymentMethodId: row.payment_method_id,
        paymentProofPath: row.payment_proof_path,
        rejectionReason: row.rejection_reason,
    }

    return { data: reservation }

}

export async function createReservation(businessId: string, body: ReservationFormBody): Promise<ServiceResponse<Reservation>> {

    const payload = {
        business_id: businessId,
        event_date: String(body.eventDate),
        guest_count: Number(body.guestCount),
        selected_package: body.selectedPackage,
    }

    const { data: rows, error } = await supabase
        .from('reservations')
        .insert(payload)
        .select('id,event_date,guest_count,selected_package')

    if (error || !rows?.length) {
        return {
            error: {
                message: 'Failed to create reservation',
                details: error?.message ?? 'No row returned',
                status: 500,
            }
        }
    }
    const inserted = rows[0] as ReservationDbRow
    const newReservation: Reservation = {
        id: inserted.id,
        eventDate: inserted.event_date,
        guestCount: inserted.guest_count,
        selectedPackage: inserted.selected_package,
        reservationStatus: "pending_acceptance"
    }
    return { data: newReservation }

}

export async function updateReservation(businessId: string, body: ReservationFormBody, reservationId: Reservation['id']): Promise<ServiceResponse<Reservation>> {


    const payload = {
        business_id: businessId,
        event_date: String(body.eventDate),
        guest_count: Number(body.guestCount),
        selected_package: body.selectedPackage,
    }


    const { data: rows, error } = await supabase
        .from('reservations')
        .update(payload)
        .eq('id', reservationId)
        .eq('business_id', businessId)
        .select('id,event_date,guest_count,selected_package, status')

    if (error || !rows?.length) {
        return {
            error: {
                message: 'Failed to update reservation',
                details: error?.message ?? 'No row returned',
                status: 500,
            }
        }
    }
    // After the update, Supabase returns an array of rows. Since it is just one reservation, it will just have one row
    const updatedData = rows[0] as ReservationDbRow

    // Creates a new object in a frontend friendly 
    const updatedReservation: Reservation = {
        id: updatedData.id,
        eventDate: updatedData.event_date,
        guestCount: updatedData.guest_count,
        selectedPackage: updatedData.selected_package,
        reservationStatus: updatedData.status
    }

    return { data: updatedReservation }
}

export async function updateReservationStatus(businessId: string, reservationId: Reservation['id'], reservationStatus, rejectionReason): Promise<ServiceResponse<UpdateReservationStatusBody>> {
   

    const payload = {
        status: reservationStatus,
        rejection_reason: rejectionReason
    }

    const { data: rows, error } = await supabase
        .from('reservations')
        .update(payload)
        .eq('id', reservationId)
        .eq('business_id', businessId)
        .select('id,status,rejection_reason')

    if (error || !rows?.length) {
        return {
            error: {
                message: 'Failed to update reservation',
                details: error?.message ?? 'No row returned',
                status: 500,
            }
        }
    }
    const updatedData = rows[0] as ReservationDbRow

    // Creates a new object in a frontend friendly 
    const updatedReservationStatus: UpdateReservationStatusBody = {
        reservationStatus: updatedData.status,
        rejectionReason: updatedData.rejection_reason
    }


    return { data: updatedReservationStatus }


}