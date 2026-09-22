/**
 * Hybrid /qr handoff: wait for gtag AND GTM, send_to GA4, no Custom Event.
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
  sessionStorage: MemoryStorage
} = {
  gtag: undefined,
  dataLayer,
  google_tag_manager: undefined,
  setTimeout: globalThis.setTimeout.bind(globalThis),
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
  const gaSrc = readFileSync(
    fileURLToPath(new URL("../components/google-analytics.tsx", import.meta.url)),
    "utf8",
  )
  assert(
    gaSrc.includes("send_page_view: false"),
    "GTM-owned pageviews must not get a second gtag config page_view",
  )

  const {
    GA_EVENT_QR_LETAK,
    QR_LETAK_PENDING,
    QR_LETAK_SENT,
    QR_LETAK_STORAGE_KEY,
    hasPendingQrLetak,
    isAnalyticsReady,
    isGtagReady,
    markQrLetakPending,
    trackQrLetak,
    waitForAnalytics,
  } = await import("../lib/track-qr-letak")

  fakeWindow.gtag = gtagMock
  assert(isGtagReady(), "Ads gtag function should count as gtag-ready")
  assert(!isAnalyticsReady(), "Ads/partial gtag alone must not count as analytics-ready")

  const adsOnly = await waitForAnalytics(150)
  assert(!adsOnly, "waitForAnalytics must not resolve on Ads gtag before GTM")
  assert(gtagCalls.length === 0, "must not fire while waiting for GTM")

  markQrLetakPending()
  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  assert(gtagCalls.length === 0, "must not call gtag when only Ads/partial gtag exists")
  assert(!dataLayerHasQrCustomEvent(), "Ads-only miss must not push a Custom Event")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING, "Ads-only miss keeps pending")

  fakeWindow.gtag = undefined
  fakeWindow.google_tag_manager = { "GTM-TEST": {} }
  assert(!isGtagReady(), "GTM object alone must not count as gtag-ready")
  assert(!isAnalyticsReady(), "GTM without gtag must not count as analytics-ready")

  const readyViaStub = await waitForAnalytics(200)
  assert(readyViaStub, "waitForAnalytics should install a gtag stub after GTM is up")
  assert(isGtagReady(), "stub must define window.gtag")
  assert(isAnalyticsReady(), "gtag + GTM must count as analytics-ready")

  assert(hasPendingQrLetak(), "pending flag should still be set")

  fakeWindow.gtag = gtagMock
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
  fakeWindow.google_tag_manager = undefined
  dataLayer.length = 0
  gtagCalls.length = 0
  markQrLetakPending()
  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  assert(gtagCalls.length === 0, "must not call gtag when it is missing and GTM is not ready")
  assert(!dataLayerHasQrCustomEvent(), "failed handoff must not push a Custom Event")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING, "failed gtag handoff keeps pending")

  fakeWindow.gtag = gtagMock
  dataLayer.push({ event: "gtm.load" })
  assert(isAnalyticsReady(), "dataLayer gtm.load plus gtag must count as ready")

  console.log("ok")
}

void main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
