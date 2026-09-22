import { collectPhotoFiles, photoAttachments } from "./photo-files"
import {
  buildSharePhotoEmail,
  createShareUploadCode,
  isPhotoWizardShareToken,
  parseShareContactFromForm,
} from "./photo-share"
import { createSlidingWindowLimiter, type RateLimiter } from "./rate-limit"

export const SHARE_PHOTO_IP_LIMIT = 8
export const SHARE_PHOTO_IP_WINDOW_MS = 15 * 60 * 1000
export const SHARE_PHOTO_TOKEN_LIMIT = 20
export const SHARE_PHOTO_TOKEN_WINDOW_MS = 15 * 60 * 1000

const NOT_FOUND_BODY = { error: "Not found." } as const
const RATE_LIMIT_BODY = { error: "Příliš mnoho pokusů. Zkuste to za chvíli." } as const

export type SharePhotoMail = {
  subject: string
  text: string
  html: string
  attachments: { filename: string; content: Buffer; contentType: string }[]
}

export type SharePhotoResult = {
  status: number
  body: Record<string, unknown>
}

const defaultIpLimiter = createSlidingWindowLimiter({
  limit: SHARE_PHOTO_IP_LIMIT,
  windowMs: SHARE_PHOTO_IP_WINDOW_MS,
})
const defaultTokenLimiter = createSlidingWindowLimiter({
  limit: SHARE_PHOTO_TOKEN_LIMIT,
  windowMs: SHARE_PHOTO_TOKEN_WINDOW_MS,
})

export type SharePhotoUploadDeps = {
  sendMail: (mail: SharePhotoMail) => Promise<void>
  ipLimiter?: RateLimiter
  tokenLimiter?: RateLimiter
  createCode?: () => string
}

/**
 * Shared-link photo upload. Wrong/missing secret → 404 (same body either way).
 * Optional jméno / telefon / poznámka may all be empty.
 */
export async function processSharePhotos(
  form: FormData,
  ip: string,
  deps: SharePhotoUploadDeps,
): Promise<SharePhotoResult> {
  const ipLimiter = deps.ipLimiter ?? defaultIpLimiter
  const tokenLimiter = deps.tokenLimiter ?? defaultTokenLimiter

  const tokenRaw = form.get("token")
  const token = typeof tokenRaw === "string" ? tokenRaw.trim() : ""

  if (!ipLimiter.allow(`ip:${ip || "unknown"}`)) {
    return { status: 429, body: { ...RATE_LIMIT_BODY } }
  }

  if (!token || !isPhotoWizardShareToken(token)) {
    return { status: 404, body: { ...NOT_FOUND_BODY } }
  }

  if (!tokenLimiter.allow("token:share")) {
    return { status: 429, body: { ...RATE_LIMIT_BODY } }
  }

  const photos = collectPhotoFiles(form)
  if (!photos.ok) {
    return { status: photos.status, body: { error: photos.error } }
  }

  const contact = parseShareContactFromForm(form)
  const code = (deps.createCode ?? createShareUploadCode)()
  const attachments = await photoAttachments(photos.files, code)
  const email = buildSharePhotoEmail({
    code,
    name: contact.name,
    phone: contact.phone,
    note: contact.note,
  })

  try {
    await deps.sendMail({
      subject: email.subject,
      text: email.text,
      html: email.html,
      attachments,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error("[fotky/sdilene] Odeslání selhalo:", message, err)
    return {
      status: 500,
      body: { error: `Odeslání fotek selhalo: ${message}` },
    }
  }

  return { status: 200, body: { ok: true, code } }
}
