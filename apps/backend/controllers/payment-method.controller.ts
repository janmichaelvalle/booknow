import type { Context } from "hono";

export async function getAllPaymentMethodsController(c: Context) {

    const businessSlug = c.req.param("businessSlug")
    
}