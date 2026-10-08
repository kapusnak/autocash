import assert from "node:assert/strict"
import { test } from "node:test"

import { GA_EVENT_FORMULAR, GA_EVENT_TELEFON, trackLeadGenerated } from "./track-lead-conversion.ts"

const GA_ENV = "NEXT_PUBLIC_GA_MEASUREMENT_ID"
const ADS_ENV = "NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_SEND_TO"

function withGtag() {
  const calls: unknown[][] = []
  const dataLayer: unknown[] = []
  const previousWindow = (globalThis as { window?: unknown }).window
  ;(globalThis as { window?: unknown }).window = {
    dataLayer,
    gtag: (...args: unknown[]) => {
      calls.push(args)
    },
  }
  return {
    calls,
    dataLayer,
    restore() {
      if (previousWindow === undefined) {
        delete (globalThis as { window?: unknown }).window
      } else {
        ;(globalThis as { window?: unknown }).window = previousWindow
      }
    },
  }
}

function withEnv(name: string, value: string | undefined, fn: () => void) {
  const previous = process.env[name]
  if (value === undefined) delete process.env[name]
  else process.env[name] = value
  try {
    fn()
  } finally {
    if (previous === undefined) delete process.env[name]
    else process.env[name] = previous
  }
}

test("calculator lead sends exactly one vyplneny_formular with send_to", () => {
  const env = withGtag()
  withEnv(GA_ENV, "G-DXBBY6TFGG", () => {
    withEnv(ADS_ENV, undefined, () => {
      trackLeadGenerated({ source: "calculator", leadValue: 100000, pagePath: "/" })
    })
  })
  assert.equal(env.calls.length, 1)
  assert.deepEqual(env.calls[0], [
    "event",
    GA_EVENT_FORMULAR,
    {
      lead_source: "calculator",
      currency: "CZK",
      value: 100000,
      send_to: "G-DXBBY6TFGG",
    },
  ])
  assert.equal(env.dataLayer.length, 0)
  env.restore()
})

test("phone lead sends exactly one telefonni_cislo with page_path and send_to", () => {
  const env = withGtag()
  withEnv(GA_ENV, " G-DXBBY6TFGG ", () => {
    withEnv(ADS_ENV, "  ", () => {
      trackLeadGenerated({ source: "popup", pagePath: "/kontakty" })
      trackLeadGenerated({ source: "cta", pagePath: "/jak-to-funguje" })
    })
  })
  assert.equal(env.calls.length, 2)
  assert.deepEqual(env.calls[0], [
    "event",
    GA_EVENT_TELEFON,
    { lead_source: "popup", page_path: "/kontakty", send_to: "G-DXBBY6TFGG" },
  ])
  assert.deepEqual(env.calls[1], [
    "event",
    GA_EVENT_TELEFON,
    { lead_source: "cta", page_path: "/jak-to-funguje", send_to: "G-DXBBY6TFGG" },
  ])
  env.restore()
})

test("calculator without a value omits currency and value", () => {
  const env = withGtag()
  withEnv(GA_ENV, "G-DXBBY6TFGG", () => {
    trackLeadGenerated({ source: "calculator" })
  })
  assert.deepEqual(env.calls[0], [
    "event",
    GA_EVENT_FORMULAR,
    { lead_source: "calculator", send_to: "G-DXBBY6TFGG" },
  ])
  env.restore()
})

test("missing measurement id still fires the event without send_to", () => {
  const env = withGtag()
  withEnv(GA_ENV, undefined, () => {
    trackLeadGenerated({ source: "popup", pagePath: "/" })
  })
  assert.deepEqual(env.calls[0], ["event", GA_EVENT_TELEFON, { lead_source: "popup", page_path: "/" }])
  env.restore()
})

test("ads conversion stays a separate no-op when unset and fires once when set", () => {
  const env = withGtag()
  withEnv(GA_ENV, "G-DXBBY6TFGG", () => {
    withEnv(ADS_ENV, undefined, () => {
      trackLeadGenerated({ source: "calculator", leadValue: 50000 })
    })
    assert.equal(env.calls.length, 1)
    withEnv(ADS_ENV, "AW-123/abc", () => {
      trackLeadGenerated({ source: "popup", pagePath: "/" })
    })
  })
  assert.equal(env.calls.length, 3)
  assert.equal(env.calls[1]?.[1], GA_EVENT_TELEFON)
  assert.deepEqual(env.calls[2], ["event", "conversion", { send_to: "AW-123/abc" }])
  env.restore()
})

test("returns early when gtag is missing", () => {
  const previousWindow = (globalThis as { window?: unknown }).window
  ;(globalThis as { window?: unknown }).window = { dataLayer: [] }
  withEnv(GA_ENV, "G-DXBBY6TFGG", () => {
    trackLeadGenerated({ source: "calculator", leadValue: 1 })
  })
  delete (globalThis as { window?: unknown }).window
  if (previousWindow !== undefined) {
    ;(globalThis as { window?: unknown }).window = previousWindow
  }
})
