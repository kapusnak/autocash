"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import {
  hasPendingQrLetak,
  QR_HOME_BEACON_WAIT_MS,
  trackQrLetak,
  waitForAnalytics,
} from "@/lib/track-qr-letak"

/**
 * Safety net: replay `qr_letak` via gtag on the homepage only if /qr never
 * completed a gtag handoff (pending flag still set).
 */
export function QrLetakHomeBeacon() {
  useEffect(() => {
    if (isCrawlerUserAgent(navigator.userAgent) || navigator.webdriver) return
    if (window.location.pathname === "/qr") return
    if (!hasPendingQrLetak()) return

    void waitForAnalytics(QR_HOME_BEACON_WAIT_MS).then((ready) => {
      if (!ready || !hasPendingQrLetak()) return
      trackQrLetak()
    })
  }, [])

  return null
}
