import {
  gaGtagJsSrc,
  isGaMeasurementId,
  isQrGtagMessage,
  QR_GTAG_MESSAGE_SOURCE,
} from "./qr-gtag-document.ts"

/** Field-leaflet QR scan — keep this name in sync with sibling sites. */
export const GA_EVENT_QR_LETAK = "qr_letak"
/** Postal-leaflet QR scan. Separate from `qr_letak` so the two flyers count apart. */
export const GA_EVENT_QR_POSTA = "qr_posta"

export type QrFlyerEventName = typeof GA_EVENT_QR_LETAK | typeof GA_EVENT_QR_POSTA

export function isQrFlyerEventName(value: string): value is QrFlyerEventName {
  return value === GA_EVENT_QR_LETAK || value === GA_EVENT_QR_POSTA
}

/**
 * `/qr-gtag` query `event`. Missing param stays the field leaflet so `/qr`
 * can keep loading `/qr-gtag` with no query. Any other value is rejected.
 */
export function qrFlyerEventFromQuery(eventParam: string | null): QrFlyerEventName | null {
  if (eventParam === null) return GA_EVENT_QR_LETAK
  if (isQrFlyerEventName(eventParam)) return eventParam
  return null
}

export const QR_LETAK_CAMPAIGN = {
  campaign_source: "letak",
  campaign_medium: "qr",
  campaign_name: "letak_print",
} as const

export const QR_POSTA_CAMPAIGN = {
  campaign_source: "posta",
  campaign_medium: "qr",
  campaign_name: "posta_print",
} as const

/** Campaign params embedded in the collector. Not taken from the query string. */
export function qrFlyerCampaign(eventName: QrFlyerEventName): {
  source: string
  medium: string
  name: string
} {
  const campaign = eventName === GA_EVENT_QR_POSTA ? QR_POSTA_CAMPAIGN : QR_LETAK_CAMPAIGN
  return {
    source: campaign.campaign_source,
    medium: campaign.campaign_medium,
    name: campaign.campaign_name,
  }
}

export const QR_LETAK_STORAGE_KEY = "autocash_qr_letak"
export const QR_POSTA_STORAGE_KEY = "autocash_qr_posta"
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
/** Keep the collector iframe alive after event_callback so collect can leave. */
export const QR_COLLECT_FLUSH_MS = 800
/** Same-origin GTM-free collector. Live `/qr-gtag` already emits `en=qr_letak`. */
export const QR_GTAG_COLLECT_PATH = "/qr-gtag"

type TrackQrLetakOptions = {
  onDone?: () => void
  /** Defaults to the field leaflet so existing `/qr` callers stay on `qr_letak`. */
  eventName?: QrFlyerEventName
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

export function markQrPostaPending(): void {
  try {
    sessionStorage.setItem(QR_POSTA_STORAGE_KEY, QR_LETAK_PENDING)
  } catch {
    /* private mode / quota */
  }
}

export function markQrPostaSent(): void {
  try {
    sessionStorage.setItem(QR_POSTA_STORAGE_KEY, QR_LETAK_SENT)
  } catch {
    /* ignore */
  }
}

/** True when /qrposta queued a scan that has not been delivered via gtag yet. */
export function hasPendingQrPosta(): boolean {
  try {
    return sessionStorage.getItem(QR_POSTA_STORAGE_KEY) === QR_LETAK_PENDING
  } catch {
    return false
  }
}

/**
 * Fires exactly one `qr_letak` from `/qr-gtag` in a hidden iframe (GTM-free
 * document; official gtag order). Never `dataLayer.push({ event: 'qr_letak' })`
 * on the parent. Autocash has no Ads `AW-` collector.
 *
 * Live after #22: `/qr-gtag` as a top-level page emits `en=qr_letak`, but `/qr`
 * marked sessionStorage `sent` and redirected immediately, then tearing down
 * the iframe aborted the collect. Keep the iframe in the DOM and delay `onDone`
 * after callback so the hit can leave. Timeout without callback keeps pending.
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

  const eventName = options?.eventName === GA_EVENT_QR_POSTA ? GA_EVENT_QR_POSTA : GA_EVENT_QR_LETAK

  const iframe = document.createElement("iframe")
  iframe.setAttribute("aria-hidden", "true")
  iframe.setAttribute("title", "")
  iframe.style.cssText =
    "position:absolute;width:0;height:0;border:0;overflow:hidden;visibility:hidden"

  let timer = 0
  const stopListening = finishOnce(() => {
    window.removeEventListener("message", onMessage)
    window.clearTimeout(timer)
  })

  const onMessage = (event: MessageEvent) => {
    const origin = window.location?.origin
    if (origin && event.origin && event.origin !== origin) return
    if (!isQrGtagMessage(event.data)) return
    if (event.data.event !== eventName) return
    stopListening()
    if (event.data.sent) {
      if (eventName === GA_EVENT_QR_POSTA) markQrPostaSent()
      else markQrLetakSent()
      timer = window.setTimeout(done, QR_COLLECT_FLUSH_MS)
      return
    }
    done()
  }

  timer = window.setTimeout(() => {
    stopListening()
    done()
  }, QR_REDIRECT_HOLD_MS)

  window.addEventListener("message", onMessage)
  iframe.src = QR_GTAG_COLLECT_PATH
  // Only the postal flyer adds a query. Set it before the iframe is attached
  // so `/qr` still navigates once, to `/qr-gtag` with no query string.
  if (eventName === GA_EVENT_QR_POSTA) {
    iframe.src = `${QR_GTAG_COLLECT_PATH}?event=${GA_EVENT_QR_POSTA}`
  }

  const host = document.body ?? document.documentElement
  if (!host) {
    stopListening()
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
  eventName: QrFlyerEventName = GA_EVENT_QR_LETAK,
): Promise<void> {
  if (eventName === GA_EVENT_QR_POSTA) markQrPostaPending()
  else markQrLetakPending()
  await new Promise<void>((resolve) => {
    trackQrLetak({
      eventName,
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

/** Homepage safety net for a postal scan that never got `event_callback`. */
export function replayPendingQrPosta(_waitMs = QR_HOME_BEACON_WAIT_MS): void {
  if (typeof window === "undefined") return
  if (!hasPendingQrPosta()) return
  trackQrLetak({ eventName: GA_EVENT_QR_POSTA })
}
