/**
 * Hybrid /qr handoff: gtag event only, no GTM Custom Event, pending only on miss.
 * Run: npx tsx scripts/check-track-qr-letak.ts
 */
process.env.NEXT_PUBLIC_GTM_ID = "GTM-TEST"
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = ""

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
  google_tag_manager: { "GTM-TEST": {} },
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

async function main() {
  const {
    GA_EVENT_QR_LETAK,
    QR_LETAK_PENDING,
    QR_LETAK_SENT,
    QR_LETAK_STORAGE_KEY,
    hasPendingQrLetak,
    isGtagReady,
    markQrLetakPending,
    trackQrLetak,
    waitForAnalytics,
  } = await import("../lib/track-qr-letak")

  assert(!isGtagReady(), "GTM object alone must not count as gtag-ready")

  const readyViaStub = await waitForAnalytics(200)
  assert(readyViaStub, "waitForAnalytics should install a gtag stub after GTM is up")
  assert(isGtagReady(), "stub must define window.gtag")

  markQrLetakPending()
  assert(hasPendingQrLetak(), "pending flag should be set")

  fakeWindow.gtag = gtagMock
  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })

  assert(
    gtagCalls.some((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK),
    "must call gtag('event', 'qr_letak')",
  )
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

  console.log("ok")
}

void main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
