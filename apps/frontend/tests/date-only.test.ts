import assert from "node:assert/strict"
import { test } from "node:test"
import { fromDateOnly, toDateOnly, todayInManila } from "../src/lib/date-only.ts"

test("quotation dates round-trip as calendar dates without UTC conversion", () => {
  assert.equal(toDateOnly(fromDateOnly("2026-09-20")), "2026-09-20")
  assert.match(todayInManila(), /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/)
})
