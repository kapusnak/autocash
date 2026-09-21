"use client"

import { useEffect, useRef, useState } from "react"
import { Banknote, ClipboardCheck, FilePenLine, Send } from "lucide-react"

const STEPS = [
  {
    icon: Send,
    title: "Pošlete poptávku",
    hint: "Vyplníte krátký formulář nebo zavoláte. Ozveme se vám a probereme detaily.",
  },
  {
    icon: ClipboardCheck,
    title: "Oceníme vůz",
    hint: "Posoudíme značku, rok výroby, stav a nájezd a připravíme vám konkrétní nabídku.",
  },
  {
    icon: FilePenLine,
    title: "Podepíšete smlouvu",
    hint: "Smlouvu uzavřeme s vámi. Vůz se přepíše na nás, vy zůstáváte provozovatelem a autem dál jezdíte.",
  },
  {
    icon: Banknote,
    title: "Peníze na účet",
    hint: "Po podpisu vám pošleme dohodnutou částku, obvykle do 24 hodin.",
  },
] as const

export function ProcessRail() {
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
      { threshold: 0.25 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className={visible ? "rail-visible" : "rail-pending"}>
      <ol className="relative grid gap-8 md:grid-cols-4 md:gap-4">
        <div
          className="rail-line pointer-events-none absolute left-8 top-8 bottom-8 w-px bg-border md:left-[12.5%] md:right-[12.5%] md:top-8 md:bottom-auto md:h-px md:w-auto"
          aria-hidden
        />
        {STEPS.map((step, index) => {
          const Icon = step.icon
          return (
            <li
              key={step.title}
              className="rail-step relative z-10 flex gap-4 md:flex-col md:items-center md:text-center"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                <Icon className="h-7 w-7" aria-hidden />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-gold-foreground">
                  {index + 1}
                </span>
              </div>
              <div className="pt-2 md:pt-3">
                <h3 className="font-display text-lg font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.hint}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
