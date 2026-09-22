/**
 * Hybrid /qr handoff: isolated gtag.js (`l=autocashGaDl`) beside GTM, wait
 * for that collector (not GTM's default-layer gtag/js), send_to GA4, no
 * Custom Event, mark sent only on callback. Fire order: set, config, event.
 * Run: npx tsx scripts/check-track-qr-letak.ts
 */
process.env.NEXT_PUBLIC_GTM_ID = "GTM-TEST"
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = "G-DXBBY6TFGG"

class MemoryStorage {
  private store = new Map<string, string>()
  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }
  removeItem(key: string): void {
    this.store.delete(key)
  }
}

const storage = new MemoryStorage()
const dataLayer: unknown[] = []
const gtagCalls: unknown[][] = []

function gtagMock(...args: unknown[]) {
  gtagCalls.push(args)
  const params = args[2]
  if (params && typeof params === "object" && "event_callback" in params) {
    const cb = (params as { event_callback?: unknown }).event_callback
    if (typeof cb === "function") cb()
  }
}

function gtagStubNoCallback(...args: unknown[]) {
  gtagCalls.push(args)
}

const fakeWindow: {
  gtag?: typeof gtagMock
  __autocashGtag?: typeof gtagMock
  dataLayer: unknown[]
  google_tag_manager?: Record<string, unknown>
  __autocashGtagJsLoaded?: boolean
  setTimeout: typeof setTimeout
  clearTimeout: typeof clearTimeout
  sessionStorage: MemoryStorage
  performance: { getEntriesByType: (type: string) => PerformanceResourceTiming[] } | typeof performance
} = {
  gtag: undefined,
  __autocashGtag: undefined,
  dataLayer,
  google_tag_manager: undefined,
  __autocashGtagJsLoaded: undefined,
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  sessionStorage: storage,
  performance: {
    getEntriesByType: () => [],
  },
}

;(globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow
;(globalThis as unknown as { sessionStorage: MemoryStorage }).sessionStorage = storage
;(globalThis as unknown as { document: { getElementsByTagName: (tag: string) => { length: number } } }).document =
  {
    getElementsByTagName: () => ({ length: 0 }),
  }

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message)
}

function dataLayerHasQrCustomEvent(): boolean {
  return dataLayer.some((entry) => {
    return Boolean(
      entry &&
        typeof entry === "object" &&
        !("0" in (entry as object)) &&
        (entry as { event?: unknown }).event === "qr_letak",
    )
  })
}

function eventParams(call: unknown[]): Record<string, unknown> | undefined {
  const params = call[2]
  if (!params || typeof params !== "object") return undefined
  return params as Record<string, unknown>
}

