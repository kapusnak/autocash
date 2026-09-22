"use client"

import Script from "next/script"
import {
  directGaConfigSnippet,
  shouldLoadDirectGaSnippet,
  shouldSuppressDirectGaPageView,
} from "@/lib/direct-ga-snippet"
import {
  gaGtagJsSrc,
  markGtagJsLoaded,
  QR_GTAG_DATALAYER,
} from "@/lib/track-qr-letak"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

/**
 * Hybrid: measurement `gtag/js` on `l=autocashGaDl` (hnedpenize equivalent
 * of Ads `gtag/js?id=AW-…`). Do not load the same `G-` id on GTM's
 * dataLayer — page-level `send_to` never becomes collect there.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || !shouldLoadDirectGaSnippet()) return null

  const isolateFromGtm = shouldSuppressDirectGaPageView(GTM_ID)
  const src = gaGtagJsSrc(GA_MEASUREMENT_ID, isolateFromGtm ? QR_GTAG_DATALAYER : undefined)
  const configCall = directGaConfigSnippet(
    GA_MEASUREMENT_ID,
    GTM_ID,
    isolateFromGtm ? "__autocashGtag" : "gtag",
  )

  const inline = isolateFromGtm
    ? `
          window.${QR_GTAG_DATALAYER} = window.${QR_GTAG_DATALAYER} || [];
          window.__autocashGtag = function(){window.${QR_GTAG_DATALAYER}.push(arguments);}
          if (typeof window.gtag === 'function') {
            window.__autocashGtmGtag = window.gtag;
          }
          window.__autocashGtag('js', new Date());
          ${configCall}
        `
    : `
          window.dataLayer = window.dataLayer || [];
          if (typeof window.gtag !== 'function') {
            window.gtag = function gtag(){dataLayer.push(arguments);}
          }
          gtag('js', new Date());
          ${configCall}
        `

  return (
    <>
      <Script id="google-analytics" strategy="afterInteractive">
        {inline}
      </Script>
      <Script
        id="google-analytics-gtagjs"
        src={src}
        strategy="afterInteractive"
        onLoad={markGtagJsLoaded}
        onReady={markGtagJsLoaded}
      />
    </>
  )
}
