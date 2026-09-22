"use client"

import Script from "next/script"
import {
  directGaConfigSnippet,
  shouldLoadDirectGaSnippet,
} from "@/lib/direct-ga-snippet"
import { markGtagJsLoaded } from "@/lib/track-qr-letak"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID || !shouldLoadDirectGaSnippet()) return null

  const configCall = directGaConfigSnippet(GA_MEASUREMENT_ID, GTM_ID)

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
        onLoad={markGtagJsLoaded}
        onReady={markGtagJsLoaded}
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          ${configCall}
        `}
      </Script>
    </>
  )
}
