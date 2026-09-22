/** Flyer QR scan — keep this name in sync with sibling sites. */
export const GA_EVENT_QR_LETAK = "qr_letak"

export const QR_LETAK_CAMPAIGN = {
  campaign_source: "letak",
  campaign_medium: "qr",
  campaign_name: "letak_print",
} as const

export const QR_LETAK_STORAGE_KEY = "autocash_qr_letak"
export const QR_LETAK_PENDING = "pending"
export const QR_LETAK_SENT = "sent"

/**
 * Wait for a live `window.gtag` when the GA measurement ID is set.
 * Do not wait for GTM in that case — gtag.js from GoogleAnalytics is enough.
 * First visit / TCF cookie banner can delay the script — match the homepage
 * beacon so /qr does not redirect before the collector is up.
 */
export const QR_ANALYTICS_READY_TIMEOUT_MS = 8000
/** Pause after the collector is up so GA4 config / consent defaults can apply. */
export const QR_GTAG_SETTLE_MS = 400
/** Hold after `gtag('event')` so the hit can leave before `location.replace`. */
export const QR_REDIRECT_HOLD_MS = 2500
/** Homepage safety net uses the same wait as /qr — the page stays loaded. */
export const QR_HOME_BEACON_WAIT_MS = 8000

function gaMeasurementId(): string {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ""
}

function hasGa(): boolean {
  return Boolean(gaMeasurementId())
}

function hasGtm(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_GTM_ID?.trim())
}

function hasAnalytics(): boolean {
  return hasGa() || hasGtm()
}

type TrackQrLetakOptions = {
  onDone?: () => void
}

function finishOnce(fn: (() => void) | undefined): () => void {
  let done = false
  return () => {
    if (done) return
    done = true
    fn?.()
  }
}

function hasDataLayerEvent(name: string): boolean {
  const dataLayer = window.dataLayer
  if (!Array.isArray(dataLayer)) return false
  return dataLayer.some((entry) => {
    if (!entry || typeof entry !== "object") return false
    return (entry as { event?: unknown }).event === name
  })
}

export function isGtagReady(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function"
}

export function isGtmReady(): boolean {
  if (typeof window === "undefined") return false
  if (window.google_tag_manager && typeof window.google_tag_manager === "object") return true
  return hasDataLayerEvent("gtm.load")
}

/**
 * Ready to send `qr_letak`.
 * When the GA measurement ID is set: a live `window.gtag` from gtag.js is
 * enough — do not require `google_tag_manager` / `gtm.load`.
 * GTM-only deploys still wait for the container (Ads / partial gtag is not enough).
 */
export function isAnalyticsReady(): boolean {
  if (!isGtagReady()) return false
  if (hasGa()) return true
  if (hasGtm() && !isGtmReady()) return false
  return true
}

/**
 * Official gtag stub for GTM-only deploys (no measurement ID / no gtag.js).
 * Do not use this when HAS_GA — the real library must come from gtag.js.
 * Do not use this to send a Custom Event object.
 */
export function ensureGtag(): boolean {
  if (typeof window === "undefined") return false
  if (typeof window.gtag === "function") return true
  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments)
  }
  return typeof window.gtag === "function"
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function waitUntil(predicate: () => boolean, timeoutMs: number): Promise<boolean> {
  return new Promise((resolve) => {
    if (predicate()) {
      resolve(true)
      return
    }
    const started = Date.now()
    const tick = () => {
      if (predicate()) {
        resolve(true)
        return
      }
      if (Date.now() - started >= timeoutMs) {
        resolve(false)
        return
      }
      window.setTimeout(tick, 50)
    }
    tick()
  })
}

/**
 * Resolves true when `gtag('event')` can reach GA4.
 * With a measurement ID: wait for `typeof window.gtag === 'function'` only
 * (real library from gtag.js). Do not wait for GTM.
 * GTM-only: wait for `google_tag_manager` / `gtm.load`, then install a stub.
 * Settle is best-effort — a slow pause must not flip the result to false.
 */
export async function waitForAnalytics(
  timeoutMs = QR_ANALYTICS_READY_TIMEOUT_MS,
): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!hasAnalytics()) return false

  if (hasGa()) {
    const gtagUp = await waitUntil(isGtagReady, timeoutMs)
    if (!gtagUp) return false
  } else if (hasGtm()) {
    const gtmUp = await waitUntil(isGtmReady, timeoutMs)
    if (!gtmUp) return false
    ensureGtag()
  } else {
    return false
  }

  if (QR_GTAG_SETTLE_MS > 0) await delay(QR_GTAG_SETTLE_MS)
  if (hasGa()) return isGtagReady()
  if (!isGtagReady() && hasGtm() && isGtmReady()) ensureGtag()
  return isGtagReady() && (!hasGtm() || isGtmReady())
}

