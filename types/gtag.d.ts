export {}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    google_tag_manager?: Record<string, unknown>
    google_tag_data?: Record<string, unknown>
    __autocashGa4QrConfigured?: boolean
    /** Isolated measurement gtag (GTM hybrid). Do not use the shared window.gtag stub. */
    __autocashGtag?: (...args: unknown[]) => void
    /** GTM / shared gtag captured before isolated gtag.js overwrites window.gtag. */
    __autocashGtmGtag?: (...args: unknown[]) => void
    /** Isolated dataLayer for measurement gtag.js (`l=autocashGaDl`). */
    autocashGaDl?: unknown[]
    /** Set when the page's `gtag/js` script has actually executed (not the inline stub). */
    __autocashGtagJsLoaded?: boolean
  }
}
