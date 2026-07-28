import type { Metadata } from "next"
import Link from "next/link"
import { Cookie, FileText } from "lucide-react"

import { Header } from "@/components/header"
import { SITE } from "@/lib/site"

export const metadata: Metadata = {
  title: "Zásady cookies",
  description: `Zásady cookies — Autocash (${SITE.domain}).`,
}

export default function ZasadyCookiesPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? `https://${SITE.domain}`

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="bg-primary pt-28 pb-12 lg:pt-32 lg:pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">Zásady cookies</h1>
          <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto">
            Tyto Zásady cookies byly naposledy aktualizovány 28/07/2026 a vztahují se na občany a osoby s trvalým
            pobytem v Evropském hospodářském prostoru.
          </p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <article className="legal-content text-foreground">
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4 first:mt-0">
              1. Úvod
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Naše webové stránky{" "}
              <a href={siteUrl} className="text-primary hover:underline">
                {siteUrl}
              </a>{" "}
              (dále jen „web“) používají cookies a další související technologie. Cookies také vkládají třetí strany,
              které jsme zapojili. Níže vás informujeme o používání cookies na našem webu.
            </p>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">
              2. Co jsou soubory cookies?
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Soubor cookie je malý soubor, který je odeslán spolu se stránkami webu a uložen prohlížečem na vašem
              zařízení. Informace v něm uložené mohou být vráceny našim serverům nebo serverům třetích stran.
            </p>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">3. Typy cookies</h2>

            <h3 className="text-lg font-semibold text-foreground mt-8 mb-3">3.1 Technické / funkční</h3>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Zajišťují správné fungování webu (např. formulář, zapamatování souhlasu s cookies). Tyto cookies můžeme
              umístit bez vašeho souhlasu.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-8 mb-3">3.2 Statistické / analytické</h3>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Pomáhají nám pochopit návštěvnost a chování na webu (např. Google Analytics). Ukládáme je po vašem
              souhlasu.
            </p>

            <h3 className="text-lg font-semibold text-foreground mt-8 mb-3">3.3 Marketingové</h3>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Umožňují měření a remarketing reklamních kampaní (např. Google Ads, Seznam Sklik). Ukládáme je po vašem
              souhlasu.
            </p>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">4. Souhlas</h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Při první návštěvě zobrazíme lištu s informací o cookies. Kliknutím na „Rozumím“ potvrzujete seznámení se
              s těmito zásadami. Používání cookies můžete omezit v nastavení prohlížeče; některé části webu pak nemusí
              fungovat správně.
            </p>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">5. Kontakt</h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Dotazy k cookies směřujte na{" "}
              <a href={`mailto:${SITE.email}`} className="text-primary hover:underline">
                {SITE.email}
              </a>
              . Více o zpracování osobních údajů najdete v{" "}
              <Link href="/ochrana-osobnich-udaju" className="text-primary hover:underline">
                Prohlášení o ochraně osobních údajů
              </Link>
              .
            </p>
          </article>
        </div>
      </section>

      <footer className="py-8 bg-background border-t border-border">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-muted-foreground">
            <Link href="/ochrana-osobnich-udaju" className="hover:text-primary transition-colors flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Ochrana osobních údajů
            </Link>
            <Link href="/zasady-cookies" className="hover:text-primary transition-colors flex items-center gap-2">
              <Cookie className="w-4 h-4" />
              Zásady cookies
            </Link>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} Autocash. Všechna práva vyhrazena.
          </p>
        </div>
      </footer>
    </main>
  )
}
