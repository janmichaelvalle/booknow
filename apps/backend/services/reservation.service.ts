import { supabase } from "../lib/supabase.js";
import { getBusinessBySlug } from "./business.service.js";
import { Reservation } from "../types/reservation.types.js";

// Still don't understand this
type ServiceResult =
    | { data: Reservation[] }
    | {
        error: {
            message: string
            details?: string
            status: 404 | 500
        }
    }

export async function getReservationsByBusinessSlug(businessSlug: string):
    // Still don't understand this
    Promise<ServiceResult> {
    // Call getBusinessBySlug function
    const { business, error: businessError } = await getBusinessBySlug(businessSlug)
    if (businessError) {
        return {
            error: {
                message: 'Failed to fetch business',
                details: businessError.message,
                status: 500,
            }
        }
    }
    if (!business) {
        return {
            error: {
                message: "Business not found",
                status: 404,
            }
        }
    }
    const { data: rows, error } = await supabase
        .from('reservations')
        .select('id,event_date,guest_count,selected_package')
        .eq('business_id', business.id)
        .order('created_at', { ascending: false })

    console.log(rows)

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
        eventDate: row.event_date,
        guestCount: row.guest_count,
        selectedPackage: row.selected_package,
    }))

    return { data: reservations }
}

export async function getSingleReservationByBusinessSlug(businessSlug: string) {
    
    
}