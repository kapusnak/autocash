"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import { QR_GTAG_PRECONNECT_ORIGINS } from "@/lib/qr-gtag-document"
import {
  GA_EVENT_QR_LETAK,
  QR_ANALYTICS_READY_TIMEOUT_MS,
  handoffQrLetakScan,
  type QrFlyerEventName,
} from "@/lib/track-qr-letak"

function goHome() {
  window.location.replace("/")
}

export function QrLetakRedirect({
  eventName = GA_EVENT_QR_LETAK,
}: {
  eventName?: QrFlyerEventName
} = {}) {
  useEffect(() => {
    if (isCrawlerUserAgent(navigator.userAgent) || navigator.webdriver) {
      goHome()
      return
    }

    let cancelled = false

    void handoffQrLetakScan(
      () => {
        if (cancelled) return
        goHome()
      },
      QR_ANALYTICS_READY_TIMEOUT_MS,
      eventName,
    )

    return () => {
      cancelled = true
    }
  }, [eventName])

  return (
    <>
      {QR_GTAG_PRECONNECT_ORIGINS.flatMap((href) => [
        <link key={`dns-${href}`} rel="dns-prefetch" href={href} />,
        <link key={`pre-${href}`} rel="preconnect" href={href} />,
      ])}
      <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
        <p className="text-sm text-muted-foreground">Přesměrováváme…</p>
      </main>
    </>
  )
}
