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
  isGtagJsLoaded,
  isGtagJsScriptUrl,
  isGtagReady,
  markGtagJsLoaded,
  markQrLetakPending,
  replayPendingQrLetak,
  trackQrLetak,
  waitForAnalytics,
} from "./track-qr-letak.ts"
import { shouldLoadDirectGaSnippet } from "./direct-ga-snippet.ts"

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

type ResourceEntry = { name: string; initiatorType: string; responseEnd?: number }

function installWindow(
  gtag?: (...args: GtagCall) => void,
  extras?: {
    googleTagManager?: object
    dataLayer?: unknown[]
    gtagJsLoaded?: boolean
    resourceEntries?: ResourceEntry[]
    document?: { getElementsByTagName: (tag: string) => { length: number } }
  },
) {
  const sessionStorage = mockSessionStorage()
  const resourceEntries = extras?.resourceEntries ?? []
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      gtag,
      dataLayer: extras?.dataLayer ? [...extras.dataLayer] : [],
      google_tag_manager: extras?.googleTagManager,
      __autocashGtagJsLoaded: extras?.gtagJsLoaded ? true : undefined,
      setTimeout: globalThis.setTimeout.bind(globalThis),
      clearTimeout: globalThis.clearTimeout.bind(globalThis),
      sessionStorage,
      performance: {
        getEntriesByType: (type: string) => (type === "resource" ? resourceEntries : []),
      },
    },
  })
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: sessionStorage,
  })
  if (extras?.document) {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: extras.document,
    })
  } else {
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: {
        getElementsByTagName: () => ({ length: 0 }),
      },
    })
  }
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
    { gtagJsLoaded: true },
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
  assert.equal("event_timeout" in params, false)
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

test("inline gtag stub is not ready until gtag.js has loaded", async () => {
  const calls: GtagCall[] = []
  const storage = installWindow((...args) => {
    calls.push(args)
  })
  markQrLetakPending()

  assert.equal(isGtagReady(), true)
  assert.equal(isGtagJsLoaded(), false)
  assert.equal(isAnalyticsReady(), false)

  const ready = await waitForAnalytics(150)
  assert.equal(ready, false)

  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  assert.equal(calls.length, 0)
  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
})

test("gtag.js loaded plus gtag function is ready without GTM", async () => {
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
    { gtagJsLoaded: true },
  )

  assert.equal(isGtagReady(), true)
  assert.equal(isGtagJsLoaded(), true)
  assert.equal(isAnalyticsReady(), true)

  const ready = await waitForAnalytics(150)
  assert.equal(ready, true)

  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  assert.equal(calls[0]?.[0], "config")
  assert.equal(calls[1]?.[0], "event")
  assert.equal(calls[1]?.[1], GA_EVENT_QR_LETAK)
  assert.equal(eventParams(calls).send_to, GA_ID)
})

test("waitForAnalytics does not install a gtag stub when GA id is set", async () => {
  installWindow(undefined, { googleTagManager: { "GTM-TEST": {} } })
  assert.equal(isGtagReady(), false)
  assert.equal(isAnalyticsReady(), false)

  const ready = await waitForAnalytics(200)
  assert.equal(ready, false)
  assert.equal(isGtagReady(), false)
  assert.equal(isAnalyticsReady(), false)
})

test("GTM plus stub without gtag.js is not ready when GA id is set", async () => {
  const calls: GtagCall[] = []
  installWindow((...args) => {
    calls.push(args)
  }, { googleTagManager: { "GTM-TEST": {} } })

  assert.equal(isGtagReady(), true)
  assert.equal(isGtagJsLoaded(), false)
  assert.equal(isAnalyticsReady(), false)

  const ready = await waitForAnalytics(150)
  assert.equal(ready, false)
  assert.equal(calls.length, 0)
})

test("handoffQrLetakScan still attempts track after a wait timeout and keeps pending", async () => {
  const calls: GtagCall[] = []
  const storage = installWindow((...args) => {
    calls.push(args)
  })
  const win = globalThis as { window: { gtag?: unknown } }
  win.window.gtag = undefined

  await handoffQrLetakScan(undefined, 80)

  assert.equal(calls.length, 0)
  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
})

test("handoffQrLetakScan fires config then qr_letak once gtag.js is loaded", async () => {
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
    { gtagJsLoaded: true },
  )

  await handoffQrLetakScan(undefined, 200)

  const configIndex = calls.findIndex((call) => call[0] === "config")
  const qrIndex = calls.findIndex((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK)
  assert.ok(configIndex >= 0)
  assert.ok(qrIndex > configIndex)
  assert.equal(calls[configIndex]?.[1], GA_ID)
  assert.deepEqual(calls[configIndex]?.[2], { send_page_view: false })
  assert.equal(eventParams(calls).send_to, GA_ID)
  assert.equal(
    dataLayerHasQrCustomEvent(
      (globalThis as { window: { dataLayer: unknown[] } }).window.dataLayer,
    ),
    false,
  )
  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_SENT)
})

