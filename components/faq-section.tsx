"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "Pro koho to je?",
    answer: "Pro majitele vozu, který potřebuje rychle hotovost a chce autem dál jezdit.",
  },
  {
    question: "Mohu auto po přepisu dál řídit?",
    answer: "Ano. Přepis je zajištění. V technickém průkazu zůstáváte provozovatelem.",
  },
  {
    question: "Kolik dostanu?",
    answer: "Částka podle vozu. Konkrétní nabídku připraví poskytovatel po ocenění.",
  },
  {
    question: "Jak rychle mám peníze?",
    answer: "Po ocenění a podpisu smlouvy u poskytovatele obvykle do 24 hodin.",
  },
  {
    question: "Je to úvěr?",
    answer: "Ne. Nejde o spotřebitelský úvěr. Autocash zprostředkovává poptávky — smlouvu uzavírá poskytovatel.",
  },
]

export function FaqSection() {
  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground text-center mb-8">
        Krátké odpovědi
      </h2>
      <Accordion type="single" collapsible className="space-y-3">
        {faqs.map((faq, index) => (
          <AccordionItem
            key={faq.question}
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
