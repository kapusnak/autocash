import type { Metadata } from "next"
import { Building2, Clock, FileText, Mail, MapPin, Phone } from "lucide-react"

import { Header } from "@/components/header"
import { CtaSection } from "@/components/cta-section"
import { SiteFooter } from "@/components/site-footer"
import { ZivefirmyBadge } from "@/components/zivefirmy-badge"
import { Card, CardContent } from "@/components/ui/card"
import { SITE } from "@/lib/site"

export const metadata: Metadata = {
  title: "Kontakty",
  description: `Kontaktujte Autocash: ${SITE.phonePrimary}, ${SITE.email}. ${SITE.hours}.`,
}

export default function KontaktyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="bg-gradient-to-b from-emerald-600 via-primary to-emerald-950 pt-28 pb-16 lg:pt-32 lg:pb-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4">
            Jsme tu pro vás
          </h1>
          <p className="text-white/85 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Potřebujete hotovost za auto?
            <br />
            Zavolejte nebo napište — odpovídáme obratem.
          </p>
        </div>
      </section>

      <section className="pt-12 lg:pt-16 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
            <Card className="border-2 border-primary/20 shadow-lg">
              <CardContent className="p-6 lg:p-8">
                <h2 className="font-display text-xl font-bold text-foreground mb-6">Přímý kontakt</h2>

                <a
                  href={`tel:${SITE.phonePrimaryTel}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors mb-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Hlavní linka</p>
                    <p className="text-xl lg:text-2xl font-bold text-primary group-hover:underline">
                      {SITE.phonePrimary}
                    </p>
                  </div>
                </a>

                <a
                  href={`tel:${SITE.phoneSecondaryTel}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors mb-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Phone className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Alternativní linka</p>
                    <p className="text-xl lg:text-2xl font-bold text-primary group-hover:underline">
                      {SITE.phoneSecondary}
                    </p>
                  </div>
                </a>

                <a
                  href={`mailto:${SITE.email}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-primary/5 hover:bg-primary/10 transition-colors mb-4 group"
                >
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">E-mail</p>
                    <p className="text-lg font-semibold text-primary group-hover:underline">{SITE.email}</p>
                  </div>
                </a>

                <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50">
                  <Clock className="w-5 h-5 text-primary" />
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">{SITE.hours}</span>
                  </p>
                </div>

                <div className="mt-6">
                  <ZivefirmyBadge variant="light" />
                </div>
              </CardContent>
            </Card>

            <Card className="border border-border shadow-lg">
              <CardContent className="p-6 lg:p-8">
                <h2 className="font-display text-xl font-bold text-foreground mb-6">Provozovatel</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Jméno</p>
                      <p className="font-semibold text-foreground">{SITE.controller.name}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">IČ</p>
                      <p className="font-semibold text-foreground">{SITE.controller.ico}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Sídlo</p>
                      <p className="font-semibold text-foreground">{SITE.controller.address}</p>
                    </div>
                  </div>
                </div>
                <p className="mt-8 text-xs text-muted-foreground leading-relaxed">
                  Nejedná se o spotřebitelský úvěr. Autocash zprostředkovává poptávky — smlouvu uzavírá poskytovatel.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-3xl mx-auto mt-12">
            <CtaSection />
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  )
}
