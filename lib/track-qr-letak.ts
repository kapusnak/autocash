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

/** Wait for GTM container / gtag.js to appear before pushing the event. */
export const QR_ANALYTICS_READY_TIMEOUT_MS = 2500
/** Dwell after push so GTM can process CE - qr_letak before navigation. */
export const QR_REDIRECT_HOLD_MS = 2000

const HAS_GA = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)
const HAS_GTM = Boolean(process.env.NEXT_PUBLIC_GTM_ID)
const HAS_ANALYTICS = HAS_GA || HAS_GTM

type TrackQrLetakOptions = {
  onDone?: () => void
}

function hasDataLayerEvent(name: string): boolean {
  const dataLayer = window.dataLayer
  if (!Array.isArray(dataLayer)) return false
  return dataLayer.some((entry) => {
    if (!entry || typeof entry !== "object") return false
    return (entry as { event?: unknown }).event === name
  })
}

export function isAnalyticsReady(): boolean {
  if (typeof window === "undefined") return false
  if (typeof window.gtag === "function") return true
  if (window.google_tag_manager && typeof window.google_tag_manager === "object") return true
  // gtm.js is the snippet bootstrap; gtm.load means the container finished loading.
  return hasDataLayerEvent("gtm.load")
}

/**
 * Resolves when gtag or the GTM container is ready, or when `timeoutMs` elapses.
 * Must wait for GTM even when `NEXT_PUBLIC_GA_MEASUREMENT_ID` is unset.
 */
export function waitForAnalytics(timeoutMs = QR_ANALYTICS_READY_TIMEOUT_MS): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false)
  if (!HAS_ANALYTICS) return Promise.resolve(false)
  if (isAnalyticsReady()) return Promise.resolve(true)

  return new Promise((resolve) => {
    const started = Date.now()
    const tick = () => {
      if (isAnalyticsReady()) {
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

/** True when /qr queued a scan that has not been delivered yet. */
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
 * Fires `qr_letak` on exactly one pipe so GA4 does not double-count:
 * - GTM configured → `dataLayer.push({ event: 'qr_letak' })` only (CE + GA4 Event tag)
 * - GTM off, direct GA measurement ID → `gtag('event', 'qr_letak')` only
 *
 * Marks the sessionStorage flag sent as soon as that handoff succeeds so the
 * homepage beacon does not fire a second copy.
 */
export function trackQrLetak(options?: TrackQrLetakOptions): void {
  if (typeof window === "undefined") return

  let finished = false
  const done = () => {
    if (finished) return
    finished = true
    options?.onDone?.()
  }

  const holdMs = HAS_ANALYTICS ? QR_REDIRECT_HOLD_MS : 400
  window.setTimeout(done, holdMs)

  if (HAS_GTM) {
    window.dataLayer = window.dataLayer || []
    window.dataLayer.push({
      event: GA_EVENT_QR_LETAK,
      ...QR_LETAK_CAMPAIGN,
    })
    markQrLetakSent()
    return
  }

  const gtag = window.gtag
  if (HAS_GA && typeof gtag === "function") {
    gtag("set", QR_LETAK_CAMPAIGN)
    gtag("event", GA_EVENT_QR_LETAK, {
      ...QR_LETAK_CAMPAIGN,
      event_callback: done,
      event_timeout: holdMs,
    })
    markQrLetakSent()
  }
}
