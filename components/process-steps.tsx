import { Banknote, CheckCircle2, FileText, Phone } from "lucide-react"

const vehicleSteps = [
  {
    icon: Phone,
    title: "Poptávka",
    description: "Vyplňte formulář nebo zavolejte. Domluvíme se do pár minut.",
  },
  {
    icon: FileText,
    title: "Ocenění vozu",
    description: "Oceníme reálnou tržní hodnotu a nabídneme maximální možnou hotovost.",
  },
  {
    icon: FileText,
    title: "Smlouva a přepis",
    description: "Podepíšeme smlouvu. V technickém průkazu zůstanete provozovatelem.",
  },
  {
    icon: Banknote,
    title: "Výplata",
    description: "Peníze posíláme okamžitým převodem — často ještě tentýž den.",
  },
  {
    icon: CheckCircle2,
    title: "Jezdíte dál",
    description: "Auto používáte jako dřív. Zpětný odkup je možný kdykoliv za stejnou cenu.",
  },
]

export function ProcessSteps() {
  return (
    <div className="relative">
      <div className="hidden md:block absolute left-8 top-0 bottom-0 w-0.5 bg-border" />
      <div className="space-y-6 md:space-y-8">
        {vehicleSteps.map((step, index) => {
          const Icon = step.icon
          return (
            <div key={step.title} className="relative flex gap-4 md:gap-6">
              <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/25">
                <Icon className="h-7 w-7" />
                <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-xs font-bold text-gold-foreground">
                  {index + 1}
                </span>
              </div>
              <div className="pt-2">
                <h3 className="font-display text-lg md:text-xl font-bold text-foreground">{step.title}</h3>
                <p className="mt-1 text-muted-foreground leading-relaxed max-w-xl">{step.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
