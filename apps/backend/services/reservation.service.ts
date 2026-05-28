import { supabase } from "../lib/supabase.js";
import { getBusinessBySlugOrError } from "./business.service.js";
import type { Reservation, ReservationDbRow, ServiceResponse, ReservationFormBody } from "../lib/types.js";




type UpdateReservationStatusBody = Pick<
    Reservation,
    "reservationStatus" | "rejectionReason"
>

export async function getReservationsByBusinessSlug(businessId: string):
    // this async function returns a Promise, and when that Promise finishes, the final value will match ServiceResult
    Promise<ServiceResponse<Reservation[]>> {


    const { data: rows, error } = await supabase
        .from('reservations')
        .select(`
            id,
            guest_count,
            selected_package_id,
            package_total,
            addons_total,
            grand_total,
            event_date,
            start_time,
            end_time,
            venue,
            status,
            payment_method_id,
            payment_proof_path,
            rejection_reason,
            customer_name,
            customer_email,
            customer_phone,
            business_packages ( id, name ),
            reservation_addons (
            reservation_id, 
            addon_id, 
            quantity,
            addon_price,
            addon_name, 
            business_addons(id, name, price)
            )
        `)
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


    const reservations: Reservation[] = rows.map((row) => {
        const selectedAddOns = row.reservation_addons.map((addon) => ({
            addonId: addon.addon_id,
            addonName: addon.addon_name,
            addonPrice: addon.addon_price,
            quantity: addon.quantity
        }))
        return {
            id: row.id,
            eventDate: row.event_date,
            startTime: row.start_time,
            endTime: row.end_time,
            venue: row.venue,
            guestCount: row.guest_count,
            selectedPackageName: row.business_packages?.name ?? "",
            selectedPackageId: row.selected_package_id,
            selectedAddOns,
            packageTotal: row.package_total,
            addOnsTotal: row.addons_total,
            grandTotal: row.grand_total,
            reservationStatus: row.status,
            paymentMethodId: row.payment_method_id,
            paymentProofPath: row.payment_proof_path,
            rejectionReason: row.rejection_reason,
            customerName: row.customer_name,
            customerEmail: row.customer_email,
            customerPhone: row.customer_phone
        }
    })

    return { data: reservations }
}

export async function getSingleReservationByBusinessSlug(businessId: string, reservationId: string):
    Promise<ServiceResponse<Reservation>> {


    const { data: row, error } = await supabase
        .from('reservations')
        .select(`
            id,
            guest_count,
            selected_package_id,
            package_total,
            addons_total,
            grand_total,
            event_date,
            start_time,
            end_time,
            venue,
            status,
            payment_method_id,
            payment_proof_path,
            rejection_reason,
            customer_name,
            customer_email,
            customer_phone,
            business_packages ( id, name ),
            reservation_addons (
            reservation_id, 
            addon_id, 
            quantity,
            addon_price,
            addon_name, 
            business_addons(id, name, price)
            )
        `)
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

    const selectedAddOns = row.reservation_addons.map((addon) => ({
        addonId: addon.addon_id,
        addonName: addon.addon_name,
        addonPrice: addon.addon_price,
        quantity: addon.quantity
    }))


    const reservation: Reservation = {
        id: row.id,
        eventDate: row.event_date,
        startTime: row.start_time,
        endTime: row.end_time,
        venue: row.venue,
        guestCount: row.guest_count,
        selectedPackageName: row.business_packages?.name ?? "",
        selectedPackageId: row.selected_package_id,
        selectedAddOns: selectedAddOns,
        packageTotal: row.package_total,
        addOnsTotal: row.addons_total,
        grandTotal: row.grand_total,
        reservationStatus: row.status,
        paymentMethodId: row.payment_method_id,
        paymentProofPath: row.payment_proof_path,
        rejectionReason: row.rejection_reason,
        customerName: row.customer_name,
        customerEmail: row.customer_email,
        customerPhone: row.customer_phone
    }

    return { data: reservation }

}

