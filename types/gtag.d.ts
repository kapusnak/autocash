export {}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    google_tag_manager?: Record<string, unknown>
    google_tag_data?: Record<string, unknown>
    __autocashGa4QrConfigured?: boolean
    /** Set when the page's `gtag/js` script has actually executed (not the inline stub). */
    __autocashGtagJsLoaded?: boolean
  }
}
