import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import {
  GA_EVENT_QR_LETAK,
  QR_ANALYTICS_READY_TIMEOUT_MS,
  QR_HOME_BEACON_WAIT_MS,
  QR_LETAK_CAMPAIGN,
  QR_LETAK_PENDING,
  QR_LETAK_SENT,
  QR_LETAK_STORAGE_KEY,
  QR_REDIRECT_HOLD_MS,
  handoffQrLetakScan,
  hasPendingQrLetak,
  isAnalyticsReady,
  isGtagReady,
  markQrLetakPending,
  replayPendingQrLetak,
  trackQrLetak,
  waitForAnalytics,
} from "./track-qr-letak.ts"

type GtagCall = unknown[]

const GA_ENV = "NEXT_PUBLIC_GA_MEASUREMENT_ID"
const GTM_ENV = "NEXT_PUBLIC_GTM_ID"
const GA_ID = "G-DXBBY6TFGG"

function mockSessionStorage() {
  const store = new Map<string, string>()
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

function installWindow(
  gtag?: (...args: GtagCall) => void,
  extras?: { googleTagManager?: object; dataLayer?: unknown[] },
) {
  const sessionStorage = mockSessionStorage()
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      gtag,
      dataLayer: extras?.dataLayer ? [...extras.dataLayer] : [],
      google_tag_manager: extras?.googleTagManager,
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      sessionStorage,
    },
  })
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: sessionStorage,
  })
  return sessionStorage
}

function eventParams(calls: GtagCall[]): Record<string, unknown> {
  const event = calls.find((call) => call[0] === "event")
  return (event?.[2] ?? {}) as Record<string, unknown>
}

function dataLayerHasQrCustomEvent(dataLayer: unknown[]): boolean {
  return dataLayer.some((entry) => {
    return Boolean(
      entry &&
        typeof entry === "object" &&
        !("0" in (entry as object)) &&
        (entry as { event?: unknown }).event === GA_EVENT_QR_LETAK,
    )
  })
}

beforeEach(() => {
  delete (globalThis as { window?: unknown }).window
  process.env[GA_ENV] = GA_ID
  process.env[GTM_ENV] = "GTM-TEST"
})

afterEach(() => {
  delete (globalThis as { window?: unknown }).window
  delete process.env[GA_ENV]
  delete process.env[GTM_ENV]
})

test("/qr wait timeout matches the homepage 8s beacon", () => {
  assert.equal(QR_ANALYTICS_READY_TIMEOUT_MS, 8000)
  assert.equal(QR_HOME_BEACON_WAIT_MS, 8000)
  assert.equal(QR_ANALYTICS_READY_TIMEOUT_MS, QR_HOME_BEACON_WAIT_MS)
})

test("trackQrLetak configs GA4 once then events with send_to", async () => {
  const calls: GtagCall[] = []
  installWindow(
    (...args) => {
      calls.push(args)
      const params = args[2]
      if (params && typeof params === "object" && "event_callback" in params) {
        const cb = (params as { event_callback?: unknown }).event_callback
        if (typeof cb === "function") cb()
      }
    },
    { googleTagManager: { "GTM-TEST": {} } },
  )

  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })

  assert.equal(calls[0]?.[0], "config")
  assert.equal(calls[0]?.[1], GA_ID)
  assert.deepEqual(calls[0]?.[2], { send_page_view: false })
  assert.equal(calls[1]?.[0], "event")
  assert.equal(calls[1]?.[1], GA_EVENT_QR_LETAK)

  const params = eventParams(calls)
  assert.equal(params.send_to, GA_ID)
  assert.equal(params.transport_type, "beacon")
  assert.equal(params.campaign_source, QR_LETAK_CAMPAIGN.campaign_source)
  assert.equal(params.campaign_medium, QR_LETAK_CAMPAIGN.campaign_medium)
  assert.equal(params.campaign_name, QR_LETAK_CAMPAIGN.campaign_name)
  assert.equal(typeof params.event_callback, "function")
  assert.equal(params.event_timeout, QR_REDIRECT_HOLD_MS)
  assert.equal(
    dataLayerHasQrCustomEvent(
      (globalThis as { window: { dataLayer: unknown[] } }).window.dataLayer,
    ),
    false,
  )

  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  const configs = calls.filter((call) => call[0] === "config")
  const events = calls.filter((call) => call[0] === "event")
  assert.equal(configs.length, 1)
  assert.equal(events.length, 2)
  assert.equal((events[1]?.[2] as Record<string, unknown>).send_to, GA_ID)
})

