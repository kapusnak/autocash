"use client"

import { startTransition, useEffect, useState } from "react"
import Link from "next/link"

const STORAGE_KEY = "autocash-cookie-consent"

type CookieBannerProps = {
  onVisibleChange?: (visible: boolean) => void
}

export function CookieBanner({ onVisibleChange }: CookieBannerProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    startTransition(() => {
      try {
        if (!localStorage.getItem(STORAGE_KEY)) {
          setShow(true)
        }
      } catch {
        setShow(true)
      }
    })
  }, [])

  useEffect(() => {
    onVisibleChange?.(show)
  }, [show, onVisibleChange])

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, "accepted")
    } catch {
      /* ignore */
    }
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      role="dialog"
      aria-labelledby="cookie-banner-title"
      className="fixed bottom-0 left-0 right-0 z-[60] border-t border-border bg-card px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-4px_24px_rgba(0,0,0,0.1)] sm:px-8"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="text-sm text-muted-foreground">
          <p id="cookie-banner-title" className="font-semibold text-foreground">
            Cookies a soukromí
          </p>
          <p className="mt-1">
            Používáme cookies nezbytné pro fungování webu a (po souhlasu) analytické nástroje. Více v{" "}
            <Link href="/zasady-cookies" className="text-primary underline-offset-2 hover:underline">
              Zásadách cookies
            </Link>{" "}
            a{" "}
            <Link href="/ochrana-osobnich-udaju" className="text-primary underline-offset-2 hover:underline">
              ochraně osobních údajů
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={accept}
          className="h-11 shrink-0 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Rozumím
        </button>
      </div>
    </div>
  )
}
