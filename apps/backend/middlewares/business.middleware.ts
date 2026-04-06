import { createMiddleware } from "hono/factory";
import { getBusinessBySlugOrError } from "../services/business.service.js";
import { type BusinessRow } from "../lib/types.js";


export const businessMiddleware = createMiddleware(async (c, next) => {
    const businessSlug = c.req.param("businessSlug");

    if (!businessSlug) {
        return c.json(
            {
                message: "Business slug is required",
            },
            400
        );
    }

    const result = await getBusinessBySlugOrError(businessSlug);

    if ("error" in result) {
        return c.json(
            {
                message: result.error.message,
                error: result.error.details,
            },
            result.error.status
        );
    }

   
    c.set("business", result.business);

    await next();
});

declare module "hono" {
    interface ContextVariableMap {
        business: BusinessRow;
    }
}
