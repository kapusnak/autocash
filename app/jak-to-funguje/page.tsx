import type { Metadata } from "next"
import Link from "next/link"

import { Header } from "@/components/header"
import { ProcessRail } from "@/components/process-rail"
import { StayVsChange } from "@/components/stay-vs-change"
import { FaqSection } from "@/components/faq-section"
import { CtaSection } from "@/components/cta-section"
import { SiteFooter } from "@/components/site-footer"

export const metadata: Metadata = {
  title: "Jak to funguje",
  description:
    "Poptávka, ocenění vozu, smlouva u poskytovatele, peníze na účet. Autocash — hotovost proti vozu, jezdíte dál.",
}

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-emerald-600 via-primary to-emerald-950 pt-0 pb-12 md:pb-16">
        <Header />
        <div className="container mx-auto px-4 pt-24 md:pt-28">
          <div className="text-center max-w-2xl mx-auto mb-4">
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-4 text-balance">
              Čtyři kroky k hotovosti
            </h1>
            <p className="text-primary-foreground/85 text-base md:text-lg leading-relaxed max-w-md mx-auto">
              Přepis je zajištění. Autem jezdíte dál. Detaily smlouvy řeší poskytovatel.
            </p>
            <Link
              href="/#formular"
              className="mt-6 inline-flex rounded-xl bg-gold px-6 py-3 text-sm font-bold text-gold-foreground hover:bg-gold/90 transition-colors"
            >
              Chci nezávaznou nabídku
            </Link>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4 max-w-5xl">
          <ProcessRail />
        </div>
      </section>

      <section className="py-12 md:py-16 bg-secondary/40">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-10">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Co se mění. Co zůstává.</h2>
          </div>
          <StayVsChange />
        </div>
      </section>

      <section className="pt-8 pb-4 md:pb-6 bg-background">
        <div className="container mx-auto px-4">
          <FaqSection />
        </div>
      </section>

      <section className="py-12 md:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <CtaSection />
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
