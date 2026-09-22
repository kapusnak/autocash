"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import { replayPendingQrLetak } from "@/lib/track-qr-letak"

/**
 * Safety net: replay `qr_letak` via gtag on the homepage only if /qr never
 * completed a gtag handoff (pending flag still set). Still attempts track
 * after the wait even if GTM was slow — track keeps pending unless gtag ran.
 */
export function QrLetakHomeBeacon() {
  useEffect(() => {
    if (isCrawlerUserAgent(navigator.userAgent) || navigator.webdriver) return
    if (window.location.pathname === "/qr") return
    replayPendingQrLetak()
  }, [])

  return null
}
