"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqs = [
  {
    question: "Pro koho je služba určená?",
    answer:
      "Pro majitele vozidla, kteří potřebují rychle hotovost a nechtějí auto natrvalo prodat. Autem můžete dál jezdit — vůz slouží jako jistota, ne jako zboží do bazaru.",
  },
  {
    question: "Můžu s autem po přepisu dál jezdit?",
    answer:
      "Ano. Vůz se přepíše na nás jen proto, aby byla dohoda zajištěná. Vy zůstáváte provozovatelem a auto používáte jako dřív.",
  },
  {
    question: "Kolik peněz můžu získat?",
    answer:
      "Záleží na značce, roku výroby, stavu a nájezdu. Konkrétní nabídku vám připravíme po ocenění vozu — na webu slibovat přesné procento z ceny nedává smysl.",
  },
  {
    question: "Jak rychle dostanu peníze?",
    answer:
      "Jakmile se dohodneme na částce a podepíšete smlouvu, peníze obvykle dorazí na účet do 24 hodin.",
  },
  {
    question: "Jedná se o půjčku nebo úvěr?",
    answer:
      "Ne, nejde o spotřebitelský úvěr. Za hodnotu auta vám vyplatíme hotovost a vy s vozem dál jezdíte.",
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
