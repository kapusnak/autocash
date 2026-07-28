import Image from "next/image"

import { cn } from "@/lib/utils"

type ZivefirmyBadgeProps = {
  /** `dark` for blue/dark sections; `light` for white cards */
  variant?: "dark" | "light"
  className?: string
}

export function ZivefirmyBadge({ variant = "dark", className }: ZivefirmyBadgeProps) {
  const isDark = variant === "dark"

  return (
    <a
      href="https://www.zivefirmy.cz/docasny-vykup_f1907400?loc=1"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="ZIVEFIRMY.CZ — Spolehlivá firma 2026"
      className={cn(
        "inline-flex w-fit max-w-full flex-row items-center gap-3 rounded-xl border px-3 py-2.5 text-left shadow-sm transition",
        isDark
          ? "border-white/15 bg-white/10 backdrop-blur-sm hover:bg-white/[0.14]"
          : "border-primary/20 bg-primary/5 hover:bg-primary/10",
        className,
      )}
    >
      <Image
        src="/zivefirmy-spolehliva-firma-badge.webp"
        alt=""
        width={125}
        height={125}
        className="h-14 w-14 shrink-0 object-contain"
        aria-hidden
      />
      <span className="flex min-w-0 flex-col gap-0.5 leading-tight">
        <span
          className={cn(
            "text-[10px] font-medium uppercase tracking-wide",
            isDark ? "text-white/65" : "text-muted-foreground",
          )}
        >
          ZIVEFIRMY.CZ
        </span>
        <span
          className={cn(
            "text-[11px] font-semibold uppercase",
            isDark ? "text-white/95" : "text-foreground",
          )}
        >
          Spolehlivá firma
        </span>
        <span className={cn("text-[10px]", isDark ? "text-white/65" : "text-muted-foreground")}>2026</span>
      </span>
    </a>
  )
}
