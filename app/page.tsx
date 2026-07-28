import {
  Car,
  CheckCircle,
  Clock,
  MapPin,
  Mail,
  Phone,
  Shield,
  Zap,
  Gauge,
  Wallet,
} from "lucide-react"

import { Header } from "@/components/header"
import { LoanCalculator } from "@/components/loan-calculator"
import { BottomChrome } from "@/components/bottom-chrome"
import { ProcessSteps } from "@/components/process-steps"
import { FaqSection } from "@/components/faq-section"
import { CtaSection } from "@/components/cta-section"
import { SiteFooter } from "@/components/site-footer"
import { ZivefirmyBadge } from "@/components/zivefirmy-badge"
import { Card, CardContent } from "@/components/ui/card"
import { SITE } from "@/lib/site"

const benefits = [
  {
    icon: Zap,
    title: "Peníze do 24 hodin",
    description: "Hotovost po podpisu — bez čekání na banku.",
  },
  {
    icon: Car,
    title: "Jezdíte dál",
    description: "Auto zůstává u vás. Přepis je jen zajištění.",
  },
  {
    icon: CheckCircle,
    title: "Vysoké % schválení",
    description: "Nejsme banka. Registry nás nestaví do cesty.",
  },
  {
    icon: MapPin,
    title: "Celá ČR",
    description: "Přijedeme za vámi. Diskrétně a rychle.",
  },
]

const advantages = [
  {
    icon: Wallet,
    title: "Až ~90 % hodnoty vozu",
    text: "Získáte maximum z reálné tržní ceny — ne směšnou nabídku z bazaru.",
  },
  {
    icon: Gauge,
    title: "Bez zbytečné byrokracie",
    text: "Žádné týdny čekání. Poptávka, ocenění, smlouva, hotovost.",
  },
  {
    icon: Shield,
    title: "Diskrétní řešení",
    text: "Žádné veřejné registry jako u klasických úvěrů. Řešíme to mezi námi.",
  },
  {
    icon: Clock,
    title: "Zpětný odkup kdykoliv",
    text: "Až se situace srovná, vůz si odkoupíte zpět za stejnou cenu.",
  },
]

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col">
      <BottomChrome />

      {/* Hero */}
      <section className="relative flex flex-col bg-gradient-to-b from-emerald-500 via-primary to-emerald-950 min-h-[100dvh] lg:min-h-0 lg:pt-0">
        <Header />

        <div className="absolute inset-0 opacity-20 pointer-events-none overflow-hidden">
          <div className="absolute top-24 left-8 w-56 sm:w-80 h-56 sm:h-80 rounded-full bg-gold blur-3xl animate-pulse" />
          <div className="absolute bottom-16 right-4 w-72 sm:w-[28rem] h-72 sm:h-[28rem] rounded-full bg-emerald-200/40 blur-3xl" />
        </div>

        <div className="container mx-auto px-4 pt-28 pb-8 lg:py-10 lg:pt-28 flex-1 flex flex-col relative z-10">
          <div className="flex-1 flex flex-col lg:flex-row lg:items-center gap-8 lg:gap-12">
            <div className="text-card space-y-4 text-center lg:text-left order-1 lg:flex-1 animate-fade-up">
              <p className="font-display text-gold text-sm sm:text-base font-bold tracking-wide uppercase">
                Autocash
              </p>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-bold leading-[1.1] text-balance">
                Potřebujete peníze.
                <span className="block text-gold mt-1">Auto nemusíte prodat napořád.</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-card/85 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Hotovost výměnou za přepis vozu — a dál jezdíte. Do 24 hodin. Bez bankovních her. Po celé ČR.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-5 pt-1">
                {["Do 24 hodin", "Jezdíte dál", "Celá ČR"].map((label) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                    <span className="text-card/90 text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex justify-center lg:justify-start">
                <a
                  href="#formular"
                  className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3.5 text-sm sm:text-base font-bold text-gold-foreground shadow-lg shadow-black/20 transition-all hover:bg-gold/90 active:scale-[0.98]"
                >
                  Chci peníze za auto
                </a>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end order-2 lg:flex-1 animate-fade-up-delay">
              <LoanCalculator />
            </div>
          </div>

          <div className="pt-6 lg:pt-8 border-t border-card/20 mt-6 lg:mt-8">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {benefits.map((benefit) => {
                const IconComponent = benefit.icon
                return (
                  <div key={benefit.title} className="flex flex-col items-center gap-2 text-center">
                    <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-card/15 flex items-center justify-center">
                      <IconComponent className="w-5 h-5 lg:w-6 lg:h-6 text-gold" />
                    </div>
                    <span className="text-card font-semibold text-xs sm:text-sm">{benefit.title}</span>
                    <span className="text-card/70 text-[10px] sm:text-xs hidden lg:block max-w-[180px]">
                      {benefit.description}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 md:hidden">
              <Card className="border-2 border-card/30 shadow-lg bg-card/95">
                <CardContent className="p-4">
                  <h2 className="text-lg font-bold text-foreground mb-4">Přímý kontakt</h2>
                  <a
                    href={`tel:${SITE.phonePrimaryTel}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors mb-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Zavolejte nám</p>
                      <p className="text-base font-bold text-primary group-hover:underline">{SITE.phonePrimary}</p>
                    </div>
                  </a>
                  <a
                    href={`mailto:${SITE.email}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-primary/10 hover:bg-primary/20 transition-colors mb-3 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Mail className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Napište nám</p>
                      <p className="text-sm font-semibold text-primary group-hover:underline">{SITE.email}</p>
                    </div>
                  </a>
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <Clock className="w-5 h-5 text-primary shrink-0" />
                    <p className="text-muted-foreground text-sm">
                      <span className="font-medium text-foreground">{SITE.hours}</span>
                    </p>
                  </div>
                  <div className="mt-4">
                    <ZivefirmyBadge variant="light" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Výhody */}
      <section id="vyhody" className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground text-balance">
              Když potřebujete úlevu — ne další žádost o úvěr
            </h2>
            <p className="mt-4 text-muted-foreground text-base md:text-lg leading-relaxed">
              Autocash je pro situace, kdy banka řekne ne, čas tlačí a auto je vaše nejsilnější karta.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {advantages.map((item) => {
              const Icon = item.icon
              return (
                <div
                  key={item.title}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md hover:border-primary/30 transition-all"
                >
                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">{item.title}</h3>
                  <p className="mt-2 text-muted-foreground leading-relaxed text-sm md:text-base">{item.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Proces */}
      <section id="jak-to-funguje" className="py-16 lg:py-24 bg-secondary/60">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Jak to funguje</h2>
            <p className="mt-4 text-muted-foreground text-base md:text-lg">
              Od poptávky k hotovosti — přehledně, bez zbytečných kol.
            </p>
          </div>
          <div className="max-w-2xl mx-auto">
            <ProcessSteps />
          </div>
          <div className="mt-10 text-center">
            <a
              href="#formular"
              className="inline-flex rounded-xl bg-primary px-6 py-3.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors active:scale-[0.98]"
            >
              Spustit poptávku
            </a>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-24 bg-background">
        <div className="container mx-auto px-4">
          <FaqSection />
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 lg:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <CtaSection />
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
