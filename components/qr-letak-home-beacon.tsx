"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import { replayPendingQrLetak } from "@/lib/track-qr-letak"

/**
 * Safety net: replay `qr_letak` via gtag on the homepage only if /qr never
 * got `event_callback` (pending flag still set). /qr may redirect on the hold
 * timeout without marking sent so this beacon can retry once the collector is up.
 */
export function QrLetakHomeBeacon() {
  useEffect(() => {
    if (isCrawlerUserAgent(navigator.userAgent) || navigator.webdriver) return
    if (window.location.pathname === "/qr") return
    replayPendingQrLetak()
  }, [])

  return null
}
