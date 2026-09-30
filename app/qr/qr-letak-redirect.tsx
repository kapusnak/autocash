"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
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
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-sm text-muted-foreground">Přesměrováváme…</p>
    </main>
  )
}
