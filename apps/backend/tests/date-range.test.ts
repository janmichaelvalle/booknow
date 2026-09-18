import assert from "node:assert/strict"
import { test } from "node:test"
import { isValidAvailabilityRange } from "../lib/date-range.js"

test("availability accepts a bounded date-only range", () => {
  assert.equal(isValidAvailabilityRange("2026-09-01", "2026-09-30"), true)
  assert.equal(isValidAvailabilityRange("2026-09-01", "2026-09-01"), true)
})

test("availability rejects invalid, reversed, and oversized ranges", () => {
  assert.equal(isValidAvailabilityRange("2026-02-30", "2026-03-01"), false)
  assert.equal(isValidAvailabilityRange("2026-09-30", "2026-09-01"), false)
  assert.equal(isValidAvailabilityRange("2026-01-01", "2026-06-01"), false)
  assert.equal(isValidAvailabilityRange("2026-09-01T00:00:00Z", "2026-09-30"), false)
})
