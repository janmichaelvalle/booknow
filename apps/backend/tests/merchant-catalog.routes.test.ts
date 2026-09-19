import assert from "node:assert/strict"
import { test } from "node:test"
import app from "../src/index.js"

test("merchant catalog endpoints reject unauthenticated requests", async () => {
  for (const [method, path] of [
    ["GET", "/api/merchant/catalog"],
    ["POST", "/api/merchant/packages"],
    ["PATCH", "/api/merchant/packages/package-id"],
    ["POST", "/api/merchant/packages/package-id/inclusions"],
    ["PATCH", "/api/merchant/packages/package-id/inclusions/inclusion-id"],
    ["POST", "/api/merchant/packages/package-id/tiers"],
    ["PATCH", "/api/merchant/packages/package-id/tiers/tier-id"],
    ["POST", "/api/merchant/packages/package-id/tiers/tier-id/duplicate"],
    ["POST", "/api/merchant/packages/package-id/tiers/tier-id/items"],
    ["PATCH", "/api/merchant/packages/package-id/tiers/tier-id/items/item-id"],
  ]) {
    const response = await app.request(path, { method })
    assert.equal(response.status, 401, `${method} ${path}`)
  }
})
