import { Hono } from "hono"
import { merchantAuthMiddleware } from "../middlewares/merchant.middleware.js"
import {
  deleteDateCapacityController,
  getMerchantAvailabilityController,
  getMerchantDateEventsController,
  patchDefaultDailyCapacityController,
  putDateCapacityController,
} from "../controllers/merchant-availability.controller.js"

const app = new Hono()

app.get("/api/me", merchantAuthMiddleware, (c) => {
  const merchant = c.get("merchant")
  return c.json({ data: merchant })
})

app.get("/api/merchant/availability", merchantAuthMiddleware, getMerchantAvailabilityController)
app.get("/api/merchant/availability/dates/:date/events", merchantAuthMiddleware, getMerchantDateEventsController)
app.patch("/api/merchant/availability/default", merchantAuthMiddleware, patchDefaultDailyCapacityController)
app.put("/api/merchant/availability/dates/:date", merchantAuthMiddleware, putDateCapacityController)
app.delete("/api/merchant/availability/dates/:date", merchantAuthMiddleware, deleteDateCapacityController)

export default app
