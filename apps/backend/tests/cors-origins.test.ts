import assert from "node:assert/strict"
import { test } from "node:test"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { parseCorsOrigins } from "../middlewares/cors-origins.js"

test("CORS accepts only configured exact origins", async () => {
  const allowed = parseCorsOrigins("https://quotationmonkey.com, https://admin.quotationmonkey.com, http://localhost:5173")
  const app = new Hono()
  app.use("*", cors({ origin: (origin) => allowed.has(origin) ? origin : "" }))
  app.get("/api/test", (c) => c.json({ ok: true }))

  const admin = await app.request("/api/test", { headers: { Origin: "https://admin.quotationmonkey.com" } })
  assert.equal(admin.headers.get("access-control-allow-origin"), "https://admin.quotationmonkey.com")

  const other = await app.request("/api/test", { headers: { Origin: "https://evil.example" } })
  assert.notEqual(other.headers.get("access-control-allow-origin"), "https://evil.example")
})

test("CORS rejects wildcard and origin paths", () => {
  assert.throws(() => parseCorsOrigins("*"))
  assert.throws(() => parseCorsOrigins("https://quotationmonkey.com/path"))
})
