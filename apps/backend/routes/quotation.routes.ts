import { Hono } from "hono"
import {
  merchantAuthMiddleware,
  merchantBusinessMiddleware,
} from "../middlewares/merchant.middleware.js"
import {
  createQuotationController,
  getAllQuotationsController,
  getQuotationController,
  updateQuotationController,
  updateQuotationStatusController,
} from "../controllers/quotation.controller.js"

const app = new Hono()

app.get(
  "/api/businesses/:businessSlug/quotations",
  merchantAuthMiddleware,
  merchantBusinessMiddleware,
  getAllQuotationsController
)
app.get(
  "/api/businesses/:businessSlug/quotations/:quotationReference",
  getQuotationController
)
app.post("/api/businesses/:businessSlug/quotations", createQuotationController)
app.put(
  "/api/businesses/:businessSlug/quotations/:quotationReference",
  updateQuotationController
)
app.put(
  "/api/businesses/:businessSlug/quotations/:quotationReference/status",
  merchantAuthMiddleware,
  merchantBusinessMiddleware,
  updateQuotationStatusController
)

export default app
