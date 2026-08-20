"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

/** Scroll to `#formular` after client navigations that land with that hash. */
export function FormularHashScroll() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname !== "/") return
    if (window.location.hash !== "#formular") return

    const scroll = () => {
      document.getElementById("formular")?.scrollIntoView({ behavior: "smooth", block: "start" })
    }

    // Wait a tick so the calculator is in the DOM after route transition.
    const id = window.setTimeout(scroll, 50)
    return () => window.clearTimeout(id)
  }, [pathname])

  return null
}
