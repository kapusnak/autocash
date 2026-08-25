import { NextResponse } from "next/server"

import { PHOTO_SLOT_LABELS, PHOTO_SLOTS, type PhotoSlot } from "@/lib/photo-slots"
import { verifyPhotoToken } from "@/lib/photo-token"
import { getMailer, leadNotifyTo, mailFromAddress } from "@/lib/mailer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_FILE_BYTES = 1_000_000
const ALLOWED_TYPES = new Set(["image/jpeg", "image/webp"])

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function notifyDomainTag(): string {
  const origin = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim()
  if (origin) {
    try {
      const host = new URL(origin.includes("://") ? origin : `https://${origin}`).hostname.replace(
        /^www\./,
        "",
      )
      if (host) return host
    } catch {
      /* fall through */
    }
  }
  return "autocash.cz"
}

export async function POST(req: Request) {
  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: "Neplatný formulář." }, { status: 400 })
  }

  const tokenRaw = form.get("token")
  const token = typeof tokenRaw === "string" ? tokenRaw.trim() : ""
  if (!token) {
    return NextResponse.json({ error: "Chybí odkaz na poptávku." }, { status: 400 })
  }

  const payload = verifyPhotoToken(token)
  if (!payload) {
    return NextResponse.json(
      { error: "Odkaz na fotky je neplatný nebo vypršel." },
      { status: 400 },
    )
  }

  const files = new Map<PhotoSlot, File>()
  for (const slot of PHOTO_SLOTS) {
    const value = form.get(slot)
    if (!(value instanceof File) || value.size === 0) {
      return NextResponse.json(
        { error: `Chybí fotka: ${PHOTO_SLOT_LABELS[slot]}.` },
        { status: 400 },
      )
    }
    const type = (value.type || "").toLowerCase()
    if (!ALLOWED_TYPES.has(type)) {
      return NextResponse.json(
        { error: `Fotka ${PHOTO_SLOT_LABELS[slot]} musí být JPEG nebo WebP.` },
        { status: 400 },
      )
    }
    if (value.size > MAX_FILE_BYTES) {
      return NextResponse.json(
        { error: `Fotka ${PHOTO_SLOT_LABELS[slot]} je příliš velká.` },
        { status: 400 },
      )
    }
    files.set(slot, value)
  }

  const attachments = await Promise.all(
    PHOTO_SLOTS.map(async (slot) => {
      const file = files.get(slot)!
      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.type === "image/webp" ? "webp" : "jpg"
      return {
        filename: `${payload.code}-${slot}.${ext}`,
        content: buffer,
        contentType: file.type,
      }
    }),
  )

  const slotList = PHOTO_SLOTS.map((slot) => `- ${PHOTO_SLOT_LABELS[slot]}`).join("\n")
  const domainTag = notifyDomainTag()
  const photoCount = PHOTO_SLOTS.length
  const subject = `[${domainTag}] Fotky vozu (${photoCount}) — ${payload.name || payload.phone} — ${payload.code}`
  const text = [
    `Kód poptávky: ${payload.code}`,
    `Jméno: ${payload.name || "—"}`,
    `Telefon: ${payload.phone}`,
    `E-mail: ${payload.email}`,
    "",
    "Přiložené fotky:",
    slotList,
  ].join("\n")

  const html = `
<div style="font-family: system-ui, sans-serif, Arial; font-size: 14px; color: #333333; max-width: 480px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
  <div style="color: #0d3d32; font-size: 17px; font-weight: bold; margin-bottom: 12px;">AUTOCASH — FOTKY VOZU</div>
  <p style="margin: 0 0 8px 0;"><strong>Kód:</strong> ${escapeHtml(payload.code)}</p>
  <p style="margin: 0 0 8px 0;"><strong>Jméno:</strong> ${escapeHtml(payload.name || "—")}</p>
  <p style="margin: 0 0 8px 0;"><strong>Telefon:</strong> <a href="tel:${escapeHtml(payload.phone)}">${escapeHtml(payload.phone)}</a></p>
  <p style="margin: 0 0 12px 0;"><strong>E-mail:</strong> <a href="mailto:${escapeHtml(payload.email)}">${escapeHtml(payload.email)}</a></p>
  <p style="margin: 0 0 6px 0;"><strong>Přílohy (${photoCount}):</strong></p>
  <ul style="margin: 0; padding-left: 18px;">
    ${PHOTO_SLOTS.map((slot) => `<li>${escapeHtml(PHOTO_SLOT_LABELS[slot])}</li>`).join("")}
  </ul>
</div>`.trim()

  try {
    const mailer = getMailer()
    await mailer.sendMail({
      from: mailFromAddress(),
      to: leadNotifyTo(),
      replyTo: payload.email || undefined,
      subject,
      text,
      html,
      attachments,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[fotky] Odeslání selhalo:", message, err)
    return NextResponse.json(
      { error: `Odeslání fotek selhalo: ${message}` },
      { status: 500 },
    )
  }

  return NextResponse.json({ ok: true })
}
