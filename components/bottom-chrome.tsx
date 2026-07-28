"use client"

import { useState } from "react"

import { CookieBanner } from "@/components/cookie-banner"
import { LeadPopup } from "@/components/lead-popup"

export function BottomChrome() {
  const [cookieVisible, setCookieVisible] = useState(false)

  return (
    <>
      <LeadPopup cookieBarVisible={cookieVisible} />
      <CookieBanner onVisibleChange={setCookieVisible} />
    </>
  )
}
