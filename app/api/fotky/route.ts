import { NextResponse } from "next/server"

import { collectPhotoFiles, photoAttachments } from "@/lib/photo-files"
import { PHOTO_SLOT_LABELS, PHOTO_SLOTS } from "@/lib/photo-slots"
import { verifyPhotoToken } from "@/lib/photo-token"
import { getMailer, leadNotifyTo, mailFromAddress } from "@/lib/mailer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

  const photos = collectPhotoFiles(form)
  if (!photos.ok) {
    return NextResponse.json({ error: photos.error }, { status: photos.status })
  }

  const attachments = await photoAttachments(photos.files, payload.code)

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