test("trackQrLetak hold without event_callback keeps pending so homepage can retry", async () => {
  const calls: GtagCall[] = []
  const storage = installWindow((...args) => {
    calls.push(args)
  }, { gtagJsLoaded: true })
  markQrLetakPending()

  let done = false
  trackQrLetak({
    onDone: () => {
      done = true
    },
  })

  await new Promise((resolve) => setTimeout(resolve, 80))
  assert.equal(done, false)
  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
  assert.ok(calls.some((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK))

  await new Promise((resolve) => setTimeout(resolve, QR_REDIRECT_HOLD_MS + 80))
  assert.equal(done, true)
  assert.equal(storage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
  assert.equal(hasPendingQrLetak(), true)
})

test("markGtagJsLoaded flips collector ready", () => {
  installWindow(() => {})
  assert.equal(isGtagJsLoaded(), false)
  assert.equal(isAnalyticsReady(), false)
  markGtagJsLoaded()
  assert.equal(isGtagJsLoaded(), true)
  assert.equal(isAnalyticsReady(), true)
})

test("gtm.js must not count as gtag.js loaded; gtag/js?id=G- must", () => {
  const gtmUrl = "https://www.googletagmanager.com/gtm.js?id=GTM-P6VZJXTQ"
  const gtagUrl = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  const adsUrl = "https://www.googletagmanager.com/gtag/js?id=AW-17721640948"
  const prefixOnly = "https://www.googletagmanager.com/gta"

  assert.equal(isGtagJsScriptUrl(gtmUrl, GA_ID), false)
  assert.equal(isGtagJsScriptUrl(gtmUrl), false)
  assert.equal(isGtagJsScriptUrl(prefixOnly, GA_ID), false)
  assert.equal(isGtagJsScriptUrl(adsUrl, GA_ID), false)
  assert.equal(isGtagJsScriptUrl(gtagUrl, GA_ID), true)
  assert.equal(gtmUrl.includes("/gtag/js"), false)

  installWindow(() => {}, {
    resourceEntries: [{ name: gtmUrl, initiatorType: "script", responseEnd: 42 }],
  })
  assert.equal(isGtagJsLoaded(), false)
  assert.equal(isAnalyticsReady(), false)

  installWindow(() => {}, {
    resourceEntries: [{ name: gtagUrl, initiatorType: "link", responseEnd: 42 }],
  })
  assert.equal(isGtagJsLoaded(), false)

  installWindow(() => {}, {
    resourceEntries: [{ name: adsUrl, initiatorType: "script", responseEnd: 42 }],
  })
  assert.equal(isGtagJsLoaded(), false)

  installWindow(() => {}, {
    resourceEntries: [{ name: gtagUrl, initiatorType: "script", responseEnd: 0 }],
  })
  assert.equal(isGtagJsLoaded(), true)
  assert.equal(isAnalyticsReady(), true)
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
      __autocashGtagJsLoaded?: boolean
    }
  }
  win.window.__autocashGtagJsLoaded = true
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

test("GTM-only deploys still require the container before a gtag stub is enough", async () => {
  delete process.env[GA_ENV]
  const calls: GtagCall[] = []
  installWindow((...args) => {
    calls.push(args)
  })

  assert.equal(isGtagReady(), true)
  assert.equal(isAnalyticsReady(), false)

  const ready = await waitForAnalytics(150)
  assert.equal(ready, false)

  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  assert.equal(calls.length, 0)
})

test("GoogleAnalytics component loads gtag.js with GTM, suppresses page_view, and marks load", () => {
  const gaSrc = readFileSync(
    fileURLToPath(new URL("../components/google-analytics.tsx", import.meta.url)),
    "utf8",
  )
  assert.match(gaSrc, /shouldLoadDirectGaSnippet/)
  assert.match(gaSrc, /googletagmanager\.com\/gtag\/js\?id=/)
  assert.match(gaSrc, /directGaConfigSnippet/)
  assert.match(gaSrc, /onLoad=\{markGtagJsLoaded\}/)
  assert.match(gaSrc, /onReady=\{markGtagJsLoaded\}/)
  assert.match(gaSrc, /typeof window\.gtag !== 'function'/)
  const stubIndex = gaSrc.indexOf('id="google-analytics"')
  const srcIndex = gaSrc.indexOf("googletagmanager.com/gtag/js?id=")
  assert.ok(stubIndex >= 0 && srcIndex > stubIndex)
  assert.equal(shouldLoadDirectGaSnippet(GA_ID, "GTM-P6VZJXTQ"), true)
  assert.match(
    readFileSync(fileURLToPath(new URL("./direct-ga-snippet.ts", import.meta.url)), "utf8"),
    /send_page_view: false/,
  )
})
