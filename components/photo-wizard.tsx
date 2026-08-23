"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { Camera, Check, ImagePlus, Loader2, MessageCircle } from "lucide-react"
import { toast } from "sonner"

import { compressImage } from "@/lib/compress-image"
import { PHOTO_SLOT_HINTS, PHOTO_SLOT_LABELS, PHOTO_SLOTS, type PhotoSlot } from "@/lib/photo-slots"
import { SITE } from "@/lib/site"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type SlotDraft = { dataUrl: string }

type DraftMap = Partial<Record<PhotoSlot, SlotDraft>>

function storageKey(token: string) {
  return `autocash-fotky:${token}`
}

function doneKey(token: string) {
  return `autocash-fotky-done:${token}`
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("Čtení fotky selhalo."))
    }
    reader.onerror = () => reject(new Error("Čtení fotky selhalo."))
    reader.readAsDataURL(blob)
  })
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, rest] = dataUrl.split(",", 2)
  const mime = header?.match(/data:([^;]+)/)?.[1] || "image/jpeg"
  const binary = atob(rest ?? "")
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

function whatsappHref(code: string): string {
  const digits = SITE.phonePrimaryTel.replace(/\D/g, "")
  const text = `Dobrý den, posílám fotky k poptávce ${code}.`
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

function SlotSilhouette({ slot }: { slot: PhotoSlot }) {
  const common = "h-28 w-full text-primary/80"
  if (slot === "interior") {
    return (
      <svg viewBox="0 0 160 90" className={common} aria-hidden>
        <rect x="18" y="22" width="124" height="48" rx="6" fill="currentColor" opacity="0.12" />
        <rect x="28" y="30" width="48" height="22" rx="3" fill="currentColor" opacity="0.28" />
        <rect x="84" y="30" width="48" height="22" rx="3" fill="currentColor" opacity="0.28" />
        <rect x="36" y="58" width="88" height="8" rx="2" fill="currentColor" opacity="0.35" />
      </svg>
    )
  }
  if (slot === "cargo") {
    return (
      <svg viewBox="0 0 160 90" className={common} aria-hidden>
        <path d="M28 58h104v10H28z" fill="currentColor" opacity="0.2" />
        <path d="M40 58V34h80v24" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.45" />
        <path d="M40 34l16-12h48l16 12" fill="none" stroke="currentColor" strokeWidth="4" opacity="0.45" />
      </svg>
    )
  }
  const extra =
    slot === "front"
      ? "M40 58c8-22 24-32 40-32s32 10 40 32"
      : slot === "rear"
        ? "M48 38h64v20H48z"
        : "M28 52h104"
  return (
    <svg viewBox="0 0 160 90" className={common} aria-hidden>
      <path d="M36 58c4-18 16-28 44-28s40 10 44 28H36z" fill="currentColor" opacity="0.2" />
      <circle cx="52" cy="60" r="8" fill="currentColor" opacity="0.45" />
      <circle cx="108" cy="60" r="8" fill="currentColor" opacity="0.45" />
      <path d={extra} fill="none" stroke="currentColor" strokeWidth="3" opacity="0.35" />
    </svg>
  )
}

export function PhotoWizard({
  token,
  code,
  name,
}: {
  token: string
  code: string
  name: string
}) {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const [drafts, setDrafts] = useState<DraftMap>({})
  const [stepIndex, setStepIndex] = useState(0)
  const [hydrated, setHydrated] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(doneKey(token)) === "1") {
        setDone(true)
        setHydrated(true)
        return
      }
      const raw = sessionStorage.getItem(storageKey(token))
      if (raw) {
        const parsed = JSON.parse(raw) as DraftMap
        setDrafts(parsed)
        const firstMissing = PHOTO_SLOTS.findIndex((slot) => !parsed[slot]?.dataUrl)
        setStepIndex(firstMissing === -1 ? PHOTO_SLOTS.length - 1 : firstMissing)
      }
    } catch {
      /* ignore */
    }
    setHydrated(true)
  }, [token])

  const persist = useCallback(
    (next: DraftMap) => {
      setDrafts(next)
      try {
        sessionStorage.setItem(storageKey(token), JSON.stringify(next))
      } catch {
        /* quota — keep in memory */
      }
    },
    [token],
  )

  const slot = PHOTO_SLOTS[stepIndex] ?? PHOTO_SLOTS[0]
  const preview = drafts[slot]?.dataUrl
  const filledCount = PHOTO_SLOTS.filter((s) => drafts[s]?.dataUrl).length
  const allFilled = filledCount === PHOTO_SLOTS.length

  const greeting = useMemo(() => {
    const first = name.trim().split(/\s+/)[0]
    return first ? `${first}, ` : ""
  }, [name])

  async function submitAll(source: DraftMap) {
    const form = new FormData()
    form.append("token", token)
    for (const s of PHOTO_SLOTS) {
      const dataUrl = source[s]?.dataUrl
      if (!dataUrl) {
        toast.error("Ještě nemáte všechny fotky.")
        return
      }
      form.append(s, dataUrlToBlob(dataUrl), `${s}.jpg`)
    }
    setSending(true)
    try {
      const res = await fetch("/api/fotky", { method: "POST", body: form })
      if (!res.ok) {
        let detail = `HTTP ${res.status}`
        try {
          const data = (await res.json()) as { error?: string }
          if (data.error?.trim()) detail = data.error.trim()
        } catch {
          /* ignore */
        }
        throw new Error(detail)
      }
      try {
        sessionStorage.removeItem(storageKey(token))
        sessionStorage.setItem(doneKey(token), "1")
      } catch {
        /* ignore */
      }
      setDone(true)
      toast.success("Fotky jsme dostali. Děkujeme.")
    } catch (err) {
      const hint = err instanceof Error ? err.message.trim() : ""
      toast.error("Odeslání fotek se nepovedlo", {
        description: hint.length > 0 && hint.length <= 220 ? hint : "Zkuste to znovu, nebo pošlete fotky na WhatsApp.",
        duration: 8000,
      })
    } finally {
      setSending(false)
    }
  }

  async function onFile(file: File | undefined) {
    if (!file || compressing || sending) return
    setCompressing(true)
    try {
      const blob = await compressImage(file)
      const dataUrl = await blobToDataUrl(blob)
      const next = { ...drafts, [slot]: { dataUrl } }
      persist(next)
      const isLast = stepIndex >= PHOTO_SLOTS.length - 1
      if (isLast) {
        await submitAll(next)
      } else {
        setStepIndex((i) => Math.min(i + 1, PHOTO_SLOTS.length - 1))
      }
    } catch (err) {
      const heic = err instanceof Error && err.message === "HEIC"
      toast.error(heic ? "Tento formát se nepodařilo načíst" : "Fotku se nepodařilo zpracovat", {
        description: heic
          ? "Vyberte prosím JPEG nebo PNG z galerie, nebo fotku vyfoťte znovu."
          : "Zkuste jiný soubor nebo fotku znovu vyfotit.",
      })
    } finally {
      setCompressing(false)
      if (cameraRef.current) cameraRef.current.value = ""
      if (galleryRef.current) galleryRef.current.value = ""
    }
  }

  if (!hydrated) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="py-16 text-center text-muted-foreground">Načítám…</CardContent>
      </Card>
    )
  }

  if (done) {
    return (
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardContent className="px-5 py-10 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Check className="h-7 w-7" aria-hidden />
          </div>
          <h1 className="font-display text-2xl font-bold">Fotky máme</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Děkujeme. Ozveme se vám s oceněním vozu. Kód poptávky: <strong className="text-foreground">{code}</strong>
          </p>
          <Button asChild className="bg-gold text-gold-foreground hover:bg-gold/90 font-bold">
            <Link href="/">Zpět na Autocash</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md border-0 shadow-xl">
      <CardContent className="px-5 py-6 space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Krok {stepIndex + 1} / {PHOTO_SLOTS.length}
          </p>
          <h1 className="font-display text-2xl font-bold mt-1">
            {greeting}přidejte fotku {PHOTO_SLOT_LABELS[slot].toLowerCase()}
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{PHOTO_SLOT_HINTS[slot]}</p>
        </div>

        <div className="flex gap-1.5" aria-hidden>
          {PHOTO_SLOTS.map((s, i) => (
            <div
              key={s}
              className={
                drafts[s]
                  ? "h-1.5 flex-1 rounded-full bg-gold"
                  : i === stepIndex
                    ? "h-1.5 flex-1 rounded-full bg-primary"
                    : "h-1.5 flex-1 rounded-full bg-border"
              }
            />
          ))}
        </div>

        <div className="rounded-2xl border border-border bg-secondary/60 overflow-hidden">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt={`Náhled: ${PHOTO_SLOT_LABELS[slot]}`} className="w-full h-48 object-cover" />
          ) : (
            <div className="px-6 py-4">
              <SlotSilhouette slot={slot} />
            </div>
          )}
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="sr-only"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />
        <input
          ref={galleryRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => void onFile(e.target.files?.[0])}
        />

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            disabled={compressing || sending}
            className="h-12 bg-gold text-gold-foreground hover:bg-gold/90 font-bold"
            onClick={() => cameraRef.current?.click()}
          >
            {compressing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            Vyfotit
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={compressing || sending}
            className="h-12 font-semibold"
            onClick={() => galleryRef.current?.click()}
          >
            <ImagePlus className="h-4 w-4" />
            Nahrát
          </Button>
        </div>

        {allFilled ? (
          <Button
            type="button"
            disabled={sending}
            className="w-full h-12 font-bold"
            onClick={() => void submitAll(drafts)}
          >
            {sending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Odesílám fotky…
              </>
            ) : (
              "Odeslat všech 5 fotek"
            )}
          </Button>
        ) : sending ? (
          <p className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Odesílám fotky…
          </p>
        ) : null}

        {stepIndex > 0 ? (
          <button
            type="button"
            className="w-full text-sm text-muted-foreground hover:text-foreground"
            onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
          >
            Zpět na předchozí fotku
          </button>
        ) : null}

        <p className="text-center text-xs text-muted-foreground">
          Kód poptávky <span className="font-semibold text-foreground">{code}</span>
        </p>

        <div className="border-t border-border pt-4 space-y-2 text-center">
          <a
            href={whatsappHref(code)}
            className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle className="h-4 w-4" />
            Nebo pošlete na WhatsApp a uveďte kód {code}
          </a>
          <div>
            <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
              Teď ne, pošlu později
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
