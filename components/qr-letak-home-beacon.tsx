"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import { replayPendingQrLetak, replayPendingQrPosta } from "@/lib/track-qr-letak"

/**
 * Safety net: replay a flyer scan via the GTM-free gtag iframe on the homepage
 * only if the landing page never got `event_callback` (pending flag still set).
 * `/qr` replays `qr_letak`; `/qrposta` replays `qr_posta`. Each flag is separate,
 * so a field scan is never resent as the postal event.
 */
export function QrLetakHomeBeacon() {
  useEffect(() => {
    if (isCrawlerUserAgent(navigator.userAgent) || navigator.webdriver) return
    const path = window.location.pathname
    if (path === "/qr" || path === "/qrposta") return
    replayPendingQrLetak()
    replayPendingQrPosta()
  }, [])

  return null
}