async function main() {
  const { readFileSync } = await import("node:fs")
  const { fileURLToPath } = await import("node:url")
  const { directGaConfigSnippet, shouldLoadDirectGaSnippet } = await import(
    "../lib/direct-ga-snippet"
  )
  const gaSrc = readFileSync(
    fileURLToPath(new URL("../components/google-analytics.tsx", import.meta.url)),
    "utf8",
  )
  assert(gaSrc.includes("shouldLoadDirectGaSnippet"), "GoogleAnalytics must still gate on measurement id")
  assert(gaSrc.includes("gaGtagJsSrc"), "GoogleAnalytics must build gtag.js URL via helper")
  assert(gaSrc.includes("QR_GTAG_DATALAYER"), "hybrid must isolate measurement gtag.js from GTM dataLayer")
  assert(gaSrc.includes("__autocashGtag"), "hybrid must call isolated __autocashGtag, not window.gtag")
  assert(gaSrc.includes("__autocashGtmGtag"), "hybrid must save GTM window.gtag before isolated gtag.js")
  assert(gaSrc.includes('id="google-analytics-gtagjs"'), "measurement gtag.js script must have a stable id")
  assert(gaSrc.includes("onLoad={markGtagJsLoaded}"), "GoogleAnalytics must mark gtag.js load")
  assert(gaSrc.includes("onReady={markGtagJsLoaded}"), "GoogleAnalytics must mark gtag.js ready")
  assert(
    gaSrc.indexOf('id="google-analytics"') < gaSrc.indexOf("src={src}"),
    "stub snippet must be injected before gtag.js so a cached library is not overwritten",
  )
  assert(
    shouldLoadDirectGaSnippet("G-DXBBY6TFGG", "GTM-P6VZJXTQ") === true,
    "GoogleAnalytics must load gtag.js even when GTM is set",
  )
  assert(
    shouldLoadDirectGaSnippet("G-DXBBY6TFGG", "") === true,
    "GoogleAnalytics may load a direct snippet without GTM",
  )
  assert(
    directGaConfigSnippet("G-DXBBY6TFGG", "GTM-P6VZJXTQ").includes("send_page_view: false"),
    "GTM hybrid config must suppress page_view",
  )
  assert(
    shouldLoadDirectGaSnippet("", "GTM-P6VZJXTQ") === false,
    "GoogleAnalytics must no-op without a measurement id",
  )

  const {
    GA_EVENT_QR_LETAK,
    QR_ANALYTICS_READY_TIMEOUT_MS,
    QR_GTAG_DATALAYER,
    QR_HOME_BEACON_WAIT_MS,
    QR_LETAK_PENDING,
    QR_LETAK_SENT,
    QR_LETAK_STORAGE_KEY,
    QR_REDIRECT_HOLD_MS,
    gaGtagJsSrc,
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
  } = await import("../lib/track-qr-letak")

  assert(QR_ANALYTICS_READY_TIMEOUT_MS === 8000, "/qr wait must be 8s like the homepage beacon")
  assert(QR_HOME_BEACON_WAIT_MS === 8000, "homepage beacon wait must stay 8s")

  const gtmUrl = "https://www.googletagmanager.com/gtm.js?id=GTM-P6VZJXTQ"
  const sharedGtagUrl = "https://www.googletagmanager.com/gtag/js?id=G-DXBBY6TFGG"
  const isolatedUrl = gaGtagJsSrc("G-DXBBY6TFGG", QR_GTAG_DATALAYER)
  assert(!isGtagJsScriptUrl(gtmUrl, "G-DXBBY6TFGG", QR_GTAG_DATALAYER), "gtm.js must not count as gtag.js")
  assert(
    !isGtagJsScriptUrl(sharedGtagUrl, "G-DXBBY6TFGG", QR_GTAG_DATALAYER),
    "GTM default-layer gtag/js?id=G- must not count as the isolated collector",
  )
  assert(isGtagJsScriptUrl(isolatedUrl, "G-DXBBY6TFGG", QR_GTAG_DATALAYER), "isolated l=autocashGaDl gtag/js must count")

  fakeWindow.performance = {
    getEntriesByType: (type: string) =>
      type === "resource"
        ? [{ name: sharedGtagUrl, initiatorType: "script", responseEnd: 42 } as PerformanceResourceTiming]
        : [],
  }
  fakeWindow.__autocashGtagJsLoaded = undefined
  fakeWindow.gtag = gtagMock
  fakeWindow.__autocashGtag = gtagMock
  assert(!isGtagJsLoaded(), "shared-layer gtag/js must not flip gtag.js loaded beside GTM")
  fakeWindow.performance = {
    getEntriesByType: (type: string) =>
      type === "resource"
        ? [{ name: isolatedUrl, initiatorType: "script", responseEnd: 0 } as PerformanceResourceTiming]
        : [],
  }
  assert(!isGtagJsLoaded(), "in-flight isolated gtag/js (responseEnd 0) must not count as loaded")
  fakeWindow.performance = {
    getEntriesByType: (type: string) =>
      type === "resource"
        ? [{ name: isolatedUrl, initiatorType: "script", responseEnd: 42 } as PerformanceResourceTiming]
        : [],
  }
  assert(isGtagJsLoaded(), "isolated gtag/js?id=G-&l=autocashGaDl must count as loaded")
  fakeWindow.performance = { getEntriesByType: () => [] }
  fakeWindow.__autocashGtagJsLoaded = undefined

  fakeWindow.gtag = gtagMock
  fakeWindow.__autocashGtag = gtagMock
  fakeWindow.__autocashGtagJsLoaded = undefined
  assert(isGtagReady(), "inline stub should count as gtag-ready")
  assert(!isGtagJsLoaded(), "stub must not count as gtag.js loaded")
  assert(!isAnalyticsReady(), "GA measurement id must wait for executed gtag.js, not the stub")

  const stubOnly = await waitForAnalytics(150)
  assert(!stubOnly, "waitForAnalytics must not resolve on the inline stub")

  markQrLetakPending()
  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  assert(gtagCalls.length === 0, "must not call gtag while only the inline stub exists")
  assert(!dataLayerHasQrCustomEvent(), "stub-only miss must not push a Custom Event")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING, "stub-only miss keeps pending")

  fakeWindow.google_tag_manager = { "GTM-TEST": {} }
  const gtmStub = await waitForAnalytics(150)
  assert(!gtmStub, "GTM plus stub must not count as ready when GA id is set")
  fakeWindow.google_tag_manager = undefined

  markGtagJsLoaded()
  assert(isGtagJsLoaded(), "markGtagJsLoaded must flip the collector flag")
  assert(isAnalyticsReady(), "gtag function + gtag.js loaded must be ready without GTM")

  gtagCalls.length = 0
  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })

  const setIndex = gtagCalls.findIndex((call) => call[0] === "set")
  const configIndex = gtagCalls.findIndex((call) => call[0] === "config")
  const qrIndex = gtagCalls.findIndex((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK)
  assert(setIndex >= 0, "must gtag('set', { campaign }) like hnedpenize")
  assert(configIndex > setIndex, "must gtag('config', GA4 id) after campaign set")
  assert(gtagCalls[configIndex][1] === "G-DXBBY6TFGG", "config must target the GA4 measurement id")
  assert(
    eventParams(gtagCalls[configIndex])?.send_page_view === false,
    "GA4 config must not send a second page_view",
  )
  assert(qrIndex > configIndex, "config must run before qr_letak")
  const qrCall = gtagCalls[qrIndex]
  assert(qrCall, "must call gtag('event', 'qr_letak')")
  assert(eventParams(qrCall)?.send_to === "G-DXBBY6TFGG", "gtag event must send_to the GA4 id")
  assert(eventParams(qrCall)?.event_timeout === undefined, "must not set event_timeout that fakes a callback")
  assert(!dataLayerHasQrCustomEvent(), "must not dataLayer.push({ event: 'qr_letak' })")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_SENT, "successful gtag handoff marks sent")
  assert(!hasPendingQrLetak(), "pending must clear after gtag handoff")

  fakeWindow.gtag = undefined
  fakeWindow.__autocashGtag = undefined
  fakeWindow.google_tag_manager = { "GTM-TEST": {} }
  fakeWindow.__autocashGtagJsLoaded = undefined
  dataLayer.length = 0
  gtagCalls.length = 0
  assert(!isGtagReady(), "GTM object alone must not count as gtag-ready")
  assert(!isAnalyticsReady(), "GTM without gtag must not count as analytics-ready")

  const readyViaStub = await waitForAnalytics(200)
  assert(!readyViaStub, "must not install a gtag stub when GA measurement id is set")
  assert(!isGtagReady(), "must not invent window.gtag while waiting for gtag.js")

  markQrLetakPending()
  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  assert(gtagCalls.length === 0, "must not call gtag when it is missing")
  assert(!dataLayerHasQrCustomEvent(), "failed handoff must not push a Custom Event")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING, "failed gtag handoff keeps pending")

  fakeWindow.google_tag_manager = undefined
  dataLayer.length = 0
  gtagCalls.length = 0
  await handoffQrLetakScan(undefined, 80)
  assert(gtagCalls.length === 0, "handoff after timeout must not invent a gtag call")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING, "timeout handoff keeps pending")

  replayPendingQrLetak(80)
  await new Promise((resolve) => setTimeout(resolve, 200))
  assert(gtagCalls.length === 0, "homepage replay after timeout must not mark sent without gtag")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING, "homepage timeout keeps pending")

  fakeWindow.gtag = gtagStubNoCallback
  fakeWindow.__autocashGtag = gtagStubNoCallback
  fakeWindow.__autocashGtagJsLoaded = true
  gtagCalls.length = 0
  markQrLetakPending()
  let holdDone = false
  await new Promise<void>((resolve) => {
    const started = Date.now()
    trackQrLetak({
      onDone: () => {
        holdDone = true
        resolve()
      },
    })
    setTimeout(() => {
      if (!holdDone) resolve()
    }, QR_REDIRECT_HOLD_MS + 200)
    void started
  })
  assert(holdDone, "redirect hold must still finish when event_callback never runs")
  assert(
    gtagCalls.some((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK),
    "hold path must still invoke gtag('event', 'qr_letak')",
  )
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING, "timeout without callback keeps pending")

  fakeWindow.gtag = gtagMock
  fakeWindow.__autocashGtag = gtagMock
  gtagCalls.length = 0
  await handoffQrLetakScan(undefined, 200)
  assert(
    gtagCalls.some((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK),
    "handoff must fire qr_letak once gtag.js has loaded, without waiting for GTM",
  )
  assert(!dataLayerHasQrCustomEvent(), "must not dataLayer.push({ event: 'qr_letak' })")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_SENT, "gtag.js callback marks sent")

  console.log("ok")
}

void main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
