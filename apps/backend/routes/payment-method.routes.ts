import {Hono} from "hono";
import { getAllPaymentMethodsController } from "../controllers/payment-method.controller.js";

const app = new Hono()

// Get all payment methods
app.get("/api/businesses/:businessSlug/payment-methods", getAllPaymentMethodsController)


export default app