export function markQrLetakPending(): void {
  try {
    sessionStorage.setItem(QR_LETAK_STORAGE_KEY, QR_LETAK_PENDING)
  } catch {
    /* private mode / quota */
  }
}

export function markQrLetakSent(): void {
  try {
    sessionStorage.setItem(QR_LETAK_STORAGE_KEY, QR_LETAK_SENT)
  } catch {
    /* ignore */
  }
}

/** True when /qr queued a scan that has not been delivered via gtag yet. */
export function hasPendingQrLetak(): boolean {
  try {
    return sessionStorage.getItem(QR_LETAK_STORAGE_KEY) === QR_LETAK_PENDING
  } catch {
    return false
  }
}

export function clearQrLetakFlag(): void {
  try {
    sessionStorage.removeItem(QR_LETAK_STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

/**
 * `send_to` only delivers after this measurement ID is registered with
 * `gtag('config')`. Ads `AW-…` config is not enough. GTM still owns
 * page_view — this call is destination-only, once per page.
 */
function ensureGa4Configured(gtag: (...args: unknown[]) => void): string | undefined {
  const sendTo = gaMeasurementId()
  if (!sendTo) return undefined

  if (!window.__autocashGa4QrConfigured) {
    window.__autocashGa4QrConfigured = true
    gtag("config", sendTo, { send_page_view: false })
  }
  return sendTo
}

/**
 * Fires exactly one `qr_letak` via `gtag('event', …)` — never a GTM
 * `dataLayer.push({ event: 'qr_letak' })` Custom Event.
 *
 * When `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set, registers that destination
 * once with `gtag('config', id, { send_page_view: false })` then fires
 * the event with `send_to`. GTM still owns page_view.
 *
 * Marks the session flag sent only after `gtag('event', 'qr_letak')` was
 * actually invoked (`event_callback` or the hold elapsed). If gtag
 * is not ready, the pending flag stays so the homepage can retry.
 */
export function trackQrLetak(options?: TrackQrLetakOptions): void {
  if (typeof window === "undefined") {
    options?.onDone?.()
    return
  }

  const done = finishOnce(options?.onDone)
  if (!hasGa() && hasGtm() && isGtmReady()) ensureGtag()

  if (!isAnalyticsReady()) {
    done()
    return
  }

  const gtag = window.gtag
  if (typeof gtag !== "function") {
    done()
    return
  }

  const holdMs = hasAnalytics() ? QR_REDIRECT_HOLD_MS : 400
  const succeed = finishOnce(() => {
    markQrLetakSent()
    done()
  })

  const sendTo = ensureGa4Configured(gtag)
  const timer = window.setTimeout(succeed, holdMs)

  gtag("event", GA_EVENT_QR_LETAK, {
    ...QR_LETAK_CAMPAIGN,
    ...(sendTo ? { send_to: sendTo } : {}),
    transport_type: "beacon",
    event_callback: () => {
      window.clearTimeout(timer)
      succeed()
    },
    event_timeout: holdMs,
  })
}

/**
 * /qr path: wait for gtag (not GTM when the measurement ID is set), then
 * always attempt the gtag handoff. Redirect only via `onDone`
 * (event_callback / hold, or an immediate no-op that keeps the pending
 * flag when the event was never invoked).
 */
export async function handoffQrLetakScan(
  onDone?: () => void,
  waitMs = QR_ANALYTICS_READY_TIMEOUT_MS,
): Promise<void> {
  markQrLetakPending()
  await waitForAnalytics(waitMs)
  trackQrLetak({ onDone })
}

/**
 * Homepage safety net: after the wait, still attempt `trackQrLetak` when
 * the scan is pending — even if `waitForAnalytics` timed out. The track
 * call no-ops (and keeps pending) unless gtag is actually invoked.
 */
export function replayPendingQrLetak(waitMs = QR_HOME_BEACON_WAIT_MS): void {
  if (typeof window === "undefined") return
  if (!hasPendingQrLetak()) return
  void waitForAnalytics(waitMs).then(() => {
    if (!hasPendingQrLetak()) return
    trackQrLetak()
  })
}