export async function createReservation(businessId: string, body: ReservationFormBody): Promise<ServiceResponse<Reservation>> {

    const payload = {
        business_id: businessId,
        event_date: String(body.eventDate),
        start_time: body.startTime,
        end_time: body.endTime,
        venue: body.venue,
        guest_count: Number(body.guestCount),
        selected_package_id: body.selectedPackageId,
        package_total: body.packageTotal,
        addons_total: body.addOnsTotal,
        grand_total: body.grandTotal,
        customer_name: body.customerName,
        customer_email: body.customerEmail,
        customer_phone: body.customerPhone
    }

    const { data: reservationRows, error: reservationError } = await supabase
        .from('reservations')
        .insert(payload)
        .select(`
            id,
            event_date,
            guest_count,
            selected_package_id,
            package_total,
            addons_total,
            grand_total,
            start_time,
            end_time,
            venue,
            status,
            customer_name,
            customer_email,
            customer_phone
            `)

    if (reservationError || !reservationRows?.length) {
        return {
            error: {
                message: 'Failed to create reservation',
                details: reservationError?.message ?? 'No row returned',
                status: 500,
            }
        }
    }
    const inserted = reservationRows[0] as ReservationDbRow

    const selectedAddOnsId = Object.entries(body.selectedAddOns).
        filter((addon) => addon[1] > 0)
        .map((addon) => addon[0])

    const { data: businessAddOns, error: businessAddOnsError } = await supabase
        .from('business_addons')
        .select(`
        id,
        name,
        price
        `)
        .in("id", selectedAddOnsId)

    if (businessAddOnsError || !businessAddOns) {
        return {
            error: {
                message: "Failed to fetch business add-ons",
                details: businessAddOnsError?.message ?? "No add-ons returned",
                status: 500,
            }
        }
    }

    const selectedAddonsPayload = Object.entries(body.selectedAddOns)
        .filter((addon) => addon[1] > 0)
        .map((addon) => {
            const matchedAddOn = businessAddOns.find(
                (businessAddOn) => businessAddOn.id === addon[0]
            )
            return {
                reservation_id: inserted.id,
                addon_id: addon[0],
                addon_name: matchedAddOn?.name ?? "",
                addon_price: matchedAddOn?.price ?? 0,
                quantity: addon[1],
            }
        })

    const { data: reservationAddOnRows, error: reservationAddOnRowsError } = await supabase
        .from('reservation_addons')
        .insert(selectedAddonsPayload)

    if (reservationAddOnRowsError) {
        return {
            error: {
                message: 'Failed to create reservation_addons',
                details: reservationAddOnRowsError?.message ?? 'No row returned',
                status: 500,
            }
        }
    }

    const newReservation: Reservation = {
        id: inserted.id,
        eventDate: inserted.event_date,
        startTime: inserted.start_time,
        endTime: inserted.end_time,
        venue: inserted.venue,
        guestCount: inserted.guest_count,
        selectedPackageId: inserted.selected_package_id,
        packageTotal: inserted.package_total,
        addOnsTotal: inserted.addons_total,
        grandTotal: inserted.grand_total,
        reservationStatus: "pending_acceptance",
        customerName: inserted.customer_name,
        customerEmail: inserted.customer_email,
        customerPhone: inserted.customer_phone
    }
    return { data: newReservation }

}

export async function updateReservation(businessId: string, body: ReservationFormBody, reservationId: Reservation['id']): Promise<ServiceResponse<Reservation>> {


    const payload = {
        business_id: businessId,
        event_date: String(body.eventDate),
        start_time: body.startTime,
        end_time: body.endTime,
        venue: body.venue,
        guest_count: Number(body.guestCount),
        selected_package_id: body.selectedPackageId,
        package_total: body.packageTotal,
        addons_total: body.addOnsTotal,
        grand_total: body.grandTotal,
        customer_name: body.customerName,
        customer_email: body.customerEmail,
        customer_phone: body.customerPhone
    }


    const { data: reservationRows, error: reservationError } = await supabase
        .from('reservations')
        .update(payload)
        .eq('id', reservationId)
        .eq('business_id', businessId)
        .select(`
            id,
            event_date,
            guest_count,
            selected_package_id,
            package_total,
            addons_total,
            grand_total,
            start_time,
            end_time,
            venue,
            status,
            customer_name,
            customer_email,
            customer_phone
            `)

    if (reservationError || !reservationRows?.length) {
        return {
            error: {
                message: 'Failed to update reservation',
                details: reservationError?.message ?? 'No row returned',
                status: 500,
            }
        }
    }
    // After the update, Supabase returns an array of rows. Since it is just one reservation, it will just have one row
    const updatedData = reservationRows[0] as ReservationDbRow

    const selectedAddOnsId = Object.entries(body.selectedAddOns).
        filter((addon) => addon[1] > 0)
        .map((addon) => addon[0])

    const { data: businessAddOns, error: businessAddOnsError } = await supabase
        .from('business_addons')
        .select(`
        id,
        name,
        price
        `)
        .in("id", selectedAddOnsId)

    if (businessAddOnsError || !businessAddOns) {
        return {
            error: {
                message: "Failed to fetch business add-ons",
                details: businessAddOnsError?.message ?? "No add-ons returned",
                status: 500,
            }
        }
    }

    const selectedAddonsPayload = Object.entries(body.selectedAddOns)
        .filter((addon) => addon[1] > 0)
        .map((addon) => {
            const matchedAddOn = businessAddOns.find(
                (businessAddOn) => businessAddOn.id === addon[0]
            )
            return {
                reservation_id: updatedData.id,
                addon_id: addon[0],
                addon_name: matchedAddOn?.name ?? "",
                addon_price: matchedAddOn?.price ?? 0,
                quantity: addon[1],
            }
        })


    const { error: deleteAddOnError } = await supabase
        .from('reservation_addons')
        .delete()
        .eq("reservation_id", updatedData.id)

    if (deleteAddOnError) {
        return {
            error: {
                message: "Failed to delete existing reservation add-ons",
                details: deleteAddOnError.message,
                status: 500,
            },
        }
    }

    if (selectedAddonsPayload.length > 0) {
        const { error: insertAddOnsError } = await supabase
            .from("reservation_addons")
            .insert(selectedAddonsPayload)

        if (insertAddOnsError) {
            return {
                error: {
                    message: "Failed to insert updated reservation add-ons",
                    details: insertAddOnsError.message,
                    status: 500,
                },
            }
        }
    }


    // Creates a new object in a frontend friendly 
    const updatedReservation: Reservation = {
        id: updatedData.id,
        eventDate: updatedData.event_date,
        startTime: updatedData.start_time,
        endTime: updatedData.end_time,
        venue: updatedData.venue,
        guestCount: updatedData.guest_count,
        selectedPackageId: updatedData.selected_package_id,
        packageTotal: updatedData.package_total,
        addOnsTotal: updatedData.addons_total,
        grandTotal: updatedData.grand_total,
        customerName: updatedData.customer_name,
        customerEmail: updatedData.customer_email,
        customerPhone: updatedData.customer_phone
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