"use client"

import Script from "next/script"
import {
  directGaConfigSnippet,
  shouldLoadDirectGaSnippet,
} from "@/lib/direct-ga-snippet"
import { gaGtagJsSrc } from "@/lib/qr-gtag-document"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

/**
 * Direct `gtag/js` only when GTM is absent (hnedpenize). Production Autocash
 * has GTM; `/qr` `qr_letak` is sent from a GTM-free iframe, not this snippet.
 * Do not load a second measurement gtag.js beside GTM — Next.js preloaded the
 * library ahead of the inline stub, so that parent-page collector never flushed.
 */
export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || !shouldLoadDirectGaSnippet()) return null

  const src = gaGtagJsSrc(GA_MEASUREMENT_ID)
  const configCall = directGaConfigSnippet(GA_MEASUREMENT_ID)

  return (
    <>
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          if (typeof window.gtag !== 'function') {
            window.gtag = function gtag(){dataLayer.push(arguments);}
          }
          gtag('js', new Date());
          ${configCall}
        `}
      </Script>
      <Script id="google-analytics-gtagjs" src={src} strategy="afterInteractive" />
    </>
  )
}