test("trackQrLetak without gtag does not mark the scan sent", async () => {
  const storage = installWindow()
  markQrLetakPending()

  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })

  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
  assert.equal(hasPendingQrLetak(), true)
})

test("Ads-only gtag is not ready and keeps the scan pending", async () => {
  const calls: GtagCall[] = []
  const storage = installWindow((...args) => {
    calls.push(args)
  })
  markQrLetakPending()

  assert.equal(isGtagReady(), true)
  assert.equal(isAnalyticsReady(), false)

  const ready = await waitForAnalytics(150)
  assert.equal(ready, false)

  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  assert.equal(calls.length, 0)
  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
})

test("waitForAnalytics installs a gtag stub after GTM and still succeeds after settle", async () => {
  installWindow(undefined, { googleTagManager: { "GTM-TEST": {} } })
  assert.equal(isGtagReady(), false)

  const ready = await waitForAnalytics(200)
  assert.equal(ready, true)
  assert.equal(isGtagReady(), true)
  assert.equal(isAnalyticsReady(), true)
})

test("handoffQrLetakScan still attempts track after a wait timeout and keeps pending", async () => {
  const calls: GtagCall[] = []
  const storage = installWindow((...args) => {
    calls.push(args)
  })

  await handoffQrLetakScan(undefined, 80)

  assert.equal(calls.length, 0)
  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
})

test("handoffQrLetakScan fires config then qr_letak after GTM is ready", async () => {
  const calls: GtagCall[] = []
  const storage = installWindow(
    (...args) => {
      calls.push(args)
      const params = args[2]
      if (params && typeof params === "object" && "event_callback" in params) {
        const cb = (params as { event_callback?: unknown }).event_callback
        if (typeof cb === "function") cb()
      }
    },
    { googleTagManager: { "GTM-TEST": {} } },
  )

  await handoffQrLetakScan(undefined, 200)

  const configIndex = calls.findIndex((call) => call[0] === "config")
  const qrIndex = calls.findIndex((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK)
  assert.ok(configIndex >= 0)
  assert.ok(qrIndex > configIndex)
  assert.equal(calls[configIndex]?.[1], GA_ID)
  assert.equal(eventParams(calls).send_to, GA_ID)
  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_SENT)
})

test("replayPendingQrLetak attempts track even if the wait timed out", async () => {
  const calls: GtagCall[] = []
  const storage = installWindow()
  markQrLetakPending()

  replayPendingQrLetak(80)
  await new Promise((resolve) => setTimeout(resolve, 200))

  assert.equal(calls.length, 0)
  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)

  const win = globalThis as {
    window: {
      gtag?: (...args: GtagCall) => void
      google_tag_manager?: object
    }
  }
  win.window.google_tag_manager = { "GTM-TEST": {} }
  win.window.gtag = (...args) => {
    calls.push(args)
    const params = args[2]
    if (params && typeof params === "object" && "event_callback" in params) {
      const cb = (params as { event_callback?: unknown }).event_callback
      if (typeof cb === "function") cb()
    }
  }
  markQrLetakPending()
  replayPendingQrLetak(80)
  await new Promise((resolve) => setTimeout(resolve, 600))

  assert.ok(calls.some((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK))
  assert.equal(eventParams(calls).send_to, GA_ID)
  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_SENT)
})

test("GoogleAnalytics component no-ops through shouldLoadDirectGaSnippet when GTM is set", () => {
  const gaSrc = readFileSync(
    fileURLToPath(new URL("../components/google-analytics.tsx", import.meta.url)),
    "utf8",
  )
  assert.match(gaSrc, /shouldLoadDirectGaSnippet/)
  assert.match(gaSrc, /return null/)
  assert.doesNotMatch(gaSrc, /send_page_view/)
})
