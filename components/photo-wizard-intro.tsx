"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { PhotoWizard } from "@/components/photo-wizard"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type WizardVariant = "lead" | "share"

const SLIDES = [
  {
    title: "Pojďme vyfotit vaše auto",
    body: "Vítejte. Rychle zdokumentujeme váš vůz. Stačí se držet průvodce — celkem 6 fotek.",
  },
  {
    title: "Volný prostor kolem auta",
    body: "Kolem auta ať nejsou jiná vozidla ani překážky. Nechte volné místo, aby se celé auto vešlo do záběru.",
  },
  {
    title: "Za dne a celé auto v záběru",
    body: "Nejlepší je denní světlo. V záběru mějte celé auto včetně registrační značky.",
  },
] as const

function introSeenKey(token: string) {
  return `autocash-fotky-intro:${token}`
}

function WelcomeArt() {
  return (
    <svg viewBox="0 0 320 168" className="h-auto w-full" aria-hidden>
      <ellipse cx="168" cy="146" rx="108" ry="8" className="fill-primary/10" />
      <circle cx="78" cy="62" r="14" className="fill-primary" />
      <path d="M58 86c2-14 10-20 20-20s18 6 20 20v34H58V86z" className="fill-primary" />
      <path
        d="M96 104c14-2 24 2 32 12"
        fill="none"
        className="stroke-primary"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <g transform="translate(122 92) rotate(16)">
        <rect width="20" height="34" rx="4" className="fill-foreground" />
        <rect x="3" y="3" width="14" height="22" rx="1.5" className="fill-gold" />
        <circle cx="10" cy="29" r="1.6" className="fill-secondary" />
      </g>
      <path d="M148 118c8-26 28-40 62-40h28c22 0 36 10 44 26l6 14H148z" className="fill-primary" />
      <path d="M186 82h36c10 0 18 6 24 16h-70c4-10 6-16 10-16z" className="fill-primary-foreground/85" />
      <circle cx="186" cy="122" r="13" className="fill-foreground" />
      <circle cx="186" cy="122" r="5" className="fill-gold" />
      <circle cx="262" cy="122" r="13" className="fill-foreground" />
      <circle cx="262" cy="122" r="5" className="fill-gold" />
    </svg>
  )
}

function SpaceArt() {
  return (
    <svg viewBox="0 0 320 168" className="h-auto w-full" aria-hidden>
      <rect
        x="58"
        y="22"
        width="204"
        height="124"
        rx="28"
        fill="none"
        className="stroke-gold"
        strokeWidth="3"
        strokeDasharray="7 6"
      />
      <g className="fill-primary/25" opacity="0.9">
        <path d="M18 108c4-14 14-20 28-20h10c8 0 14 4 18 12l2 8H18z" />
        <circle cx="36" cy="112" r="6" className="fill-foreground/30" />
        <circle cx="64" cy="112" r="6" className="fill-foreground/30" />
      </g>
      <path d="M22 78l16 16M38 78L22 94" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
      <g className="fill-primary/25">
        <path d="M246 108c4-14 14-20 28-20h10c8 0 14 4 18 12l2 8H246z" />
        <circle cx="264" cy="112" r="6" className="fill-foreground/30" />
        <circle cx="292" cy="112" r="6" className="fill-foreground/30" />
      </g>
      <path d="M268 78l16 16M284 78l-16 16" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" />
      <path d="M118 112c6-20 20-30 42-30h16c14 0 24 7 30 18l4 12H118z" className="fill-primary" />
      <path d="M146 86h22c6 0 12 4 16 12h-46c2-8 4-12 8-12z" className="fill-primary-foreground/85" />
      <circle cx="142" cy="116" r="10" className="fill-foreground" />
      <circle cx="142" cy="116" r="4" className="fill-gold" />
      <circle cx="196" cy="116" r="10" className="fill-foreground" />
      <circle cx="196" cy="116" r="4" className="fill-gold" />
    </svg>
  )
}

