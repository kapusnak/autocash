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

const fakeWindow = {
  gtag: undefined as undefined | typeof gtagMock,
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

  assert(!isGtagReady(), "GTM object alone must not count as ready")

  fakeWindow.gtag = gtagMock
  assert(isGtagReady(), "window.gtag function must count as ready")

  markQrLetakPending()
  assert(hasPendingQrLetak(), "pending flag should be set")

  await new Promise<void>((resolve) => {
    trackQrLetak({
      onDone: () => resolve(),
    })
  })

  assert(
    gtagCalls.some((call) => call[0] === "event" && call[1] === GA_EVENT_QR_LETAK),
    "must call gtag('event', 'qr_letak')",
  )
  assert(
    !dataLayer.some((entry) => {
      return Boolean(
        entry && typeof entry === "object" && (entry as { event?: unknown }).event === GA_EVENT_QR_LETAK,
      )
    }),
    "must not dataLayer.push({ event: 'qr_letak' })",
  )
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_SENT, "successful gtag handoff marks sent")
  assert(!hasPendingQrLetak(), "pending must clear after gtag handoff")

  fakeWindow.gtag = undefined
  gtagCalls.length = 0
  dataLayer.length = 0
  markQrLetakPending()
  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  assert(gtagCalls.length === 0, "missing gtag must not invent a gtag call")
  assert(storage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING, "failed handoff keeps pending")

  fakeWindow.gtag = gtagMock
  const ready = await waitForAnalytics(200)
  assert(ready, "waitForAnalytics should resolve once gtag exists")

  console.log("ok")
}

void main()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    console.error(error)
    process.exit(1)
  })
