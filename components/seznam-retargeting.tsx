"use client"

import Script from "next/script"
import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { COOKIE_CONSENT_CHANGED_EVENT, hasCookieConsent } from "@/lib/cookie-consent"

const RTG_ID = 1679262

function fireSeznamRetargeting() {
  if (typeof window === "undefined") return
  if (!window.rc?.retargetingHit) return

  window.sznIVA?.IS?.updateIdentities({
    eid: null,
  })

  window.rc.retargetingHit({
    rtgId: RTG_ID,
    consent: hasCookieConsent() ? 1 : 0,
  })
}

export function SeznamRetargeting() {
  const pathname = usePathname()

  useEffect(() => {
    fireSeznamRetargeting()
  }, [pathname])

  useEffect(() => {
    window.addEventListener(COOKIE_CONSENT_CHANGED_EVENT, fireSeznamRetargeting)
    return () => {
      window.removeEventListener(COOKIE_CONSENT_CHANGED_EVENT, fireSeznamRetargeting)
    }
  }, [])

  return (
    <Script
      src="https://c.seznam.cz/js/rc.js"
      strategy="afterInteractive"
      onLoad={fireSeznamRetargeting}
    />
  )
}
