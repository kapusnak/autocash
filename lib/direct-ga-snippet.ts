/**
 * Direct `gtag/js` snippet for the GA4 measurement ID.
 * Always load when the id is set — including alongside GTM. Hybrid then
 * uses an isolated dataLayer (`l=autocashGaDl`) and `send_page_view: false`
 * so GTM keeps page_view.
 */
export function shouldLoadDirectGaSnippet(
  measurementId: string | undefined = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  _gtmId: string | undefined = process.env.NEXT_PUBLIC_GTM_ID,
): boolean {
  return Boolean(measurementId?.trim())
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
