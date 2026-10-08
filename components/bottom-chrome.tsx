"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"

import { CookieBanner } from "@/components/cookie-banner"
import { LeadPopup } from "@/components/lead-popup"
import { shouldShowCookieBanner, shouldShowLeadPopup } from "@/lib/cookie-banner-path"

export function BottomChrome() {
  const pathname = usePathname()
  const [cookieVisible, setCookieVisible] = useState(false)
  const showBanner = shouldShowCookieBanner(pathname)
  const showLeadPopup = shouldShowLeadPopup(pathname)

  return (
    <>
      {showLeadPopup ? <LeadPopup cookieBarVisible={showBanner && cookieVisible} /> : null}
      {showBanner ? <CookieBanner onVisibleChange={setCookieVisible} /> : null}
    </>
  )
}
