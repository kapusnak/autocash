import {
  gaGtagJsSrc,
  isGaMeasurementId,
  isQrGtagMessage,
  qrGtagDocument,
  QR_GTAG_MESSAGE_SOURCE,
} from "./qr-gtag-document.ts"

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

export { gaGtagJsSrc, QR_GTAG_MESSAGE_SOURCE }

/**
 * Wait for the GTM-free collector iframe `event_callback` (via postMessage)
 * before `/qr` redirects. Same budget as the old parent-page gtag wait.
 */
export const QR_ANALYTICS_READY_TIMEOUT_MS = 8000
export const QR_HOME_BEACON_WAIT_MS = 8000
/** Alias used by tests: redirect hold is the iframe callback wait. */
export const QR_REDIRECT_HOLD_MS = QR_ANALYTICS_READY_TIMEOUT_MS

type TrackQrLetakOptions = {
  onDone?: () => void
}

function gaMeasurementId(): string {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ""
}

function finishOnce(fn: (() => void) | undefined): () => void {
  let done = false
  return () => {
    if (done) return
    done = true
    fn?.()
  }
}

function gtagCampaign(): { source: string; medium: string; name: string } {
  return {
    source: QR_LETAK_CAMPAIGN.campaign_source,
    medium: QR_LETAK_CAMPAIGN.campaign_medium,
    name: QR_LETAK_CAMPAIGN.campaign_name,
  }
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
 * Fires exactly one `qr_letak` from a GTM-free `srcdoc` iframe whose HTML
 * queues `gtag('js')` / `config` / `event` **before** `gtag/js` — the official
 * order. Never `dataLayer.push({ event: 'qr_letak' })` on the parent (GTM tag
 * `GA4 - qr_letak` stays paused). Autocash has no Ads `AW-` collector.
 *
 * Marks the session flag sent **only** when the iframe reports `sent: true`
 * (`event_callback`). Redirect `onDone` still runs on timeout so `/qr` is not
 * stuck; pending stays so the homepage beacon can retry.
 */
export function trackQrLetak(options?: TrackQrLetakOptions): void {
  if (typeof window === "undefined" || typeof document === "undefined") {
    options?.onDone?.()
    return
  }

  const done = finishOnce(options?.onDone)
  const measurementId = gaMeasurementId()
  if (!isGaMeasurementId(measurementId)) {
    done()
    return
  }

  const acknowledge = finishOnce(() => {
    markQrLetakSent()
    done()
  })

  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.setAttribute("title", "")
  iframe.style.cssText =
    "position:absolute;width:0;height:0;border:0;overflow:hidden;visibility:hidden"

  let timer = 0
  const cleanup = finishOnce(() => {
    window.removeEventListener("message", onMessage)
    window.clearTimeout(timer)
    try {
      iframe.remove()
    } catch {
      iframe.parentNode?.removeChild(iframe)
    }
  })

  const onMessage = (event: MessageEvent) => {
    const origin = window.location?.origin
    if (origin && event.origin && event.origin !== origin) return
    if (!isQrGtagMessage(event.data)) return
    if (event.data.event !== GA_EVENT_QR_LETAK) return
    cleanup()
    if (event.data.sent) acknowledge()
    else done()
  }

  timer = window.setTimeout(() => {
    cleanup()
    done()
  }, QR_REDIRECT_HOLD_MS)

  window.addEventListener("message", onMessage)
  iframe.srcdoc = qrGtagDocument({
    measurementId,
    eventName: GA_EVENT_QR_LETAK,
    campaign: gtagCampaign(),
    callbackTimeoutMs: QR_REDIRECT_HOLD_MS,
  })

  const host = document.body ?? document.documentElement
  if (!host) {
    cleanup()
    done()
    return
  }
  host.appendChild(iframe)
}

/**
 * /qr path: queue pending, then fire via the GTM-free iframe. Redirect via
 * `onDone` after `event_callback` or the hold — hold without `sent` keeps
 * pending so the homepage beacon can retry.
 */
export async function handoffQrLetakScan(
  onDone?: () => void,
  _waitMs = QR_ANALYTICS_READY_TIMEOUT_MS,
): Promise<void> {
  markQrLetakPending()
  await new Promise<void>((resolve) => {
    trackQrLetak({
      onDone: () => {
        onDone?.()
        resolve()
      },
    })
  })
}

/**
 * Homepage safety net: replay `qr_letak` via the iframe if /qr never got
 * `event_callback` (pending flag still set).
 */
export function replayPendingQrLetak(_waitMs = QR_HOME_BEACON_WAIT_MS): void {
  if (typeof window === "undefined") return
  if (!hasPendingQrLetak()) return
  trackQrLetak()
}