function DaylightArt() {
  return (
    <svg viewBox="0 0 320 168" className="h-auto w-full" aria-hidden>
      <circle cx="262" cy="40" r="16" className="fill-gold" />
      <g fill="none" className="stroke-gold" strokeWidth="3" strokeLinecap="round">
        <path d="M262 12v8M262 60v8M234 40h8M282 40h8M242 20l6 6M276 54l6 6M282 20l-6 6M248 54l-6 6" />
      </g>
      <ellipse cx="156" cy="142" rx="96" ry="7" className="fill-primary/10" />
      <path d="M78 116c8-28 30-42 64-42h36c24 0 40 12 48 28l6 14H78z" className="fill-primary" />
      <path d="M118 78h40c12 0 20 6 26 16H108c4-10 6-16 10-16z" className="fill-primary-foreground/85" />
      <circle cx="118" cy="120" r="13" className="fill-foreground" />
      <circle cx="118" cy="120" r="5" className="fill-gold" />
      <circle cx="206" cy="120" r="13" className="fill-foreground" />
      <circle cx="206" cy="120" r="5" className="fill-gold" />
      <rect x="156" y="96" width="34" height="13" rx="2" className="fill-primary-foreground" />
      <rect x="156" y="96" width="7" height="13" className="fill-primary" />
      <path d="M167 100h16M167 104h12" className="stroke-foreground/70" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

const ARTS = [WelcomeArt, SpaceArt, DaylightArt] as const

export function PhotoWizardWithIntro({
  token,
  code,
  name,
  variant = "lead",
}: {
  token: string
  code: string
  name?: string
  variant?: WizardVariant
}) {
  const [ready, setReady] = useState(false)
  const [showIntro, setShowIntro] = useState(true)
  const [index, setIndex] = useState(0)
  const touchStartX = useRef<number | null>(null)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(introSeenKey(token)) === "1") setShowIntro(false)
    } catch {
      /* private mode — show intro */
    }
    setReady(true)
  }, [token])

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(introSeenKey(token), "1")
    } catch {
      /* still enter the wizard */
    }
    setShowIntro(false)
  }, [token])

  const goNext = useCallback(() => {
    setIndex((current) => {
      if (current >= SLIDES.length - 1) return current
      return current + 1
    })
  }, [])

  const goBack = useCallback(() => {
    setIndex((current) => Math.max(0, current - 1))
  }, [])

  useEffect(() => {
    if (!showIntro || !ready) return
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") {
        event.preventDefault()
        if (index >= SLIDES.length - 1) finish()
        else goNext()
      } else if (event.key === "ArrowLeft") {
        event.preventDefault()
        goBack()
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [finish, goBack, goNext, index, ready, showIntro])

  if (!ready) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="py-16 text-center text-muted-foreground">Načítám…</CardContent>
      </Card>
    )
  }

  if (!showIntro) {
    return <PhotoWizard token={token} code={code} name={name} variant={variant} />
  }

  const slide = SLIDES[index] ?? SLIDES[0]
  const Art = ARTS[index] ?? WelcomeArt
  const last = index === SLIDES.length - 1

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardContent className="px-5 py-6 space-y-5">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={finish}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Přeskočit
          </button>
        </div>

        <div
          className="overflow-hidden rounded-2xl bg-secondary/70 px-3 py-2"
          onTouchStart={(event) => {
            touchStartX.current = event.changedTouches[0]?.clientX ?? null
          }}
          onTouchEnd={(event) => {
            const start = touchStartX.current
            const end = event.changedTouches[0]?.clientX
            touchStartX.current = null
            if (start == null || end == null) return
            const delta = end - start
            if (delta <= -48) goNext()
            else if (delta >= 48) goBack()
          }}
        >
          <Art />
        </div>

        <div aria-live="polite">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Než začneme · {index + 1} / {SLIDES.length}
          </p>
          <h1 className="font-display text-2xl font-bold mt-1 text-balance">{slide.title}</h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{slide.body}</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          {index > 0 ? (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="size-12 rounded-full"
              aria-label="Zpět"
              onClick={goBack}
            >
              <ChevronLeft className="size-5" />
            </Button>
          ) : (
            <span className="size-12" aria-hidden />
          )}

          <div className="flex items-center gap-2" role="tablist" aria-label="Úvod průvodce fotkami">
            {SLIDES.map((item, i) => (
              <button
                key={item.title}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Snímek ${i + 1} z ${SLIDES.length}`}
                className={
                  i === index ? "h-2.5 w-6 rounded-full bg-primary" : "h-2.5 w-2.5 rounded-full bg-border"
                }
                onClick={() => setIndex(i)}
              />
            ))}
          </div>

          {!last ? (
            <Button
              type="button"
              size="icon"
              className="size-12 rounded-full"
              aria-label="Další"
              onClick={goNext}
            >
              <ChevronRight className="size-5" />
            </Button>
          ) : (
            <span className="size-12" aria-hidden />
          )}
        </div>

        {last ? (
          <Button type="button" className="h-12 w-full font-bold" onClick={finish}>
            Začít fotit
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}
