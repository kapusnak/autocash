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
 * Wait for `window.gtag` or the GTM container (this property does not publish
 * gtag itself). First visit / TCF cookie banner can delay the container.
 */
export const QR_ANALYTICS_READY_TIMEOUT_MS = 4000
/** Pause after the collector is up so GA4 config / consent defaults can apply. */
export const QR_GTAG_SETTLE_MS = 400
/** Hold after `gtag('event')` so the hit can leave before `location.replace`. */
export const QR_REDIRECT_HOLD_MS = 2500
/** Homepage safety net can wait longer — the page stays loaded. */
export const QR_HOME_BEACON_WAIT_MS = 8000

const HAS_GA = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim())
const HAS_GTM = Boolean(process.env.NEXT_PUBLIC_GTM_ID?.trim())
const HAS_ANALYTICS = HAS_GA || HAS_GTM

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

/** Ready to call `gtag('event')` — a live function, not merely the GTM object. */
export function isAnalyticsReady(): boolean {
  return isGtagReady()
}

/**
 * Official gtag stub. This GTM container does not assign `window.gtag`; the
 * GA4 Google tag still processes `dataLayer.push(arguments)` after load.
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

function collectorIsUp(): boolean {
  if (isGtagReady()) return true
  if (HAS_GTM && isGtmReady()) return true
  return false
}

/**
 * Resolves true when `gtag('event')` can be called.
 * Waits for `window.gtag`, or for the GTM container and then installs the stub.
 */
export async function waitForAnalytics(
  timeoutMs = QR_ANALYTICS_READY_TIMEOUT_MS,
): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!HAS_ANALYTICS) return false

  const appeared = await new Promise<boolean>((resolve) => {
    if (collectorIsUp()) {
      resolve(true)
      return
    }
    const started = Date.now()
    const tick = () => {
      if (collectorIsUp()) {
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

  if (!appeared) return false
  if (!isGtagReady() && HAS_GTM && isGtmReady()) ensureGtag()
  if (!isGtagReady()) return false
  if (QR_GTAG_SETTLE_MS > 0) await delay(QR_GTAG_SETTLE_MS)
  return isGtagReady()
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
 * Fires exactly one `qr_letak` via `gtag('event', …)` — never a GTM
 * `dataLayer.push({ event: 'qr_letak' })` Custom Event.
 *
 * Marks the session flag sent only after a successful gtag handoff
 * (`event_callback` or the hold elapsed after gtag was actually called).
 * If gtag is missing, the pending flag stays so the homepage can retry once.
 */
export function trackQrLetak(options?: TrackQrLetakOptions): void {
  if (typeof window === "undefined") {
    options?.onDone?.()
    return
  }

  const done = finishOnce(options?.onDone)
  if (!isGtagReady() && HAS_GTM && isGtmReady()) ensureGtag()
  const gtag = window.gtag

  if (typeof gtag !== "function") {
    done()
    return
  }

  const holdMs = HAS_ANALYTICS ? QR_REDIRECT_HOLD_MS : 400
  const succeed = finishOnce(() => {
    markQrLetakSent()
    done()
  })

  window.setTimeout(succeed, holdMs)

  gtag("event", GA_EVENT_QR_LETAK, {
    ...QR_LETAK_CAMPAIGN,
    event_callback: succeed,
    event_timeout: holdMs,
  })
}
