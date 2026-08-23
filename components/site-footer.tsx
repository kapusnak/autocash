import Link from "next/link"
import { Cookie, FileText, Mail, Phone } from "lucide-react"

import { SITE } from "@/lib/site"
import { ZivefirmyBadge } from "@/components/zivefirmy-badge"

export function SiteFooter() {
  return (
    <footer id="kontakty" className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img
                src="/logo-autocash.png"
                alt=""
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="font-display text-2xl font-bold">Autocash</span>
            </div>
            <p className="text-primary-foreground/75 text-sm leading-relaxed max-w-xs">
              Vyplatíme vám hotovost za hodnotu auta. S vozem přitom můžete dál jezdit.
            </p>
            <div className="mt-5">
              <ZivefirmyBadge variant="dark" />
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg mb-4">Kontakt</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${SITE.phonePrimaryTel}`}
                  className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-gold transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  {SITE.phonePrimary}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${SITE.email}`}
                  className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-gold transition-colors"
                >
                  <Mail className="h-4 w-4" />
                  {SITE.email}
                </a>
              </li>
              <li className="text-primary-foreground/70 pt-1">{SITE.hours}</li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-lg mb-4">Právní informace</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  href="/ochrana-osobnich-udaju"
                  className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-gold transition-colors"
                >
                  <FileText className="h-4 w-4" />
                  Ochrana osobních údajů
                </Link>
              </li>
              <li>
                <Link
                  href="/zasady-cookies"
                  className="inline-flex items-center gap-2 text-primary-foreground/90 hover:text-gold transition-colors"
                >
                  <Cookie className="h-4 w-4" />
                  Zásady cookies
                </Link>
              </li>
            </ul>
            <p className="mt-6 text-xs text-primary-foreground/60 leading-relaxed">
              {SITE.controller.name}, IČ {SITE.controller.ico}
              <br />
              {SITE.controller.address}
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-white/15 pt-6 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between text-xs text-primary-foreground/55">
          <p>© {new Date().getFullYear()} Autocash. Všechna práva vyhrazena.</p>
          <p>
            Nejde o spotřebitelský úvěr. Smlouvu uzavíráme s vámi a auto dál používáte.
          </p>
        </div>
      </div>
    </footer>
  )
}
