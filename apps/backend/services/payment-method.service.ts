import { supabase } from "../lib/supabase.js"; 
import { getBusinessBySlugOrError } from "./business.service.js";
import type { PaymentMethod } from "../types/payment-method.types.js";
import type { ServiceResponse } from "../types/service-response.types.js";



export async function getAllPaymentMethods(businessSlug: string): Promise<ServiceResponse<PaymentMethod[]>> {
    const businessResult = await getBusinessBySlugOrError(businessSlug)
    if ("error" in businessResult) {
        return businessResult
    }
    const business = businessResult.business

    const { data: rows, error } = await supabase
        .from('payment_methods')
        .select('id,category,provider_name,account_name,account_number,instructions,is_active')
        .eq('business_id', business.id)
        .eq('is_active', true)

    if (error) {
        return {
            error: {
                message: "Failed to fetch payment methods",
                details: error.message,
                status: 500
            }
        }
    }

    const paymentMethods: PaymentMethod[] = rows.map((row) => ({
        id: row.id,
        category: row.category,
        providerName: row.provider_name,
        accountName: row.account_name,
        accountNumber: row.account_number,
        instructions: row.instructions,
        isActive: row.is_active,
    }))

    return { data: paymentMethods}


}