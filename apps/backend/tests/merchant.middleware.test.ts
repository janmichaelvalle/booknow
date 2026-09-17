import assert from "node:assert/strict"
import { test } from "node:test"
import { Hono } from "hono"
import {
  createMerchantAuthMiddleware,
  merchantBusinessMiddleware,
} from "../middlewares/merchant.middleware.js"

const merchant = {
  authUserId: "user-a",
  businessId: "business-a",
  businessName: "Business A",
  businessSlug: "business-a",
}

function createTestApp() {
  const app = new Hono()
  const authenticate = createMerchantAuthMiddleware(async (token) =>
    token === "valid" ? { merchant } : { status: 401, message: "Invalid session" }
  )

  // Public customer routes must not inherit merchant authentication.
  app.get("/public", (c) => c.json({ ok: true }))
  app.post("/public", (c) => c.json({ ok: true }))
  app.get("/merchant/:businessId", authenticate, (c, next) => {
    c.set("business", { id: c.req.param("businessId") } as never)
    return next()
  }, merchantBusinessMiddleware, (c) => c.json({ ok: true }))
  return app
}

test("unauthenticated merchant request is rejected", async () => {
  const response = await createTestApp().request("/merchant/business-a")
  assert.equal(response.status, 401)
})

test("merchant can access their own business", async () => {
  const response = await createTestApp().request("/merchant/business-a", {
    headers: { Authorization: "Bearer valid" },
  })
  assert.equal(response.status, 200)
})

test("merchant cannot access another business by changing its ID", async () => {
  const response = await createTestApp().request("/merchant/business-b", {
    headers: { Authorization: "Bearer valid" },
  })
  assert.equal(response.status, 403)
})

test("public viewing and creation remain accessible without a token", async () => {
  const app = createTestApp()
  assert.equal((await app.request("/public")).status, 200)
  assert.equal((await app.request("/public", { method: "POST" })).status, 200)
})
