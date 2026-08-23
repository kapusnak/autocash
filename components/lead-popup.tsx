"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { toast } from "sonner"

import { sendLead } from "@/lib/send-lead"
import { toFullPhone } from "@/lib/phone-420"
import { PhoneDigitsInput } from "@/components/phone-digits-input"
import { X, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"

const COOKIE_OFFSET_VAR = "--autocash-popup-bottom"

type LeadPopupProps = {
  cookieBarVisible?: boolean
}

export function LeadPopup({ cookieBarVisible = false }: LeadPopupProps) {
  const pathname = usePathname()
  const [isVisible, setIsVisible] = useState(false)
  const [isClosed, setIsClosed] = useState(false)
  const [shouldShake, setShouldShake] = useState(false)
  const [phoneDigits, setPhoneDigits] = useState("")
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "success" | "error">("idle")

  useEffect(() => {
    const showTimer = setTimeout(() => {
      setIsVisible(true)
    }, 12000)
    return () => clearTimeout(showTimer)
  }, [])

  useEffect(() => {
    if (!isVisible || isClosed) return
    const shakeInterval = setInterval(() => {
      setShouldShake(true)
      setTimeout(() => setShouldShake(false), 500)
    }, 8000)
    return () => clearInterval(shakeInterval)
  }, [isVisible, isClosed])

  const handleClose = () => {
    setIsClosed(true)
    setIsVisible(false)
  }

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
      await sendLead({ source: "popup", phone: fullPhone, pagePath: pathname })
      setSubmitStatus("success")
      toast.success("Děkujeme za poptávku", {
        id: "lead-popup-success",
        description: "Brzy vás budeme kontaktovat.",
        duration: 5000,
      })
      setTimeout(() => handleClose(), 1500)
    } catch (e) {
      setSubmitStatus("error")
      const hint = e instanceof Error ? e.message.trim() : ""
      toast.error("Odeslání se nepovedlo", {
        id: "lead-popup-error",
        description:
          hint.length > 0 && hint.length <= 220
            ? hint
            : "Zkuste to znovu nebo zavolejte. Podrobnosti v konzoli (F12).",
        duration: 9000,
      })
    }
  }

  if (!isVisible || isClosed) return null

  const bottomOffset = cookieBarVisible ? "calc(7.5rem + env(safe-area-inset-bottom))" : undefined

  return (
    <>
      <div className="fixed inset-0 bg-black/25 z-40 lg:hidden" onClick={handleClose} />

      <div
        style={
          {
            [COOKIE_OFFSET_VAR]: bottomOffset ?? "0px",
            bottom: bottomOffset ?? undefined,
          } as React.CSSProperties
        }
        className={`
          fixed z-50
          bottom-0 left-0 right-0 max-h-[33vh] animate-slide-in-bottom
          lg:bottom-6 lg:right-6 lg:left-auto lg:max-h-none lg:w-[380px] lg:animate-none
          bg-primary rounded-t-2xl lg:rounded-2xl shadow-2xl border border-white/10
          transition-all duration-300 ease-out
          ${shouldShake ? "animate-shake" : ""}
        `}
      >
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Zavřít"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-4 pb-6 lg:p-6">
          <h3 className="font-display text-lg lg:text-2xl font-bold text-white pr-8">Potřebujete hotovost hned?</h3>
          <p className="text-white/80 text-xs lg:text-sm mt-1 mb-3 lg:mb-4">
            Zanechte číslo. Zavoláme vám, nezávazně vše probereme a řekneme, jak dál.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-2.5 lg:gap-3">
            <div className="flex h-12 min-h-12 w-full items-center gap-2.5 rounded-lg bg-white px-3.5 text-base text-foreground focus-within:ring-2 focus-within:ring-gold lg:h-12">
              <Phone className="size-5 shrink-0 text-muted-foreground" aria-hidden />
              <PhoneDigitsInput
                className="h-full min-w-0 flex-1 gap-2.5 border-0 bg-transparent p-0 text-base shadow-none md:text-base"
                inputClassName="h-full text-base leading-none text-foreground placeholder:text-muted-foreground md:text-base"
                prefixClassName="text-base leading-none text-muted-foreground md:text-base"
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
              className="h-12 min-h-12 w-full rounded-lg px-5 text-base font-bold bg-gold text-gold-foreground hover:bg-gold/90 lg:px-6"
            >
              {submitStatus === "sending"
                ? "Odesílám…"
                : submitStatus === "success"
                  ? "Odesláno"
                  : "Zavolejte mi zdarma"}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
