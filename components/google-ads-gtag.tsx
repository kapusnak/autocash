"use client"

import Script from "next/script"

const GOOGLE_ADS_AW_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_AW_ID

export function GoogleAdsGtag() {
  if (!GOOGLE_ADS_AW_ID) return null

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_AW_ID}`}
        strategy="afterInteractive"
      />
      <Script id="google-ads-gtag" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_AW_ID}');
        `}
      </Script>
    </>
  )
}
