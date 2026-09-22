/**
 * Direct `gtag/js` snippet for the GA4 measurement ID.
 * Hybrid (GTM + GA) skips this — GTM owns page_view, and `/qr` fires
 * `qr_letak` from a GTM-free iframe. Match hnedpenize: no second G- gtag.js
 * beside GTM.
 */
export function shouldLoadDirectGaSnippet(
  measurementId: string | undefined = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  gtmId: string | undefined = process.env.NEXT_PUBLIC_GTM_ID,
): boolean {
  return Boolean(measurementId?.trim()) && !gtmId?.trim()
}

/** When GTM is present, never emit a second default page_view from this snippet. */
export function shouldSuppressDirectGaPageView(
  gtmId: string | undefined = process.env.NEXT_PUBLIC_GTM_ID,
): boolean {
  return Boolean(gtmId?.trim())
}

export function directGaConfigSnippet(
  measurementId: string,
  gtmId: string | undefined = process.env.NEXT_PUBLIC_GTM_ID,
  gtagFn = "gtag",
): string {
  const id = measurementId.trim()
  if (shouldSuppressDirectGaPageView(gtmId)) {
    return `${gtagFn}('config', '${id}', { send_page_view: false });`
  }
  return `${gtagFn}('config', '${id}');`
}
