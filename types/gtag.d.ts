export {}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: unknown[]
    google_tag_manager?: Record<string, unknown>
    google_tag_data?: Record<string, unknown>
  }
}
