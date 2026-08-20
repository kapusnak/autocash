"use client"

import type React from "react"

import { useCallback, useRef, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"
import Link from "next/link"

import { sendLead } from "@/lib/emailjs"
import { toFullPhone } from "@/lib/phone-420"
import { Card, CardContent } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { PhoneDigitsInput } from "@/components/phone-digits-input"
import { cn } from "@/lib/utils"
import { Check, Loader2, Lock } from "lucide-react"

const LOCK_THRESHOLD_PX = 10

function SliderTouchLock({
  minIndex,
  maxIndex,
  valueIndex,
  onValueChange,
  children,
}: {
  minIndex: number
  maxIndex: number
  valueIndex: number
  onValueChange: (index: number) => void
  children: React.ReactNode
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<{ x: number; y: number } | null>(null)
  const lockedRef = useRef<"horizontal" | "vertical" | null>(null)

  const clampIndex = useCallback(
    (i: number) => Math.max(minIndex, Math.min(maxIndex, Math.round(i))),
    [minIndex, maxIndex],
  )

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    if (!t) return
    startRef.current = { x: t.clientX, y: t.clientY }
    lockedRef.current = null
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const t = e.touches[0]
      const track = trackRef.current
      if (!t || !track) return

      const dx = t.clientX - (startRef.current?.x ?? t.clientX)
      const dy = t.clientY - (startRef.current?.y ?? t.clientY)

      if (lockedRef.current === null) {
        const adx = Math.abs(dx)
        const ady = Math.abs(dy)
        if (adx + ady < LOCK_THRESHOLD_PX) return
        lockedRef.current = adx >= ady ? "horizontal" : "vertical"
      }

      if (lockedRef.current === "vertical") return

      e.preventDefault()
      const rect = track.getBoundingClientRect()
      const ratio = (t.clientX - rect.left) / rect.width
      const index = clampIndex(ratio * (maxIndex - minIndex) + minIndex)
      onValueChange(index)
    },
    [minIndex, maxIndex, clampIndex, onValueChange],
  )

  const handleTouchEnd = useCallback(() => {
    startRef.current = null
    lockedRef.current = null
  }, [])

  return (
    <div
      ref={trackRef}
      className="relative w-full"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      style={{ touchAction: "pan-y" }}
    >
      {children}
      <div
        className="absolute inset-0 z-10 pointer-events-none [@media(hover:none)]:pointer-events-auto"
        aria-hidden
      />
    </div>
  )
}

const CAR_RANGE = { min: 50000, max: 5000000 }

const CAR_AMOUNT_VALUES = (() => {
  const low: number[] = []
  for (let v = 50000; v <= 500000; v += 10000) low.push(v)
  const high: number[] = []
  for (let v = 600000; v <= 5000000; v += 100000) high.push(v)
  return [...low, ...high]
})()

function snapToCarValue(value: number): number {
  if (value <= CAR_AMOUNT_VALUES[0]) return CAR_AMOUNT_VALUES[0]
  if (value >= CAR_AMOUNT_VALUES[CAR_AMOUNT_VALUES.length - 1])
    return CAR_AMOUNT_VALUES[CAR_AMOUNT_VALUES.length - 1]
  let i = 0
  while (i < CAR_AMOUNT_VALUES.length - 1 && CAR_AMOUNT_VALUES[i + 1] < value) i += 1
  const a = CAR_AMOUNT_VALUES[i]
  const b = CAR_AMOUNT_VALUES[i + 1]
  return value - a <= b - value ? a : b
}

function carAmountToIndex(value: number): number {
  const snapped = snapToCarValue(value)
  const idx = CAR_AMOUNT_VALUES.indexOf(snapped)
  return idx >= 0 ? idx : 0
}

const DEFAULT_CAR_AMOUNT = 100000

const calculatorSchema = z
  .object({
    email: z.string(),
    phoneDigits: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    vehicleModel: z.string(),
    year: z.string(),
    mileage: z.string(),
    vin: z.string(),
    vehicleAmountCzk: z.number(),
  })
  .superRefine((data, ctx) => {
    if (!z.string().email().safeParse(data.email.trim()).success) {
      ctx.addIssue({ code: "custom", message: "Zadejte platný e-mail.", path: ["email"] })
    }
    if (toFullPhone(data.phoneDigits) === "") {
      ctx.addIssue({
        code: "custom",
        message: "Zadejte platné telefonní číslo (9 číslic).",
        path: ["phoneDigits"],
      })
    }
    if (data.firstName.trim().length < 1) {
      ctx.addIssue({ code: "custom", message: "Zadejte jméno.", path: ["firstName"] })
    }
    if (data.lastName.trim().length < 1) {
      ctx.addIssue({ code: "custom", message: "Zadejte příjmení.", path: ["lastName"] })
    }
    if (data.vehicleModel.trim().length < 1) {
      ctx.addIssue({ code: "custom", message: "Zadejte značku a model.", path: ["vehicleModel"] })
    }
    if (data.year.trim().length < 2) {
      ctx.addIssue({ code: "custom", message: "Zadejte rok výroby.", path: ["year"] })
    }
    if (data.mileage.trim().length < 1) {
      ctx.addIssue({ code: "custom", message: "Zadejte počet kilometrů.", path: ["mileage"] })
    }
    if (data.vehicleAmountCzk < CAR_RANGE.min || data.vehicleAmountCzk > CAR_RANGE.max) {
      ctx.addIssue({ code: "custom", message: "Neplatná částka.", path: ["vehicleAmountCzk"] })
    }
  })

