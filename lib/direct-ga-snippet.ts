/**
 * Direct React `gtag('config')` / page_view snippet.
 * Hybrid production keeps GTM as the only page_view owner.
 */
export function shouldLoadDirectGaSnippet(
  measurementId: string | undefined = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
  gtmId: string | undefined = process.env.NEXT_PUBLIC_GTM_ID,
): boolean {
  return Boolean(measurementId?.trim()) && !Boolean(gtmId?.trim())
}
