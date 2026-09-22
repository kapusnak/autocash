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
 * Isolated dataLayer for measurement `gtag/js` when GTM already owns
 * `window.dataLayer`. Sibling hnedpenize gets a real collector from Ads
 * `gtag/js?id=AW-…` (hardcoded fallback) and never loads a second
 * `gtag/js?id=G-…` beside GTM. Autocash has no Ads tag. Loading the same
 * `G-` id on GTM's layer leaves `gtag('event', …, { send_to })` as
 * Arguments on `dataLayer` — GTM enhanced-measurement still emits
 * `page_view` / `scroll`, the paused `GA4 - qr_letak` tag does not.
 */
export const QR_GTAG_DATALAYER = "autocashGaDl"

/** `https://www.googletagmanager.com/gtag/js?id=G-…` plus optional `l=`. */
export function gaGtagJsSrc(measurementId: string, dataLayerName?: string): string {
  const params = new URLSearchParams({ id: measurementId.trim() })
  if (dataLayerName) params.set("l", dataLayerName)
  return `https://www.googletagmanager.com/gtag/js?${params.toString()}`
}

/**
 * Wait for a real collector (`gtag/js` executed), not the inline dataLayer stub.
 * First visit / TCF cookie banner can delay the script — match the homepage
 * beacon so /qr does not redirect before collect can leave.
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

function isHybridGaGtm(): boolean {
  return hasGa() && hasGtm()
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

/**
 * Hybrid (GTM + GA): the isolated collector, never the shared `window.gtag`
 * stub GTM already wrapped. GA-only / GTM-only: `window.gtag`.
 */
export function qrCollector(): ((...args: unknown[]) => void) | undefined {
  if (typeof window === "undefined") return undefined
  if (isHybridGaGtm()) {
    return typeof window.__autocashGtag === "function" ? window.__autocashGtag : undefined
  }
  return typeof window.gtag === "function" ? window.gtag : undefined
}

export function isGtagReady(): boolean {
  return typeof qrCollector() === "function"
}

export function isGtmReady(): boolean {
  if (typeof window === "undefined") return false
  if (window.google_tag_manager && typeof window.google_tag_manager === "object") return true
  return hasDataLayerEvent("gtm.load")
}

/**
 * Isolated `gtag/js?l=autocashGaDl` assigns `window.gtag` to its collector.
 * Keep that on `__autocashGtag` and give GTM / lead-conversion back the
 * shared `window.gtag` if we captured it before the library ran.
 */
function adoptIsolatedGtagCollector(): void {
  if (!isHybridGaGtm()) return
  const current = window.gtag
  const saved = window.__autocashGtmGtag
  if (typeof current !== "function") return
  if (saved && current === saved) return
  window.__autocashGtag = current
  if (typeof saved === "function") {
    window.gtag = saved
  }
}

/** Next.js Script `onLoad` / `onReady` — the library ran, not just the stub. */
export function markGtagJsLoaded(): void {
  if (typeof window === "undefined") return
  window.__autocashGtagJsLoaded = true
  adoptIsolatedGtagCollector()
}

/**
 * True only for this page's measurement `gtag/js` library URL.
 * Require `/gtag/js` (not `gtm.js`). When GTM+GA, also require
 * `l=autocashGaDl` — GTM's default-layer `gtag/js?id=G-…` is not the
 * collector (live after #18 already waited on `/gtag/js` and still
 * produced no `en=qr_letak`).
 */
export function isGtagJsScriptUrl(
  url: string | undefined | null,
  measurementId?: string,
  dataLayerName?: string,
): boolean {
  if (!url) return false
  if (!url.includes("/gtag/js")) return false
  if (url.includes("/gtm.js")) return false
  const id = measurementId?.trim()
  if (id && !url.includes(id)) return false
  const layer = dataLayerName?.trim()
  if (layer) {
    const decoded = url.replace(/&amp;/g, "&")
    if (!decoded.includes(`l=${layer}`) && !decoded.includes(`l%3D${layer}`)) {
      return false
    }
  }
  return true
}

function requiredGtagDataLayer(): string | undefined {
  return isHybridGaGtm() ? QR_GTAG_DATALAYER : undefined
}

function hasMeasurementGtagJsResource(): boolean {
  try {
    const id = gaMeasurementId()
    const layer = requiredGtagDataLayer()
    const entries = window.performance?.getEntriesByType?.("resource") ?? []
    return entries.some((entry) => {
      const resource = entry as PerformanceResourceTiming
      if (resource.initiatorType !== "script") return false
      if (!(resource.responseEnd > 0)) return false
      return isGtagJsScriptUrl(resource.name, id, layer)
    })
  } catch {
    return false
  }
}

/**
 * True when this page's measurement `gtag/js` has downloaded as a real
 * script (not a `<link rel="preload">`, not `gtm.js`) or Next.js Script
 * reported load. The inline `function gtag(){dataLayer.push(arguments)}`
 * is not enough.
 */
