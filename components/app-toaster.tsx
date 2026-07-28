"use client"

import { Toaster } from "sonner"

import "sonner/dist/styles.css"

export function AppToaster() {
  return (
    <Toaster
      position="top-center"
      closeButton
      duration={6500}
      offset="5.25rem"
      mobileOffset="5.25rem"
      gap={10}
      toastOptions={{
        classNames: {
          toast:
            "rounded-2xl border border-[color:var(--foreground)]/[0.08] bg-white/95 backdrop-blur-md shadow-[0_16px_48px_-16px_rgba(17,17,17,0.28)] sm:min-w-[22rem] dark:bg-card/95",
          title: "font-semibold text-[0.9375rem] text-[var(--foreground)] tracking-tight",
          description: "text-sm text-[var(--muted-foreground)] leading-snug",
          success:
            "border-l-[3px] border-l-[var(--primary)] !border-t-[color:var(--foreground)]/[0.08] !border-r-[color:var(--foreground)]/[0.08] !border-b-[color:var(--foreground)]/[0.08]",
          error:
            "border-l-[3px] border-l-red-600 !border-t-[color:var(--foreground)]/[0.08] !border-r-[color:var(--foreground)]/[0.08] !border-b-[color:var(--foreground)]/[0.08]",
          closeButton:
            "border-0 bg-transparent text-[var(--muted-foreground)] hover:bg-[var(--foreground)]/[0.06] hover:text-[var(--foreground)]",
        },
      }}
    />
  )
}
