"use client"

import Script from "next/script"

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID
const GTM_OWNS_PAGEVIEWS = Boolean(process.env.NEXT_PUBLIC_GTM_ID?.trim())

export function GoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return null

  // GTM already sends the GA4 page_view. A second default `gtag('config')`
  // would duplicate it; keep the destination registered for /qr `send_to`.
  const configCall = GTM_OWNS_PAGEVIEWS
    ? `gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: false });`
    : `gtag('config', '${GA_MEASUREMENT_ID}');`

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
          ${configCall}
        `}
      </Script>
    </>
  )
}
