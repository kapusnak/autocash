"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import { hasPendingQrLetak, trackQrLetak } from "@/lib/track-qr-letak"

/**
 * Safety net: replay `qr_letak` on the homepage only if /qr never completed
 * a dataLayer/gtag handoff (pending flag still set).
 */
export function QrLetakHomeBeacon() {
  useEffect(() => {
    if (isCrawlerUserAgent(navigator.userAgent) || navigator.webdriver) return
    if (window.location.pathname === "/qr") return
    if (!hasPendingQrLetak()) return
    trackQrLetak()
  }, [])

  return null
}
