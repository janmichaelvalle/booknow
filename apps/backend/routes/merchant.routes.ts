import { Hono } from "hono"
import { merchantAuthMiddleware } from "../middlewares/merchant.middleware.js"

const app = new Hono()

app.get("/api/me", merchantAuthMiddleware, (c) => {
  const merchant = c.get("merchant")
  return c.json({ data: merchant })
})

export default app