type CalculatorFormValues = z.infer<typeof calculatorSchema>

function emptyFields(): CalculatorFormValues {
  return {
    firstName: "",
    lastName: "",
    vehicleModel: "",
    year: "",
    mileage: "",
    vin: "",
    vehicleAmountCzk: snapToCarValue(DEFAULT_CAR_AMOUNT),
    email: "",
    phoneDigits: "",
  }
}

const phoneInputWrapperClass =
  "flex h-11 w-full items-center rounded-md border border-border bg-secondary px-3 text-sm shadow-sm outline-none transition-[color,box-shadow] focus-within:ring-[3px] focus-within:ring-ring/50 focus-within:border-ring"

const requiredStar = <span className="text-red-600">*</span>

export function LoanCalculator() {
  const [submitStatus, setSubmitStatus] = useState<"idle" | "sending" | "success" | "error">("idle")

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: emptyFields(),
    mode: "onSubmit",
    reValidateMode: "onSubmit",
  })

  const vehicleAmountCzk = form.watch("vehicleAmountCzk")

  const formatAmount = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1).replace(".0", "")} mil. Kč`
    }
    return `${(value / 1000).toFixed(0)} tis. Kč`
  }

  const formatRangeLabel = (value: number) => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(0)} mil. Kč`
    }
    return `${(value / 1000).toFixed(0)} tis. Kč`
  }

  const maxIdxCar = CAR_AMOUNT_VALUES.length - 1
  const valueIndexCar = carAmountToIndex(vehicleAmountCzk)

  const onSubmit = async (values: CalculatorFormValues) => {
    if (submitStatus === "success") return
    const phone = toFullPhone(values.phoneDigits)
    if (!phone) return
    setSubmitStatus("sending")
    try {
      const name = `${values.firstName.trim()} ${values.lastName.trim()}`.trim()
      const amount = snapToCarValue(values.vehicleAmountCzk)
      const vinPart = values.vin.trim() ? `, VIN ${values.vin.trim()}` : ""
      const serviceType = `Peníze ihned a jezděte dál — ${values.vehicleModel.trim()}, r.v. ${values.year.trim()}, ${values.mileage.trim()} km${vinPart}`

      await sendLead({
        source: "calculator",
        phone,
        email: values.email.trim(),
        name,
        amount,
        assetType: "Automobil",
        serviceType,
      })
      setSubmitStatus("success")
      toast.success("Děkujeme za poptávku", {
        id: "lead-calculator-success",
        description: "Brzy vás budeme kontaktovat. Zkontrolujte prosím i složku s nevyžádanou poštou.",
        duration: 5000,
      })
      form.reset({
        ...emptyFields(),
        email: values.email,
        phoneDigits: values.phoneDigits,
      })
    } catch (e) {
      setSubmitStatus("error")
      const hint = e instanceof Error ? e.message.trim() : ""
      const description =
        hint.length > 0 && hint.length <= 220
          ? hint
          : "Zkuste to prosím znovu nebo nás kontaktujte telefonicky. Podrobnosti jsou v konzoli prohlížeče (F12)."
      toast.error("Odeslání se nepovedlo", {
        id: "lead-calculator-error",
        description,
        duration: 9000,
      })
    }
  }

  return (
    <Card id="formular" className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md shadow-2xl border-0 bg-card scroll-mt-28">
      <CardContent className="px-4 sm:px-5 py-4 sm:py-5">
        <div className="mb-4">
          <h3 className="font-display text-lg font-semibold text-card-foreground">Chci nezávaznou nabídku</h3>
          <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[11px] font-medium text-emerald-800">Specialisté online • Kapacita volná</span>
          </div>
        </div>

        <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="vehicle-model" className="text-sm font-medium text-muted-foreground">
              Značka a model vozu {requiredStar}
            </Label>
            <Input
              id="vehicle-model"
              className="bg-secondary border-border h-11 text-sm"
              aria-invalid={Boolean(form.formState.errors.vehicleModel)}
              aria-describedby={form.formState.errors.vehicleModel ? "vehicle-model-error" : undefined}
              {...form.register("vehicleModel")}
            />
            <p className="text-xs text-muted-foreground">Např. Škoda Fabia</p>
            {form.formState.errors.vehicleModel && (
              <p id="vehicle-model-error" className="mt-1 text-sm text-red-600">
                {form.formState.errors.vehicleModel.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="vehicle-year" className="text-sm font-medium text-muted-foreground">
                Rok výroby {requiredStar}
              </Label>
              <Input
                id="vehicle-year"
                inputMode="numeric"
                className="bg-secondary border-border h-11 text-sm"
                aria-invalid={Boolean(form.formState.errors.year)}
                {...form.register("year")}
              />
              {form.formState.errors.year && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.year.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="vehicle-km" className="text-sm font-medium text-muted-foreground">
                Najeté km {requiredStar}
              </Label>
              <Input
                id="vehicle-km"
                inputMode="numeric"
                className="bg-secondary border-border h-11 text-sm"
                aria-invalid={Boolean(form.formState.errors.mileage)}
                {...form.register("mileage")}
              />
              {form.formState.errors.mileage && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.mileage.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="vehicle-vin" className="text-sm font-medium text-muted-foreground">
              VIN (nepovinné)
            </Label>
            <Input id="vehicle-vin" className="bg-secondary border-border h-11 text-sm" {...form.register("vin")} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Požadovaná částka</Label>
              <span className="text-base font-bold text-primary">{formatAmount(snapToCarValue(vehicleAmountCzk))}</span>
            </div>
            <SliderTouchLock
              minIndex={0}
              maxIndex={maxIdxCar}
              valueIndex={valueIndexCar}
              onValueChange={(i) => form.setValue("vehicleAmountCzk", CAR_AMOUNT_VALUES[i])}
            >
              <Slider
                value={[valueIndexCar]}
                onValueChange={([i]) => form.setValue("vehicleAmountCzk", CAR_AMOUNT_VALUES[i])}
                min={0}
                max={maxIdxCar}
                step={1}
                className="w-full"
              />
            </SliderTouchLock>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatRangeLabel(CAR_RANGE.min)}</span>
              <span>{formatRangeLabel(CAR_RANGE.max)}</span>
            </div>
            <Controller
              name="vehicleAmountCzk"
              control={form.control}
              render={({ field }) => <input type="hidden" {...field} value={field.value} readOnly />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="first-name" className="text-sm font-medium text-muted-foreground">
                Jméno {requiredStar}
              </Label>
              <Input
                id="first-name"
                autoComplete="given-name"
                className="bg-secondary border-border h-11 text-sm"
                {...form.register("firstName")}
              />
              {form.formState.errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="last-name" className="text-sm font-medium text-muted-foreground">
                Příjmení {requiredStar}
              </Label>
              <Input
                id="last-name"
                autoComplete="family-name"
                className="bg-secondary border-border h-11 text-sm"
                {...form.register("lastName")}
              />
              {form.formState.errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{form.formState.errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone-voz" className="text-sm font-medium text-muted-foreground">
              Telefonní číslo {requiredStar}
            </Label>
            <PhoneDigitsInput
              id="phone-voz"
              className={phoneInputWrapperClass}
              inputClassName="placeholder:text-muted-foreground"
              value={form.watch("phoneDigits")}
              onChange={(v) => form.setValue("phoneDigits", v)}
              aria-invalid={Boolean(form.formState.errors.phoneDigits)}
            />
            {form.formState.errors.phoneDigits && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.phoneDigits.message}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="email-voz" className="text-sm font-medium text-muted-foreground">
              E-mail {requiredStar}
            </Label>
            <Input
              id="email-voz"
              type="email"
              autoComplete="email"
              className="bg-secondary border-border h-11 text-sm"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="mt-1 text-sm text-red-600">{form.formState.errors.email.message}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Odesláním poptávky souhlasíte s naším{" "}
            <Link href="/ochrana-osobnich-udaju" className="text-primary hover:underline">
              Prohlášením o ochraně osobních údajů
            </Link>
            .
          </p>

          <Button
            type="submit"
            size="lg"
            disabled={submitStatus === "sending" || submitStatus === "success"}
            aria-busy={submitStatus === "sending"}
            className={cn(
              "w-full text-sm sm:text-base font-bold h-auto min-h-12 py-3 px-4 rounded-lg text-balance transition-all disabled:pointer-events-none flex items-center justify-center gap-2",
              submitStatus === "success"
                ? "border-2 border-primary/20 bg-primary/10 text-primary shadow-none hover:bg-primary/10"
                : "bg-gold hover:bg-gold/90 text-gold-foreground active:scale-[0.98] disabled:opacity-65 shadow-lg shadow-gold/25",
            )}
          >
            {submitStatus === "sending" ? (
              <>
                <Loader2 className="h-5 w-5 shrink-0 animate-spin" aria-hidden />
                Odesílám…
              </>
            ) : submitStatus === "success" ? (
              <>
                <Check className="h-5 w-5 shrink-0 stroke-[2.5]" aria-hidden />
                Poptávka odeslána
              </>
            ) : (
              "Chci nezávaznou nabídku"
            )}
          </Button>

          <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>100% diskrétní. Odpovídáme obratem.</span>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
