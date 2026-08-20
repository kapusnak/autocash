import { Car, Clock, MapPin, Shield } from "lucide-react"

import { Header } from "@/components/header"
import { LoanCalculator } from "@/components/loan-calculator"
import { BottomChrome } from "@/components/bottom-chrome"
import { ProcessRail } from "@/components/process-rail"
import { StayVsChange } from "@/components/stay-vs-change"
import { FaqSection } from "@/components/faq-section"
import { CtaSection } from "@/components/cta-section"
import { SiteFooter } from "@/components/site-footer"

const chips = [
  { icon: Clock, label: "Peníze do 24 hodin" },
  { icon: Car, label: "S autem jezdíte dál" },
  { icon: Shield, label: "Bez dokládání příjmů" },
  { icon: MapPin, label: "Po celé ČR" },
]

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col">
      <BottomChrome />

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
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl xl:text-[3.25rem] font-bold leading-[1.18] text-balance">
                Získejte peníze za auto
                <span className="block text-gold mt-1">a jezděte s ním dál.</span>
              </h1>
              <p className="text-sm sm:text-base lg:text-lg text-card/85 leading-relaxed max-w-lg mx-auto lg:mx-0">
                Za hodnotu vozu vám poskytovatel vyplatí hotovost a vy auto dál používáte. V technickém průkazu
                zůstáváte provozovatelem — vůz se jen dočasně přepíše, aby byla dohoda zajištěná. Peníze míváte na
                účtu do 24 hodin od podpisu smlouvy.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-3 sm:gap-5 pt-1">
                {chips.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-gold" aria-hidden />
                    <span className="text-card/90 text-sm font-medium">{label}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex justify-center lg:justify-start">
                <a
                  href="#formular"
                  className="inline-flex items-center justify-center rounded-xl bg-gold px-6 py-3.5 text-sm sm:text-base font-bold text-gold-foreground shadow-lg shadow-black/20 transition-all hover:bg-gold/90 active:scale-[0.98]"
                >
                  Chci zjistit, kolik můžu získat
                </a>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end order-2 lg:flex-1 animate-fade-up-delay">
              <LoanCalculator />
            </div>
          </div>
        </div>
      </section>

      <section id="jak-to-funguje" className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Jak to probíhá</h2>
            <p className="mt-3 text-muted-foreground">
              Od poptávky k penězům na účtu. Bez žádosti v bance a bez týdnů čekání.
            </p>
          </div>
          <div className="max-w-5xl mx-auto">
            <ProcessRail />
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-secondary/60">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-10">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">
              Auto vám zůstane k dispozici
            </h2>
            <p className="mt-3 text-muted-foreground">
              Mění se jen zápis v technickém průkazu. Klíče, vůz i každodenní ježdění zůstávají u vás.
            </p>
          </div>
          <div className="max-w-4xl mx-auto">
            <StayVsChange />
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4">
          <FaqSection />
        </div>
      </section>

      <section className="py-12 lg:py-16 bg-background">
        <div className="container mx-auto px-4 max-w-3xl">
          <CtaSection />
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
