import type { Context } from "hono";
import type { ServiceResponse } from "../types/service-response.types.js";



export function handleServiceResponse<T>(c: Context, result: ServiceResponse<T>) {
    if ("error" in result) {
        return c.json(
            {
                message: result.error.message,
                error: result.error.details,
            },
            result.error.status
        );
    }

    return c.json({
        message: "success",
        data: result.data,
    });
}