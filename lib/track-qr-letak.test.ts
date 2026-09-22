import assert from "node:assert/strict"
import { afterEach, beforeEach, test } from "node:test"
import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import {
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
} from "./track-qr-letak.ts"
import { shouldLoadDirectGaSnippet } from "./direct-ga-snippet.ts"

const GA_ENV = "NEXT_PUBLIC_GA_MEASUREMENT_ID"
const GTM_ENV = "NEXT_PUBLIC_GTM_ID"
const GA_ID = "G-DXBBY6TFGG"
const ORIGIN = "https://autocash.cz"

type IframeMock = {
  tagName: string
  src: string
  srcdoc: string
  style: { cssText: string }
  setAttribute: (name: string, value: string) => void
  remove: () => void
  parentNode: { removeChild: (el: IframeMock) => void } | null
  attrs: Record<string, string>
}

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

function installWindow() {
  const sessionStorage = mockSessionStorage()
  const iframes: IframeMock[] = []
  const messageListeners: Array<(event: { origin: string; data: unknown }) => void> = []
  const timeouts: Array<{ id: number; fn: () => void; ms: number }> = []
  let nextTimer = 1
  const dataLayer: unknown[] = []

  const documentMock = {
    body: {
      child: undefined as IframeMock | undefined,
      appendChild(el: IframeMock) {
        this.child = el
        el.parentNode = this
      },
      removeChild(el: IframeMock) {
        if (this.child === el) this.child = undefined
        el.parentNode = null
      },
    },
    documentElement: {
      appendChild(el: IframeMock) {
        documentMock.body.appendChild(el)
      },
    },
    createElement(tag: string) {
      const el: IframeMock = {
        tagName: tag,
        src: "",
        srcdoc: "",
        style: { cssText: "" },
        attrs: {},
        parentNode: null,
        setAttribute(name, value) {
          this.attrs[name] = value
        },
        remove() {
          this.parentNode?.removeChild(this)
        },
      }
      iframes.push(el)
      return el
    },
    getElementsByTagName: () => ({ length: 0 }),
  }

  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      dataLayer,
      gtag: undefined,
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
      sessionStorage,
    },
  })
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: sessionStorage,
  })
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: documentMock,
  })

  return {
    sessionStorage,
    iframes,
    messageListeners,
    timeouts,
    dataLayer,
    dispatch(data: unknown, origin = ORIGIN) {
      for (const listener of [...messageListeners]) {
        listener({ origin, data })
      }
    },
    flushHold() {
      const hold = timeouts.find((item) => item.ms === QR_REDIRECT_HOLD_MS)
      assert.ok(hold, "expected iframe hold timer")
      hold.fn()
    },
    flushCollect() {
      const flush = timeouts.find((item) => item.ms === QR_COLLECT_FLUSH_MS)
      assert.ok(flush, "expected collect flush timer")
      flush.fn()
    },
  }
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

test("/qr iframe wait is 8s like the homepage beacon", () => {
  assert.equal(QR_ANALYTICS_READY_TIMEOUT_MS, 8000)
  assert.equal(QR_HOME_BEACON_WAIT_MS, 8000)
  assert.equal(QR_REDIRECT_HOLD_MS, 8000)
  assert.equal(QR_COLLECT_FLUSH_MS, 800)
  assert.equal(QR_GTAG_COLLECT_PATH, "/qr-gtag")
})

test("trackQrLetak loads /qr-gtag iframe, keeps it after callback, then flushes", async () => {
  const env = installWindow()
  markQrLetakPending()

  let done = false
  const finished = new Promise<void>((resolve) => {
    trackQrLetak({
      onDone: () => {
        done = true
        resolve()
      },
    })
  })

  assert.equal(env.iframes.length, 1)
  assert.equal(env.iframes[0]?.src, QR_GTAG_COLLECT_PATH)
  assert.equal(dataLayerHasQrCustomEvent(env.dataLayer), false)
  assert.equal(env.sessionStorage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)

  env.dispatch({
    source: QR_GTAG_MESSAGE_SOURCE,
    event: GA_EVENT_QR_LETAK,
    sent: true,
  })
  assert.equal(env.sessionStorage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_SENT)
  assert.equal(done, false)
  assert.equal(env.iframes[0]?.parentNode !== null, true)

  env.flushCollect()
  await finished
  assert.equal(done, true)
  assert.equal(hasPendingQrLetak(), false)
  assert.equal(dataLayerHasQrCustomEvent(env.dataLayer), false)
  assert.ok(env.iframes[0]?.parentNode, "must not iframe.remove() before redirect")
})

test("trackQrLetak without a measurement id does not mark the scan sent", async () => {
  delete process.env[GA_ENV]
  const env = installWindow()
  markQrLetakPending()

  await new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })

  assert.equal(env.iframes.length, 0)
  assert.equal(env.sessionStorage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
  assert.equal(hasPendingQrLetak(), true)
})

