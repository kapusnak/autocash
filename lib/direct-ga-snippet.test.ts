import assert from "node:assert/strict"
import { test } from "node:test"
import {
  directGaConfigSnippet,
  shouldLoadDirectGaSnippet,
  shouldSuppressDirectGaPageView,
} from "./direct-ga-snippet.ts"

test("GoogleAnalytics no-ops when GTM id is set (hnedpenize hybrid)", () => {
  assert.equal(shouldLoadDirectGaSnippet("G-DXBBY6TFGG", "GTM-P6VZJXTQ"), false)
  assert.equal(shouldLoadDirectGaSnippet("G-DXBBY6TFGG", " GTM-P6VZJXTQ "), false)
})

test("GoogleAnalytics no-ops without a measurement id", () => {
  assert.equal(shouldLoadDirectGaSnippet(undefined, undefined), false)
  assert.equal(shouldLoadDirectGaSnippet("", ""), false)
  assert.equal(shouldLoadDirectGaSnippet(undefined, "GTM-P6VZJXTQ"), false)
})

test("GoogleAnalytics loads a direct snippet when GA is set and GTM is not", () => {
  assert.equal(shouldLoadDirectGaSnippet("G-DXBBY6TFGG", undefined), true)
  assert.equal(shouldLoadDirectGaSnippet("G-DXBBY6TFGG", ""), true)
})

test("GTM hybrid config suppresses page_view; GTM-absent config is default", () => {
  assert.equal(shouldSuppressDirectGaPageView("GTM-P6VZJXTQ"), true)
  assert.equal(shouldSuppressDirectGaPageView(" GTM-P6VZJXTQ "), true)
  assert.equal(shouldSuppressDirectGaPageView(undefined), false)
  assert.equal(shouldSuppressDirectGaPageView(""), false)
  assert.equal(
    directGaConfigSnippet("G-DXBBY6TFGG", "GTM-P6VZJXTQ"),
    "gtag('config', 'G-DXBBY6TFGG', { send_page_view: false });",
  )
  assert.equal(directGaConfigSnippet("G-DXBBY6TFGG", ""), "gtag('config', 'G-DXBBY6TFGG');")
})
