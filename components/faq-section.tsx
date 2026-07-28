"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "Pro koho je Autocash určen?",
    answer:
      "Pro majitele vozidel, kteří potřebují rychlou hotovost. Financujeme osobní, užitková i nákladní vozidla, obytné vozy, motocykly a veterány.",
  },
  {
    question: "Prověřujete registry a úvěruschopnost?",
    answer:
      "Nezkoumáme finanční historii ani bankovní registry tak přísně jako banky. Překážkou je aktivní exekuce nebo probíhající insolvence — ukončená insolvence není problém.",
  },
  {
    question: "Mohu auto po přepisu dál řídit?",
    answer:
      "Ano. Vozidlo používáte dál a v technickém průkazu zůstáváte provozovatelem. Přepis slouží jako zajištění financování.",
  },
  {
    question: "Kolik % z ceny vozu mohu získat?",
    answer:
      "Obvykle až kolem 90 % reálné tržní hodnoty — záleží na značce, roku, stavu a kilometrech. Konkrétní nabídku připravíme po ocenění.",
  },
  {
    question: "Kdy si mohu vůz odkoupit zpět?",
    answer:
      "Kdykoliv. Zpětný odkup je za stejnou cenu, za jakou byl vůz vykoupen — bez skrytých pastí.",
  },
  {
    question: "Jak rychle dostanu peníze?",
    answer:
      "Po dohodě a kontrole vozu často do 24 hodin. Peníze posíláme okamžitým převodem na účet.",
  },
]

export function FaqSection() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
        Často kladené otázky
      </h2>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="bg-card border border-border rounded-xl px-4 md:px-6 shadow-sm"
          >
            <AccordionTrigger className="text-left font-semibold text-foreground py-4 md:py-5 hover:no-underline">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 md:pb-5 leading-relaxed">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  )
}