export function isGtagJsLoaded(): boolean {
  if (typeof window === "undefined") return false
  watchGtagJsScriptLoad()
  if (window.__autocashGtagJsLoaded) return true
  return hasMeasurementGtagJsResource()
}

/**
 * Ready to send `qr_letak` via `gtag('event', …, { send_to })`.
 * Hybrid: isolated `__autocashGtag` **and** executed `gtag/js?l=autocashGaDl`.
 * Shared `window.gtag` + GTM `page_view`/`scroll` is not enough (live #18).
 * GTM-only deploys still wait for the container.
 */
export function isAnalyticsReady(): boolean {
  if (!isGtagReady()) return false
  if (hasGa()) return isGtagJsLoaded()
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

function watchGtagJsScriptLoad(): void {
  if (typeof document === "undefined") return
  const id = gaMeasurementId()
  const layer = requiredGtagDataLayer()
  const scripts = document.getElementsByTagName("script")
  for (let i = 0; i < scripts.length; i++) {
    const el = scripts[i]
    const src = el.src || ""
    if (!isGtagJsScriptUrl(src, id, layer)) continue
    if (el.dataset.autocashGtagWatch === "1") continue
    el.dataset.autocashGtagWatch = "1"
    el.addEventListener("load", markGtagJsLoaded)
  }
}

/**
 * Resolves true when `gtag('event')` can reach GA4 collect.
 * Hybrid: wait for `__autocashGtag` **and** executed `gtag/js?l=autocashGaDl`.
 * Do not treat GTM `page_view`/`scroll` or default-layer `gtag/js?id=G-` as
 * sufficient — Autocash GTM does not assign a collecting page-level `gtag`.
 * GTM-only: wait for `google_tag_manager` / `gtm.load`, then install a stub.
 * Settle is best-effort — a slow pause must not flip the result to false.
 */
export async function waitForAnalytics(
  timeoutMs = QR_ANALYTICS_READY_TIMEOUT_MS,
): Promise<boolean> {
  if (typeof window === "undefined") return false
  if (!hasAnalytics()) return false

  if (hasGa()) {
    watchGtagJsScriptLoad()
    const collectorUp = await waitUntil(
      () => isGtagReady() && isGtagJsLoaded(),
      timeoutMs,
    )
    if (!collectorUp) return false
  } else if (hasGtm()) {
    const gtmUp = await waitUntil(isGtmReady, timeoutMs)
    if (!gtmUp) return false
    ensureGtag()
  } else {
    return false
  }

  if (QR_GTAG_SETTLE_MS > 0) await delay(QR_GTAG_SETTLE_MS)
  if (hasGa()) return isGtagReady() && isGtagJsLoaded()
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

function gtagCampaign(): { source: string; medium: string; name: string } {
  return {
    source: QR_LETAK_CAMPAIGN.campaign_source,
    medium: QR_LETAK_CAMPAIGN.campaign_medium,
    name: QR_LETAK_CAMPAIGN.campaign_name,
  }
}

/**
 * Fires exactly one `qr_letak` via `gtag('event', …)` — never a GTM
 * `dataLayer.push({ event: 'qr_letak' })` Custom Event.
 *
 * Fire order matches working hnedpenize: `gtag('set', { campaign })`,
 * then once `gtag('config', id, { send_page_view: false })`, then
 * `gtag('event', 'qr_letak', { send_to })`. Hybrid uses the isolated
 * collector, not `window.gtag`. GTM still owns page_view.
 *
 * Marks the session flag sent **only** from `event_callback` (the hit left).
 * The redirect hold still calls `onDone` so `/qr` is not stuck, but pending
 * stays if the callback never ran — homepage beacon can retry.
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

  const gtag = qrCollector()
  if (typeof gtag !== "function") {
    done()
    return
  }

  const holdMs = hasAnalytics() ? QR_REDIRECT_HOLD_MS : 400
  const acknowledge = finishOnce(() => {
    markQrLetakSent()
    done()
  })

  gtag("set", { campaign: gtagCampaign() })
  const sendTo = ensureGa4Configured(gtag)
  const timer = window.setTimeout(done, holdMs)

  gtag("event", GA_EVENT_QR_LETAK, {
    ...QR_LETAK_CAMPAIGN,
    ...(sendTo ? { send_to: sendTo } : {}),
    transport_type: "beacon",
    event_callback: () => {
      window.clearTimeout(timer)
      acknowledge()
    },
  })
}

/**
 * /qr path: wait for executed `gtag/js` (not the inline stub), then always
 * attempt the gtag handoff. Redirect via `onDone` (event_callback / hold, or
 * an immediate no-op that keeps the pending flag when the event was never
 * invoked). Hold without callback does **not** mark sent.
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
