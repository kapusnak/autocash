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
 * Wait for `window.gtag` (GTM injects it; first visit / cookie banner can delay).
 * Do not treat the GTM container alone as ready — this path sends via gtag only.
 */
export const QR_ANALYTICS_READY_TIMEOUT_MS = 4000
/** Brief pause after gtag appears so GA4 config / consent defaults can apply. */
export const QR_GTAG_SETTLE_MS = 300
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

export function isGtagReady(): boolean {
  return typeof window !== "undefined" && typeof window.gtag === "function"
}

/** @deprecated use isGtagReady — ready means `window.gtag`, not the GTM object. */
export function isAnalyticsReady(): boolean {
  return isGtagReady()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

/**
 * Resolves true when `window.gtag` is a function (then settles briefly).
 * False if analytics is unset or gtag never appears within `timeoutMs`.
 */
export async function waitForAnalytics(
  timeoutMs = QR_ANALYTICS_READY_TIMEOUT_MS,
): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!HAS_ANALYTICS) return false

  const appeared = await new Promise<boolean>((resolve) => {
    if (isGtagReady()) {
      resolve(true)
      return
    }
    const started = Date.now()
    const tick = () => {
      if (isGtagReady()) {
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
