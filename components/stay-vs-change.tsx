"use client"

import { useEffect, useRef, useState } from "react"
import { ArrowRight, Check, Undo2 } from "lucide-react"

export function StayVsChange() {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.35 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={visible ? "tp-visible" : "tp-pending"}>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="grid lg:grid-cols-2">
          <div className="flex items-center justify-center border-b border-border bg-secondary/50 p-6 md:p-8 lg:border-b-0 lg:border-r">
            <TpDocument />
          </div>

          <div className="flex flex-col justify-center gap-6 p-6 md:p-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Co se změní</p>
              <h3 className="font-display mt-1.5 text-lg font-bold text-foreground">
                Vlastníkem se dočasně staneme my
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Zápis vlastníka je zajištěním celé dohody. Auto tím neprodáváte do bazaru ani nikam neodevzdáváte —
                změní se jedna kolonka v dokladech.
              </p>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-primary">Co zůstane stejné</p>
              <h3 className="font-display mt-1.5 text-lg font-bold text-foreground">
                Provozovatelem zůstáváte vy
              </h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                Klíče i vůz máte pořád u sebe a jezdíte stejně jako dřív. Ve vašem každodenním provozu se nic nemění.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 border-t border-border bg-secondary/30 px-6 py-4 md:px-8">
          <Undo2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nejde o trvalý prodej. Zpětný odkup je od začátku součástí dohody — konkrétní podmínky vám řekneme hned po
            ocenění vozu.
          </p>
        </div>
      </div>
    </div>
  )
}

function TpDocument() {
  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-background shadow-sm">
      <div className="border-b border-border px-5 py-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Technický průkaz</p>
      </div>

      <div className="px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Vlastník</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="tp-old relative text-sm font-semibold text-foreground">
            Vy
            <span className="tp-strike absolute left-0 right-0 top-1/2 h-[2px] rounded bg-foreground/70" aria-hidden />
          </span>
          <ArrowRight className="tp-anim h-4 w-4 text-muted-foreground" style={{ animationDelay: "0.85s" }} aria-hidden />
          <span
            className="tp-anim inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground"
            style={{ animationDelay: "1s" }}
          >
            My
          </span>
          <span
            className="tp-anim rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold text-gold-foreground"
            style={{ animationDelay: "1.25s" }}
          >
            dočasně
          </span>
        </div>
      </div>

      <div className="border-t border-dashed border-border px-5 py-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Provozovatel</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-foreground">Vy</span>
          <span
            className="tp-anim inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary"
            style={{ animationDelay: "1.55s" }}
          >
            <Check className="h-3 w-3" aria-hidden />
            zůstává
          </span>
        </div>
      </div>
    </div>
  )
}
