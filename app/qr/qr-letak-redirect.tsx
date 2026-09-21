"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import { markQrLetakPending, trackQrLetak, waitForAnalytics } from "@/lib/track-qr-letak"

function goHome() {
  window.location.replace("/")
}

export function QrLetakRedirect() {
  useEffect(() => {
    if (isCrawlerUserAgent(navigator.userAgent) || navigator.webdriver) {
      goHome()
      return
    }

    let cancelled = false
    markQrLetakPending()

    void waitForAnalytics().then((ready) => {
      if (cancelled) return
      if (!ready) {
        // gtag never appeared — keep pending so the homepage fires once.
        goHome()
        return
      }
      trackQrLetak({
        onDone: () => {
          if (cancelled) return
          goHome()
        },
      })
    })

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-sm text-muted-foreground">Přesměrováváme…</p>
    </main>
  )
}
