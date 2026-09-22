"use client"

import Script from "next/script"
import { shouldLoadDirectGaSnippet } from "@/lib/direct-ga-snippet"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID

export function GoogleAnalytics() {
  // Hybrid: GTM owns page_view. NEXT_PUBLIC_GA_MEASUREMENT_ID is still read
  // by track-qr-letak for a silent gtag config + send_to — do not load a
  // second gtag.js / page_view snippet here.
  if (!shouldLoadDirectGaSnippet()) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}');
        `}
      </Script>
    </>
  )
}
