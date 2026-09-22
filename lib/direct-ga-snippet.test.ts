import assert from "node:assert/strict"
import { test } from "node:test"
import { shouldLoadDirectGaSnippet } from "./direct-ga-snippet.ts"

test("GoogleAnalytics no-ops when GTM id is set", () => {
  assert.equal(shouldLoadDirectGaSnippet("G-DXBBY6TFGG", "GTM-P6VZJXTQ"), false)
  assert.equal(shouldLoadDirectGaSnippet("G-DXBBY6TFGG", " GTM-P6VZJXTQ "), false)
})

test("GoogleAnalytics no-ops without a measurement id", () => {
  assert.equal(shouldLoadDirectGaSnippet(undefined, undefined), false)
  assert.equal(shouldLoadDirectGaSnippet("", ""), false)
  assert.equal(shouldLoadDirectGaSnippet(undefined, "GTM-P6VZJXTQ"), false)
})

test("GoogleAnalytics loads a direct snippet only when GA is set and GTM is not", () => {
  assert.equal(shouldLoadDirectGaSnippet("G-DXBBY6TFGG", undefined), true)
  assert.equal(shouldLoadDirectGaSnippet("G-DXBBY6TFGG", ""), true)
})
