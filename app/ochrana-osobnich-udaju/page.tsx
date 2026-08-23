import type { Metadata } from "next"
import Link from "next/link"
import { Cookie, FileText } from "lucide-react"

import { Header } from "@/components/header"
import { SITE } from "@/lib/site"

export const metadata: Metadata = {
  title: "Ochrana osobních údajů",
  description: "Prohlášení o ochraně osobních údajů pro poptávky financování vozidel — Autocash.",
}

export default function OchranaOsobnichUdajuPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="bg-primary pt-28 pb-12 lg:pt-32 lg:pb-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
            Prohlášení o ochraně osobních údajů
          </h1>
          <p className="text-white/80 text-sm md:text-base">Datum účinnosti: 7. května 2026</p>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <article className="legal-content text-foreground">
            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4 first:mt-0">
              1. Úvod
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Tento dokument obsahuje informace o tom, jak subjekt{" "}
              <strong className="text-foreground">{SITE.controller.name}</strong>, IČ: {SITE.controller.ico}, se
              sídlem {SITE.controller.address} (dále jen &quot;Provozovatel&quot; nebo &quot;my&quot;), jako správce
              osobních údajů, zpracovává vaše osobní údaje v souladu s nařízením (EU) 2016/679 (GDPR) a dalšími
              platnými právními předpisy. Tyto stránky Autocash slouží k poptávkám na financování zajištěné vozidlem.
            </p>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">
              2. Jaké osobní údaje zpracováváme
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Pro účely zpracování poptávky prostřednictvím našeho webového formuláře zpracováváme následující údaje:
            </p>
            <ul className="list-disc pl-6 text-base text-muted-foreground leading-relaxed space-y-2 mb-6">
              <li>Jméno a příjmení</li>
              <li>E-mailová adresa</li>
              <li>Telefonní číslo</li>
              <li>Značka a model vozu</li>
              <li>Rok výroby vozu</li>
              <li>Počet najetých kilometrů</li>
              <li>VIN (nepovinné)</li>
              <li>Požadovaná částka</li>
              <li>
                Fotografie vozu (zepředu, zezadu, z boku, interiér, nákladový prostor) — na fotkách může být vidět
                registrační značka
              </li>
            </ul>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">
              3. Jak vaše údaje získáváme
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Vaše osobní údaje získáváme prostřednictvím webového formuláře, nahrání fotografií vozu po odeslání
              poptávky a telefonních poptávek na našich stránkách.
            </p>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">
              4. Účely a právní základ zpracování
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Vaše údaje slouží k posouzení poptávky a přípravě nabídky na služby zajištěného financování vozidly.
            </p>
            <ul className="list-disc pl-6 text-base text-muted-foreground leading-relaxed space-y-2 mb-6">
              <li>
                čl. 6 odst. 1 písm. b) GDPR — zpracování je nezbytné pro provedení opatření před uzavřením smlouvy na
                vaši žádost.
              </li>
              <li>
                čl. 6 odst. 1 písm. f) GDPR — oprávněný zájem Provozovatele na komunikaci se zákazníkem a zajištění
                provozu služeb.
              </li>
            </ul>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">
              5. Předání osobních údajů třetím stranám
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Pro účely posouzení poptávky a přípravy nabídky můžeme vaše
              osobní údaje předat <strong className="text-foreground">smluvním partnerům</strong> (příjemcům údajů), se
              kterými spolupracujeme. Jedná se zejména o podnikatele působící v oblasti služeb souvisejících s vozidly
              a zajištěným financováním. Konkrétní identitu příjemce vám v případě předání údajů obvykle sdělíme v
              rámci komunikace ohledně vaší poptávky.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Kromě výše uvedeného mohou být údaje předány také poskytovatelům technických a provozních služeb
              (hosting, e-mailové nástroje, analytika). Údaje dále předáváme jen tehdy, když nám to ukládá zákon nebo
              rozhodnutí veřejné moci.
            </p>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">
              6. Doba uchování údajů
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Osobní údaje jsou uchovávány po dobu nezbytně nutnou ke zpracování nabídky a komunikaci s klientem,
              nejdéle však po dobu 6 měsíců, pokud nebude zahájena smluvní spolupráce.
            </p>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">
              7. Cookies a online sledování
            </h2>
            <ul className="list-disc pl-6 text-base text-muted-foreground leading-relaxed space-y-2 mb-6">
              <li>Analytické cookies — Google Analytics (sledování návštěvnosti).</li>
              <li>Reklamní cookies — Seznam Sklik a Google Ads (cílení reklamy a remarketing).</li>
              <li>Funkční cookies — zajišťující správné fungování formuláře a webu.</li>
            </ul>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Podrobnosti najdete v{" "}
              <Link href="/zasady-cookies" className="text-primary hover:underline">
                Zásadách cookies
              </Link>
              .
            </p>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">
              8. Zabezpečení údajů
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-4">
              Přijali jsme odpovídající technická a organizační opatření, aby vaše údaje byly v bezpečí a nebyly
              zneužity, ztraceny nebo neoprávněně zpřístupněny.
            </p>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">9. Vaše práva</h2>
            <ul className="list-disc pl-6 text-base text-muted-foreground leading-relaxed space-y-2 mb-6">
              <li>právo na přístup k osobním údajům,</li>
              <li>právo na opravu nepřesných údajů,</li>
              <li>právo na výmaz (tzv. právo být zapomenut),</li>
              <li>právo na omezení zpracování,</li>
              <li>právo vznést námitku proti zpracování,</li>
              <li>právo na přenositelnost údajů.</li>
            </ul>

            <h2 className="font-display text-xl md:text-2xl font-bold text-foreground mt-12 mb-4">
              10. Kontakt na Provozovatele
            </h2>
            <ul className="list-none pl-0 text-base text-muted-foreground leading-relaxed space-y-2">
              <li>
                {SITE.controller.name}, IČ: {SITE.controller.ico}
              </li>
              <li>{SITE.controller.address}</li>
              <li>
                <a href={`mailto:${SITE.email}`} className="text-primary no-underline hover:underline">
                  {SITE.email}
                </a>
              </li>
              <li>{SITE.phonePrimary}</li>
            </ul>
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
