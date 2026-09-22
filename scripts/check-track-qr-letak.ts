/**
 * Hybrid /qr handoff: load gtag.js with GTM, wait for window.gtag (not GTM),
 * send_to GA4, no Custom Event.
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

const fakeWindow: {
  gtag?: typeof gtagMock
  dataLayer: unknown[]
  google_tag_manager?: Record<string, unknown>
  setTimeout: typeof setTimeout
  clearTimeout: typeof clearTimeout
  sessionStorage: MemoryStorage
} = {
  gtag: undefined,
  dataLayer,
  google_tag_manager: undefined,
  setTimeout: globalThis.setTimeout.bind(globalThis),
  clearTimeout: globalThis.clearTimeout.bind(globalThis),
  sessionStorage: storage,
}

;(globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow
;(globalThis as unknown as { sessionStorage: MemoryStorage }).sessionStorage = storage

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
  assert(gaSrc.includes("googletagmanager.com/gtag/js?id="), "GoogleAnalytics must load gtag.js")
  assert(gaSrc.includes("directGaConfigSnippet"), "GoogleAnalytics must use the shared config helper")
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
    QR_HOME_BEACON_WAIT_MS,
    QR_LETAK_PENDING,
    QR_LETAK_SENT,
    QR_LETAK_STORAGE_KEY,
    handoffQrLetakScan,
    hasPendingQrLetak,
    isAnalyticsReady,
    isGtagReady,
    markQrLetakPending,
    replayPendingQrLetak,
    trackQrLetak,
    waitForAnalytics,
  } = await import("../lib/track-qr-letak")

  assert(QR_ANALYTICS_READY_TIMEOUT_MS === 8000, "/qr wait must be 8s like the homepage beacon")
  assert(QR_HOME_BEACON_WAIT_MS === 8000, "homepage beacon wait must stay 8s")

  fakeWindow.gtag = gtagMock
  assert(isGtagReady(), "gtag function should count as gtag-ready")
  assert(isAnalyticsReady(), "GA measurement id must not require GTM to be ready")

  const adsOnly = await waitForAnalytics(150)
  assert(adsOnly, "waitForAnalytics must resolve on window.gtag when GA id is set")

  markQrLetakPending()
  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })

  const configIndex = gtagCalls.findIndex((call) => call[0] === "config")
  const qrIndex = gtagCalls.findIndex((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK)
  assert(configIndex >= 0, "must gtag('config', GA4 id) before the event")
  assert(gtagCalls[configIndex][1] === "G-DXBBY6TFGG", "config must target the GA4 measurement id")
  assert(
    eventParams(gtagCalls[configIndex])?.send_page_view === false,
    "GA4 config must not send a second page_view",
  )
  assert(qrIndex > configIndex, "config must run before qr_letak")
  const qrCall = gtagCalls[qrIndex]
  assert(qrCall, "must call gtag('event', 'qr_letak')")
  assert(eventParams(qrCall)?.send_to === "G-DXBBY6TFGG", "gtag event must send_to the GA4 id")
  assert(!dataLayerHasQrCustomEvent(), "must not dataLayer.push({ event: 'qr_letak' })")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_SENT, "successful gtag handoff marks sent")
  assert(!hasPendingQrLetak(), "pending must clear after gtag handoff")

  fakeWindow.gtag = undefined
  fakeWindow.google_tag_manager = { "GTM-TEST": {} }
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

  fakeWindow.gtag = gtagMock
  gtagCalls.length = 0
  await handoffQrLetakScan(undefined, 200)
  assert(
    gtagCalls.some((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK),
    "handoff must fire qr_letak once gtag exists, without waiting for GTM",
  )
  assert(!dataLayerHasQrCustomEvent(), "must not dataLayer.push({ event: 'qr_letak' })")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_SENT, "gtag handoff without GTM marks sent")

  console.log("ok")
}

void main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
