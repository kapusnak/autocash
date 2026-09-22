"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import { replayPendingQrLetak } from "@/lib/track-qr-letak"

/**
 * Safety net: replay `qr_letak` via the GTM-free gtag iframe on the homepage
 * only if /qr never got `event_callback` (pending flag still set).
 */
export function QrLetakHomeBeacon() {
  useEffect(() => {
    if (isCrawlerUserAgent(navigator.userAgent) || navigator.webdriver) return
    if (window.location.pathname === "/qr") return
    replayPendingQrLetak()
  }, [])

  return null
}
