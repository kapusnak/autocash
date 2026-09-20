"use client"

import { useEffect } from "react"

import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import { trackQrLetak, waitForGtag } from "@/lib/track-qr-letak"

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

    void waitForGtag().then(() => {
      if (cancelled) return
      trackQrLetak({
        onDone: () => {
          if (!cancelled) goHome()
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
      <a
        href="/"
        className="mt-4 text-sm font-medium text-primary underline-offset-2 hover:underline"
      >
        Pokračovat na Autocash
      </a>
    </main>
  )
}
