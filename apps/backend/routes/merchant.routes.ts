import { Hono } from "hono"
import { merchantAuthMiddleware } from "../middlewares/merchant.middleware.js"
import {
  deleteDateCapacityController,
  getMerchantAvailabilityController,
  getMerchantDateEventsController,
  patchDefaultDailyCapacityController,
  putDateCapacityController,
} from "../controllers/merchant-availability.controller.js"
import {
  createInclusionController, createPackageController, createTierController,
  createTierItemController, duplicateTierController, getMerchantCatalogController,
  updateInclusionController, updatePackageController, updateTierController,
  updateTierItemController,
} from "../controllers/merchant-catalog.controller.js"

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

app.get("/api/merchant/catalog", merchantAuthMiddleware, getMerchantCatalogController)
app.post("/api/merchant/packages", merchantAuthMiddleware, createPackageController)
app.patch("/api/merchant/packages/:packageId", merchantAuthMiddleware, updatePackageController)
app.post("/api/merchant/packages/:packageId/inclusions", merchantAuthMiddleware, createInclusionController)
app.patch("/api/merchant/packages/:packageId/inclusions/:inclusionId", merchantAuthMiddleware, updateInclusionController)
app.post("/api/merchant/packages/:packageId/tiers", merchantAuthMiddleware, createTierController)
app.patch("/api/merchant/packages/:packageId/tiers/:tierId", merchantAuthMiddleware, updateTierController)
app.post("/api/merchant/packages/:packageId/tiers/:tierId/duplicate", merchantAuthMiddleware, duplicateTierController)
app.post("/api/merchant/packages/:packageId/tiers/:tierId/items", merchantAuthMiddleware, createTierItemController)
app.patch("/api/merchant/packages/:packageId/tiers/:tierId/items/:itemId", merchantAuthMiddleware, updateTierItemController)

export default app
