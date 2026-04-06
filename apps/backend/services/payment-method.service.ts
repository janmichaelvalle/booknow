import { supabase } from "../lib/supabase.js"; 
import type { PaymentMethod, ServiceResponse } from "../lib/types.js";


export async function getAllPaymentMethods(businessId: string): Promise<ServiceResponse<PaymentMethod[]>> {

    const { data: rows, error } = await supabase
        .from('payment_methods')
        .select('id,category,provider_name,account_name,account_number,instructions,is_active')
        .eq('business_id', businessId)
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