import assert from "node:assert/strict"
import { test } from "node:test"
import { publicQuotationUrl, resolveAppSurface } from "../src/lib/app-host.ts"

test("production hosts expose only their own route tree", () => {
  assert.deepEqual(resolveAppSurface("quotationmonkey.com", "/login"), { kind: "public" })
  assert.deepEqual(resolveAppSurface("admin.quotationmonkey.com", "/tipsy-tap"), { kind: "admin" })
})

test("localhost and Vercel previews use the explicit /admin prefix", () => {
  assert.deepEqual(resolveAppSurface("localhost", "/tipsy-tap"), { kind: "public" })
  assert.deepEqual(resolveAppSurface("localhost", "/admin/login"), { kind: "admin", basename: "/admin" })
  assert.deepEqual(resolveAppSurface("booknow-abc.vercel.app", "/admin/quotations"), { kind: "admin", basename: "/admin" })
  assert.deepEqual(resolveAppSurface("booknow-abc.vercel.app", "/tipsy-tap"), { kind: "public" })
  assert.deepEqual(resolveAppSurface("unrecognized.example", "/admin/login"), { kind: "unsupported" })
})

test("admin quotation links open the public host", () => {
  assert.equal(
    publicQuotationUrl("tipsy-tap", "A7K29P", "admin.quotationmonkey.com", "https://admin.quotationmonkey.com"),
    "https://quotationmonkey.com/tipsy-tap/A7K29P"
  )
  assert.equal(
    publicQuotationUrl("tipsy-tap", "A7K29P", "localhost", "http://localhost:5173"),
    "http://localhost:5173/tipsy-tap/A7K29P"
  )
})
