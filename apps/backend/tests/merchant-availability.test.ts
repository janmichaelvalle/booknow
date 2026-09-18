import assert from "node:assert/strict"
import { test } from "node:test"
import app from "../src/index.js"
import {
  getMerchantAvailability,
  getMerchantDateEvents,
  isCapacity,
  isEditableDate,
  setDateCapacity,
  setDefaultDailyCapacity,
} from "../services/merchant-availability.service.js"

test("merchant availability routes reject missing access tokens", async () => {
  for (const [method, path] of [
    ["GET", "/api/merchant/availability?from=2026-09-01&to=2026-09-30"],
    ["GET", "/api/merchant/availability/dates/2026-09-28/events"],
    ["PATCH", "/api/merchant/availability/default"],
    ["PUT", "/api/merchant/availability/dates/2026-09-26"],
    ["DELETE", "/api/merchant/availability/dates/2026-09-26"],
  ]) {
    const response = await app.request(path, { method })
    assert.equal(response.status, 401, `${method} ${path}`)
  }
})

test("capacity input must be a non-negative safe integer", () => {
  assert.equal(isCapacity(0), true)
  assert.equal(isCapacity(5), true)
  for (const value of [-1, 1.5, "2", NaN, Infinity, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(isCapacity(value), false)
  }
})

test("date editing allows today and future, never past or malformed dates", () => {
  assert.equal(isEditableDate("2026-09-18", "2026-09-18"), true)
  assert.equal(isEditableDate("2026-09-19", "2026-09-18"), true)
  assert.equal(isEditableDate("2026-09-17", "2026-09-18"), false)
  assert.equal(isEditableDate("2026-02-30", "2026-09-18"), false)
})

test("invalid capacity and range requests fail before database access", async () => {
  const results = await Promise.all([
    setDefaultDailyCapacity("business-id", -1),
    setDateCapacity("business-id", "2099-01-01", 1.5),
    setDateCapacity("business-id", "2020-01-01", 1),
    getMerchantAvailability("business-id", "bad", "2099-01-01"),
    getMerchantDateEvents("business-id", "2026-02-30"),
  ])
  for (const result of results) {
    assert.ok("error" in result)
    assert.equal(result.error.status, 400)
  }
})