test("hold without event_callback keeps pending so homepage can retry", async () => {
  const env = installWindow()
  markQrLetakPending()

  let done = false
  trackQrLetak({
    onDone: () => {
      done = true
    },
  })

  assert.equal(done, false)
  assert.equal(env.iframes.length, 1)
  assert.equal(env.iframes[0]?.src, QR_GTAG_COLLECT_PATH)

  env.flushHold()
  assert.equal(done, true)
  assert.equal(env.sessionStorage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
  assert.equal(hasPendingQrLetak(), true)
  assert.equal(dataLayerHasQrCustomEvent(env.dataLayer), false)
})

test("iframe sent:false keeps pending", async () => {
  const env = installWindow()
  markQrLetakPending()

  const finished = new Promise<void>((resolve) => {
    trackQrLetak({ onDone: () => resolve() })
  })
  env.dispatch({
    source: QR_GTAG_MESSAGE_SOURCE,
    event: GA_EVENT_QR_LETAK,
    sent: false,
  })
  await finished
  assert.equal(env.sessionStorage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
})

test("foreign postMessage is ignored", () => {
  const env = installWindow()
  markQrLetakPending()
  trackQrLetak()
  env.dispatch({ source: "other", event: GA_EVENT_QR_LETAK, sent: true })
  env.dispatch(
    { source: QR_GTAG_MESSAGE_SOURCE, event: GA_EVENT_QR_LETAK, sent: true },
    "https://example.com",
  )
  assert.equal(env.sessionStorage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
  assert.equal(env.messageListeners.length, 1)
})

test("handoffQrLetakScan fires the iframe collector and does not use window.gtag", async () => {
  const env = installWindow()
  const gtagCalls: unknown[][] = []
  ;(globalThis as { window: { gtag?: (...args: unknown[]) => void } }).window.gtag = (...args) => {
    gtagCalls.push(args)
  }

  const handoff = handoffQrLetakScan()
  assert.equal(env.sessionStorage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_PENDING)
  assert.equal(env.iframes.length, 1)
  assert.equal(env.iframes[0]?.src, QR_GTAG_COLLECT_PATH)
  assert.equal(gtagCalls.length, 0)

  env.dispatch({ source: QR_GTAG_MESSAGE_SOURCE, event: GA_EVENT_QR_LETAK, sent: true })
  env.flushCollect()
  await handoff
  assert.equal(env.sessionStorage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_SENT)
  assert.equal(gtagCalls.length, 0)
  assert.equal(dataLayerHasQrCustomEvent(env.dataLayer), false)
})

test("replayPendingQrLetak no-ops without pending and retries via iframe when pending", async () => {
  const env = installWindow()
  replayPendingQrLetak()
  assert.equal(env.iframes.length, 0)

  markQrLetakPending()
  replayPendingQrLetak()
  assert.equal(env.iframes.length, 1)
  env.dispatch({ source: QR_GTAG_MESSAGE_SOURCE, event: GA_EVENT_QR_LETAK, sent: true })
  env.flushCollect()
  assert.equal(env.sessionStorage.getItem(QR_LETAK_STORAGE_KEY), QR_LETAK_SENT)
})

test("GoogleAnalytics no-ops beside GTM and does not isolate a custom dataLayer", () => {
  const gaSrc = readFileSync(
    fileURLToPath(new URL("../components/google-analytics.tsx", import.meta.url)),
    "utf8",
  )
  assert.match(gaSrc, /shouldLoadDirectGaSnippet/)
  assert.match(gaSrc, /gaGtagJsSrc/)
  assert.equal(gaSrc.includes("autocashGaDl"), false)
  assert.equal(gaSrc.includes("__autocashGtag"), false)
  assert.equal(gaSrc.includes("QR_GTAG_DATALAYER"), false)
  assert.equal(shouldLoadDirectGaSnippet(GA_ID, "GTM-P6VZJXTQ"), false)
  assert.equal(shouldLoadDirectGaSnippet(GA_ID, ""), true)
  assert.equal(new URL(gaGtagJsSrc(GA_ID)).searchParams.has("l"), false)
})

test("qr redirect still skips bots and webdriver in the landing component", () => {
  const src = readFileSync(
    fileURLToPath(new URL("../app/qr/qr-letak-redirect.tsx", import.meta.url)),
    "utf8",
  )
  assert.match(src, /isCrawlerUserAgent/)
  assert.match(src, /navigator\.webdriver/)
  assert.match(src, /handoffQrLetakScan/)
})

test("fire path loads /qr-gtag, does not srcdoc, and does not iframe.remove", () => {
  const src = readFileSync(fileURLToPath(new URL("./track-qr-letak.ts", import.meta.url)), "utf8")
  assert.match(src, /QR_GTAG_COLLECT_PATH/)
  assert.match(src, /iframe\.src = QR_GTAG_COLLECT_PATH/)
  assert.match(src, /QR_COLLECT_FLUSH_MS/)
  assert.equal(src.includes(".srcdoc"), false)
  assert.equal(src.includes(".remove("), false)
})
