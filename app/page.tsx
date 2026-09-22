import { Header } from "@/components/header"
import { HomeHero } from "@/components/home-hero"
import { BottomChrome } from "@/components/bottom-chrome"
import { QrLetakHomeBeacon } from "@/components/qr-letak-home-beacon"
import { ProcessRail } from "@/components/process-rail"
import { StayVsChange } from "@/components/stay-vs-change"
import { FaqSection } from "@/components/faq-section"
import { CtaSection } from "@/components/cta-section"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col">
      <QrLetakHomeBeacon />
      <BottomChrome />
      <Header />
      <HomeHero />

      <section id="jak-to-funguje" className="py-16 lg:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground">Jak to probíhá</h2>
            <p className="mt-3 text-muted-foreground">
              Od poptávky k penězům na účtu. Bez žádosti v bance. Po odeslání vám přijde e-mail s odkazem — auto
              vyfotíte v mobilu, nic instalovat nemusíte.
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
