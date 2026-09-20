/** Flyer QR scan — keep this name in sync with sibling sites. */
export const GA_EVENT_QR_LETAK = "qr_letak"

export const QR_LETAK_CAMPAIGN = {
  campaign_source: "letak",
  campaign_medium: "qr",
  campaign_name: "letak_print",
} as const

const HAS_GA = Boolean(process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID)

type TrackQrLetakOptions = {
  onDone?: () => void
}

/**
 * Fires `qr_letak` through the same pipes as the rest of the site:
 * - `gtag('event', …)` when GA4 / Ads gtag is present
 * - `dataLayer.push({ event })` so GTM can listen with a Custom Event trigger
 *
 * If both GTM and `NEXT_PUBLIC_GA_MEASUREMENT_ID` send this event to the same
 * GA4 property, do not also add a GTM GA4 Event tag — that would double-count.
 */
export function trackQrLetak(options?: TrackQrLetakOptions): void {
  if (typeof window === "undefined") return

  let finished = false
  const done = () => {
    if (finished) return
    finished = true
    options?.onDone?.()
  }

  window.setTimeout(done, HAS_GA ? 2000 : 400)

  window.dataLayer = window.dataLayer || []
  window.dataLayer.push({
    event: GA_EVENT_QR_LETAK,
    ...QR_LETAK_CAMPAIGN,
  })

  const gtag = window.gtag
  if (typeof gtag !== "function") return

  gtag("set", QR_LETAK_CAMPAIGN)
  gtag("event", GA_EVENT_QR_LETAK, {
    ...QR_LETAK_CAMPAIGN,
    event_callback: done,
    event_timeout: 2000,
  })
}

export function waitForGtag(timeoutMs = 2000): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve()
  if (!HAS_GA || typeof window.gtag === "function") return Promise.resolve()

  return new Promise((resolve) => {
    const started = Date.now()
    const tick = () => {
      if (typeof window.gtag === "function" || Date.now() - started >= timeoutMs) {
        resolve()
        return
      }
      window.setTimeout(tick, 50)
    }
    tick()
  })
}
