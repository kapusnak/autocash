"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

import { sendLead } from "@/lib/emailjs"
import { toFullPhone } from "@/lib/phone-420"
import { PhoneDigitsInput } from "@/components/phone-digits-input"
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  const pathname = usePathname()
  const [phoneDigits, setPhoneDigits] = useState("")
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "success" | "error">("idle")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fullPhone = toFullPhone(phoneDigits)
    if (!fullPhone) {
      toast.error("Zadejte platné telefonní číslo (9 číslic).", {
        id: "lead-phone-invalid",
        duration: 6500,
      })
      return
    }
    setSubmitStatus("sending")
    try {
      await sendLead({ source: "cta", phone: fullPhone, pagePath: pathname })
      setSubmitStatus("success")
      toast.success("Děkujeme za poptávku", {
        id: "lead-cta-success",
        description: "Brzy vás budeme kontaktovat.",
        duration: 5000,
      })
    } catch (e) {
      setSubmitStatus("error")
      const hint = e instanceof Error ? e.message.trim() : ""
      toast.error("Odeslání se nepovedlo", {
        id: "lead-cta-error",
        description:
          hint.length > 0 && hint.length <= 220
            ? hint
            : "Zkuste to znovu nebo zavolejte. Podrobnosti v konzoli (F12).",
        duration: 9000,
      })
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-emerald-600 via-primary to-emerald-950 p-6 md:p-10 text-center">
      <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gold/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-emerald-300/10 blur-3xl" />

      <h2 className="relative font-display text-2xl md:text-3xl font-bold text-primary-foreground mb-2">
        Potřebujete peníze rychle?
      </h2>
      <p className="relative text-primary-foreground/85 mb-6 md:mb-8 max-w-md mx-auto">
        Zanechte telefonní číslo. Ozveme se vám, probereme vůz a předáme vás poskytovateli. Auto zatím zůstává u vás.
      </p>

      <form onSubmit={handleSubmit} className="relative flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
        <div className="flex flex-1 min-w-0 h-12 md:h-14 items-center gap-2 rounded-md bg-card pl-3 pr-4 text-foreground focus-within:ring-2 focus-within:ring-gold">
          <Phone className="w-5 h-5 shrink-0 text-muted-foreground" aria-hidden />
          <PhoneDigitsInput
            className="min-w-0 flex-1 border-0 bg-transparent p-0 shadow-none h-full"
            inputClassName="text-foreground placeholder:text-muted-foreground"
            prefixClassName="text-muted-foreground"
            value={phoneDigits}
            onChange={setPhoneDigits}
            autoComplete="off"
            name="phone"
            aria-label="Telefonní číslo (9 číslic bez předvolby)"
          />
        </div>
        <Button
          type="submit"
          disabled={submitStatus === "sending"}
          className="h-12 md:h-14 px-6 md:px-8 bg-gold hover:bg-gold/90 text-gold-foreground font-bold text-base shadow-lg"
        >
          {submitStatus === "sending" ? "Odesílám…" : submitStatus === "success" ? "Odesláno" : "Zavolejte mi"}
        </Button>
      </form>
      <p className="relative text-sm text-primary-foreground/80 mt-4 max-w-md mx-auto">
        Zadáním telefonu souhlasíte s{" "}
        <Link
          href="/ochrana-osobnich-udaju"
          className="text-primary-foreground underline underline-offset-2 hover:opacity-90"
        >
          ochranou osobních údajů
        </Link>
        .
      </p>
    </div>
  )
}
