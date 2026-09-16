import { Hono } from "hono"
import {
  createQuotationController,
  getAllQuotationsController,
  getQuotationController,
  updateQuotationController,
  updateQuotationStatusController,
} from "../controllers/quotation.controller.js"

const app = new Hono()

app.get("/api/businesses/:businessSlug/quotations", getAllQuotationsController)
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
  updateQuotationStatusController
)

export default app
