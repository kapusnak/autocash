"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import { clearQrLetakFlag, hasPendingQrLetak, trackQrLetak } from "@/lib/track-qr-letak"

/**
 * Safety net for GTM-only: if /qr redirected before the container was ready,
 * fire `qr_letak` once on the homepage (a page that stays loaded so GTM can
 * process the dataLayer queue).
 */
export function QrLetakHomeBeacon() {
  useEffect(() => {
    if (isCrawlerUserAgent(navigator.userAgent) || navigator.webdriver) return
    if (window.location.pathname === "/qr") return
    if (!hasPendingQrLetak()) return
    clearQrLetakFlag()
    trackQrLetak()
  }, [])

  return null
}
