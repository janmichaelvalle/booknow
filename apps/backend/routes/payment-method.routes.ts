import {Hono} from "hono";

const app = new Hono()

// Get all payment methods
app.get("/api/businesses/:businessSlug/payment-methods")