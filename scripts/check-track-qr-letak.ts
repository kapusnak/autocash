/**
 * /qr handoff: GTM-free iframe collector (stub+js+config+event queued before
 * gtag/js), postMessage sent only on event_callback, no Custom Event, no Ads
 * AW, no parent isolated l=autocashGaDl. Run: npx tsx scripts/check-track-qr-letak.ts
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
const iframes: Array<{ src: string; srcdoc: string; parentNode: unknown; remove: () => void }> = []
const messageListeners: Array<(event: { origin: string; data: unknown }) => void> = []
const timeouts: Array<{ id: number; fn: () => void; ms: number }> = []
let nextTimer = 1
const ORIGIN = "https://autocash.cz"

const fakeDocument = {
  body: {
    child: undefined as unknown,
    appendChild(el: { parentNode: unknown }) {
      this.child = el
      el.parentNode = this
    },
    removeChild(el: { parentNode: unknown }) {
      if (this.child === el) this.child = undefined
      el.parentNode = null
    },
  },
  documentElement: {
    appendChild(el: { parentNode: unknown }) {
      fakeDocument.body.appendChild(el)
    },
  },
  createElement(tag: string) {
    if (tag !== "iframe") throw new Error(`unexpected element ${tag}`)
    const el = {
      src: "",
      srcdoc: "",
      style: { cssText: "" },
      parentNode: null as unknown,
      setAttribute() {},
      remove() {
        if (this.parentNode && typeof (this.parentNode as { removeChild?: unknown }).removeChild === "function") {
          ;(this.parentNode as { removeChild: (node: unknown) => void }).removeChild(this)
        }
      },
    }
    iframes.push(el)
    return el
  },
  getElementsByTagName: () => ({ length: 0 }),
}

const fakeWindow = {
  dataLayer,
  gtag: undefined as ((...args: unknown[]) => void) | undefined,
  location: { origin: ORIGIN },
  setTimeout: (fn: () => void, ms: number) => {
    const id = nextTimer++
    timeouts.push({ id, fn, ms })
    return id
  },
  clearTimeout: (id: number) => {
    const index = timeouts.findIndex((item) => item.id === id)
    if (index >= 0) timeouts.splice(index, 1)
  },
  addEventListener: (type: string, fn: (event: { origin: string; data: unknown }) => void) => {
    if (type === "message") messageListeners.push(fn)
  },
  removeEventListener: (type: string, fn: (event: { origin: string; data: unknown }) => void) => {
    if (type !== "message") return
    const index = messageListeners.indexOf(fn)
    if (index >= 0) messageListeners.splice(index, 1)
  },
  sessionStorage: storage,
}

;(globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow
;(globalThis as unknown as { sessionStorage: MemoryStorage }).sessionStorage = storage
;(globalThis as unknown as { document: typeof fakeDocument }).document = fakeDocument

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

function dispatch(data: unknown, origin = ORIGIN) {
  for (const listener of [...messageListeners]) {
    listener({ origin, data })
  }
}

async function main() {
  const { readFileSync } = await import("node:fs")
  const { fileURLToPath } = await import("node:url")
  const { shouldLoadDirectGaSnippet } = await import("../lib/direct-ga-snippet")
  const gaSrc = readFileSync(
    fileURLToPath(new URL("../components/google-analytics.tsx", import.meta.url)),
    "utf8",
  )
  assert(gaSrc.includes("shouldLoadDirectGaSnippet"), "GoogleAnalytics must still gate on measurement id")
  assert(gaSrc.includes("gaGtagJsSrc"), "GoogleAnalytics must build gtag.js URL via helper")
  assert(!gaSrc.includes("autocashGaDl"), "must not isolate a custom dataLayer beside GTM")
  assert(!gaSrc.includes("__autocashGtag"), "must not use __autocashGtag on the parent page")
  assert(
    shouldLoadDirectGaSnippet("G-DXBBY6TFGG", "GTM-P6VZJXTQ") === false,
    "GoogleAnalytics must no-op when GTM is set (hnedpenize)",
  )
  assert(shouldLoadDirectGaSnippet("G-DXBBY6TFGG", "") === true, "GA-only deploys may still load gtag.js")
  assert(shouldLoadDirectGaSnippet("", "GTM-P6VZJXTQ") === false, "no-op without a measurement id")

  const trackSrc = readFileSync(
    fileURLToPath(new URL("../lib/track-qr-letak.ts", import.meta.url)),
    "utf8",
  )
  assert(trackSrc.includes("iframe.src = QR_GTAG_COLLECT_PATH"), "iframe must navigate to /qr-gtag")
  assert(!trackSrc.includes(".srcdoc"), "must not use srcdoc (about:srcdoc never hit collect)")
  assert(!trackSrc.includes(".remove("), "must not tear down the iframe before collect leaves")

  const {
    GA_EVENT_QR_LETAK,
    QR_ANALYTICS_READY_TIMEOUT_MS,
    QR_COLLECT_FLUSH_MS,
    QR_GTAG_COLLECT_PATH,
    QR_GTAG_MESSAGE_SOURCE,
    QR_HOME_BEACON_WAIT_MS,
    QR_LETAK_PENDING,
    QR_LETAK_SENT,
    QR_LETAK_STORAGE_KEY,
    QR_REDIRECT_HOLD_MS,
    gaGtagJsSrc,
    handoffQrLetakScan,
    hasPendingQrLetak,
    markQrLetakPending,
    replayPendingQrLetak,
    trackQrLetak,
  } = await import("../lib/track-qr-letak")
  const { qrGtagDocument } = await import("../lib/qr-gtag-document")

  assert(QR_ANALYTICS_READY_TIMEOUT_MS === 8000, "/qr wait must be 8s")
  assert(QR_HOME_BEACON_WAIT_MS === 8000, "homepage beacon wait must stay 8s")
  assert(QR_REDIRECT_HOLD_MS === 8000, "iframe callback wait must be 8s")
  assert(QR_COLLECT_FLUSH_MS === 800, "must delay redirect after callback so collect can leave")
  assert(QR_GTAG_COLLECT_PATH === "/qr-gtag", "iframe must load the GTM-free collector route")
  assert(!new URL(gaGtagJsSrc("G-DXBBY6TFGG")).searchParams.has("l"), "collector gtag.js must use the default dataLayer")

  const html = qrGtagDocument({
    measurementId: "G-DXBBY6TFGG",
    eventName: GA_EVENT_QR_LETAK,
    campaign: { source: "letak", medium: "qr", name: "letak_print" },
    callbackTimeoutMs: 8000,
  })
  assert(html.indexOf("function gtag()") < html.indexOf("gtag/js?id=G-DXBBY6TFGG"), "stub must queue before gtag/js")
  assert(html.includes('gtag("consent", "default"'), "collector must set consent so hits use google-analytics collect")
  assert(html.includes('gtag("js", new Date())'), "must set the official js timestamp")
  assert(html.includes('gtag("event", payload.eventName'), "must gtag event qr_letak")
  assert(html.includes("send_to"), "event must send_to the GA4 id")
  assert(!html.includes("GTM-"), "collector must not load GTM")
  assert(!html.includes("AW-"), "collector must not use Ads AW")
  assert(!html.includes("autocashGaDl"), "collector must not use the #21 isolated layer")

  markQrLetakPending()
  let holdDone = false
  trackQrLetak({
    onDone: () => {
      holdDone = true
    },
  })
  assert(iframes.length === 1, "must create the collector iframe")
  assert(iframes[0]!.src === QR_GTAG_COLLECT_PATH, "iframe must load /qr-gtag")
  assert(!dataLayerHasQrCustomEvent(), "must not dataLayer.push({ event: 'qr_letak' })")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING, "must not mark sent before callback")

  const hold = timeouts.find((item) => item.ms === QR_REDIRECT_HOLD_MS)
  assert(hold, "must schedule a redirect hold")
  hold.fn()
  assert(holdDone, "redirect hold must still finish when event_callback never runs")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING, "timeout without callback keeps pending")

  iframes.length = 0
  messageListeners.length = 0
  timeouts.length = 0
  await new Promise<void>((resolve) => {
    const pending = handoffQrLetakScan(() => resolve())
    dispatch({ source: QR_GTAG_MESSAGE_SOURCE, event: GA_EVENT_QR_LETAK, sent: true })
    const flush = timeouts.find((item) => item.ms === QR_COLLECT_FLUSH_MS)
    assert(flush, "callback must schedule a collect flush before redirect")
    flush.fn()
    void pending
  })
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_SENT, "callback marks sent")
  assert(!hasPendingQrLetak(), "pending must clear after callback")
  assert(!dataLayerHasQrCustomEvent(), "must not dataLayer.push({ event: 'qr_letak' })")

  storage.setItem(QR_LETAK_STORAGE_KEY, QR_LETAK_PENDING)
  iframes.length = 0
  replayPendingQrLetak()
  assert(iframes.length === 1, "homepage replay must create the collector iframe")
  dispatch({ source: QR_GTAG_MESSAGE_SOURCE, event: GA_EVENT_QR_LETAK, sent: true })
  const replayFlush = timeouts.find((item) => item.ms === QR_COLLECT_FLUSH_MS)
  assert(replayFlush, "homepage replay must flush collect before considering done")
  replayFlush.fn()
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_SENT, "homepage callback marks sent")

  console.log("ok")
}

void main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
