import { ArrowDown, Car, Clock, MapPin, Shield } from "lucide-react"
import Image from "next/image"

import { LoanCalculator } from "@/components/loan-calculator"

const HERO_ALT = "Auto připravené k ocenění"
/** 2560×1440 source — quality 90 keeps Retina crops sharp without a soft 1600px mobile twin. */
const HERO_QUALITY = 90
/**
 * Mobile: full-bleed photo column ≈ 100vw.
 * Desktop (lg+): photo is the left 1.2fr track beside a ~26.5rem form — measured ~900–1100 CSS
 * at common Retina widths. Cap at 70rem (not 56rem) so DPR2 selects w≥2048/2560, not an
 * undersized 1920 candidate.
 */
const HERO_SIZES = "(max-width: 1023px) 100vw, min(60vw, 70rem)"

function HeroPhoto() {
  return (
    <Image
      src="/hero-car.webp"
      alt={HERO_ALT}
      fill
      priority
      quality={HERO_QUALITY}
      sizes={HERO_SIZES}
      className="object-cover object-[52%_58%] sm:object-[54%_52%] lg:object-[46%_50%]"
    />
  )
}

const chips = [
  { icon: Clock, label: "Peníze do 24 hodin" },
  { icon: Car, label: "S autem jezdíte dál" },
  { icon: Shield, label: "Bez dokládání příjmů" },
  { icon: MapPin, label: "Po celé ČR" },
]

export function HomeHero() {
  return (
    <section className="relative bg-background">
      <div className="container mx-auto px-4 pt-24 pb-8 sm:pt-28 sm:pb-10 lg:pt-28 lg:pb-12">
        <div className="overflow-hidden rounded-2xl bg-card shadow-xl sm:rounded-3xl lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(22.5rem,26.5rem)] lg:items-stretch">
          <div className="relative isolate min-h-[22rem] overflow-hidden sm:min-h-[26rem] lg:min-h-full">
            <HeroPhoto />

            {/* Contrast only where copy sits — the SUV stays saturated. */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/25 lg:bg-gradient-to-r lg:from-black/55 lg:via-black/22 lg:via-[34%] lg:to-transparent lg:to-[70%]"
              aria-hidden
            />
            {/* Soft white fade only toward the form edge. */}
            <div
              className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-b from-transparent to-card lg:inset-y-0 lg:left-auto lg:right-0 lg:h-auto lg:w-24 lg:bg-gradient-to-r lg:from-transparent lg:via-card/55 lg:to-card xl:w-28"
              aria-hidden
            />

            <div className="relative z-10 flex h-full min-h-[22rem] flex-col justify-start gap-5 px-5 py-6 sm:min-h-[26rem] sm:px-8 sm:py-8 lg:min-h-[42rem] lg:justify-between lg:gap-8 lg:px-10 lg:py-9 lg:pr-14 xl:px-12">
              <div className="max-w-xl space-y-3 text-white animate-fade-up sm:space-y-4">
                <h1 className="font-display text-3xl font-bold leading-[1.18] text-balance drop-shadow-sm sm:text-4xl lg:text-5xl xl:text-[3.25rem]">
                  Získejte peníze za auto
                  <span className="mt-1 block text-gold">a jezděte s ním dál.</span>
                </h1>
                <p className="max-w-lg text-sm leading-relaxed text-white/90 drop-shadow-sm sm:text-base lg:text-lg">
                  Za hodnotu vozu vám vyplatíme hotovost a vy auto dál používáte. V technickém průkazu zůstáváte
                  provozovatelem — vůz se jen dočasně přepíše na nás, abyste mohli jezdit dál. Peníze ve většině
                  případů odesíláme ihned, maximálně však do 24 hodin po podpisu smlouvy.
                </p>
              </div>

              <div className="w-full space-y-3 animate-fade-up">
                <ul className="max-w-md space-y-1 rounded-2xl border border-white/15 bg-black/45 p-3 backdrop-blur-md sm:p-3.5">
                  {chips.map(({ icon: Icon, label }) => (
                    <li key={label} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/10">
                        <Icon className="h-4 w-4 text-gold" aria-hidden />
                      </span>
                      <span className="text-sm font-medium text-white sm:text-[15px]">{label}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex justify-center pt-1 lg:hidden">
                  <a
                    href="#formular"
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-gold-foreground shadow-lg shadow-black/20 animate-bounce-y sm:text-base"
                  >
                    Vyplňte nezávaznou poptávku
                    <ArrowDown className="h-4 w-4 shrink-0" aria-hidden />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="relative z-10 flex justify-center bg-card px-2 py-3 sm:px-3 sm:py-5 lg:px-4 lg:py-7 animate-fade-up-delay">
            <LoanCalculator embedded />
          </div>
        </div>
      </div>
    </section>
  )
}
