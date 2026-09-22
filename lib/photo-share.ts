import { createHash, randomBytes, timingSafeEqual } from "node:crypto"

import { PHOTO_SLOT_LABELS, PHOTO_SLOTS } from "./photo-slots"

export const PHOTO_WIZARD_SHARE_SECRET_ENV = "PHOTO_WIZARD_SHARE_SECRET"
export const PHOTO_SHARE_SECRET_MIN_LENGTH = 8
/** URL-safe, no `.` — HMAC lead tokens are always `body.sig`. */
const SHARE_SECRET_RE = /^[A-Za-z0-9_-]+$/
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

export const SHARE_CONTACT_LIMITS = {
  name: 120,
  phone: 40,
  note: 2000,
} as const

export type ShareContactFields = {
  name: string
  phone: string
  note: string
}

function configuredShareSecret(): string | null {
  const value = process.env[PHOTO_WIZARD_SHARE_SECRET_ENV]?.trim() ?? ""
  if (value.length < PHOTO_SHARE_SECRET_MIN_LENGTH) return null
  if (!SHARE_SECRET_RE.test(value)) return null
  return value
}

function sha256(value: string): Buffer {
  return createHash("sha256").update(value, "utf8").digest()
}

/** Timing-safe match against the env-configured share token. */
export function isPhotoWizardShareToken(token: string): boolean {
  const expected = configuredShareSecret()
  if (!expected) return false
  const given = token.trim()
  if (!given) return false
  return timingSafeEqual(sha256(expected), sha256(given))
}

export function photoWizardShareUrl(): string | null {
  const secret = configuredShareSecret()
  if (!secret) return null
  const originRaw = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://autocash.cz").trim().replace(/\/$/, "")
  const origin = originRaw.includes("://") ? originRaw : `https://${originRaw}`
  return `${origin}/fotky/${encodeURIComponent(secret)}`
}

export function createShareUploadCode(): string {
  const bytes = randomBytes(4)
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length]
  }
  return `SD-${suffix}`
}

function sanitizeField(value: string, max: number): string {
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max)
}

export function parseShareContactFields(input: {
  name?: unknown
  phone?: unknown
  note?: unknown
}): ShareContactFields {
  const name = typeof input.name === "string" ? sanitizeField(input.name, SHARE_CONTACT_LIMITS.name) : ""
  const phone = typeof input.phone === "string" ? sanitizeField(input.phone, SHARE_CONTACT_LIMITS.phone) : ""
  const note = typeof input.note === "string" ? sanitizeField(input.note, SHARE_CONTACT_LIMITS.note) : ""
  return { name, phone, note }
}

export function parseShareContactFromForm(form: FormData): ShareContactFields {
  return parseShareContactFields({
    name: form.get("name"),
    phone: form.get("phone"),
    note: form.get("note"),
  })
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function notifyDomainTag(): string {
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

export function buildSharePhotoEmail(input: {
  code: string
  name: string
  phone: string
  note: string
  domainTag?: string
}): { subject: string; text: string; html: string } {
  const domainTag = input.domainTag ?? notifyDomainTag()
  const name = input.name.trim()
  const phone = input.phone.trim()
  const note = input.note.trim()
  const who = name || phone
  const subject = who
    ? `[${domainTag}] Fotky vozu — sdílený odkaz — ${who} — ${input.code}`
    : `[${domainTag}] Fotky vozu — sdílený odkaz — ${input.code}`

  const slotList = PHOTO_SLOTS.map((slot) => `- ${PHOTO_SLOT_LABELS[slot]}`).join("\n")
  const text = [
    "Zdroj: sdílený odkaz (WhatsApp / SMS / poznámky)",
    `Kód nahrání: ${input.code}`,
    `Jméno: ${name || "—"}`,
    `Telefon: ${phone || "—"}`,
    `Poznámka: ${note || "—"}`,
    "",
    "Přiložené fotky:",
    slotList,
  ].join("\n")

  const photoCount = PHOTO_SLOTS.length
  const phoneHtml = phone
    ? `<a href="tel:${escapeHtml(phone.replace(/\s/g, ""))}">${escapeHtml(phone)}</a>`
    : "—"
  const noteHtml = note
    ? escapeHtml(note).replace(/\n/g, "<br />")
    : "—"

  const html = `
<div style="font-family: system-ui, sans-serif, Arial; font-size: 14px; color: #333333; max-width: 480px; border: 1px solid #e0e0e0; border-radius: 8px; padding: 20px;">
  <div style="color: #0d3d32; font-size: 17px; font-weight: bold; margin-bottom: 12px;">AUTOCASH — FOTKY VOZU — SDÍLENÝ ODKAZ</div>
  <p style="margin: 0 0 8px 0;"><strong>Zdroj:</strong> sdílený odkaz (WhatsApp / SMS / poznámky)</p>
  <p style="margin: 0 0 8px 0;"><strong>Kód nahrání:</strong> ${escapeHtml(input.code)}</p>
  <p style="margin: 0 0 8px 0;"><strong>Jméno:</strong> ${escapeHtml(name || "—")}</p>
  <p style="margin: 0 0 8px 0;"><strong>Telefon:</strong> ${phoneHtml}</p>
  <p style="margin: 0 0 12px 0;"><strong>Poznámka:</strong> ${noteHtml}</p>
  <p style="margin: 0 0 6px 0;"><strong>Přílohy (${photoCount}):</strong></p>
  <ul style="margin: 0; padding-left: 18px;">
    ${PHOTO_SLOTS.map((slot) => `<li>${escapeHtml(PHOTO_SLOT_LABELS[slot])}</li>`).join("")}
  </ul>
</div>`.trim()

  return { subject, text, html }
}
