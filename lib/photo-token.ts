import { createHmac, randomBytes, timingSafeEqual } from "node:crypto"

export type PhotoTokenPayload = {
  code: string
  name: string
  email: string
  phone: string
  iat: number
  exp: number
}

const TTL_SECONDS = 14 * 24 * 60 * 60
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"

function photoSecret(): string {
  const value = process.env.PHOTO_TOKEN_SECRET?.trim()
  if (!value) {
    throw new Error("Chybí proměnná prostředí PHOTO_TOKEN_SECRET.")
  }
  return value
}

export function createLeadCode(): string {
  const bytes = randomBytes(4)
  let suffix = ""
  for (let i = 0; i < 4; i++) {
    suffix += CODE_ALPHABET[bytes[i]! % CODE_ALPHABET.length]
  }
  return `AC-${suffix}`
}

export function signPhotoToken(input: {
  code: string
  name: string
  email: string
  phone: string
}): string {
  const now = Math.floor(Date.now() / 1000)
  const payload: PhotoTokenPayload = {
    code: input.code.trim(),
    name: input.name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim(),
    iat: now,
    exp: now + TTL_SECONDS,
  }
  const body = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url")
  const sig = createHmac("sha256", photoSecret()).update(body).digest("base64url")
  return `${body}.${sig}`
}

export function verifyPhotoToken(token: string): PhotoTokenPayload | null {
  const trimmed = token.trim()
  const dot = trimmed.lastIndexOf(".")
  if (dot <= 0 || dot === trimmed.length - 1) return null
  const body = trimmed.slice(0, dot)
  const sig = trimmed.slice(dot + 1)
  if (!body || !sig) return null

  let expected: string
  try {
    expected = createHmac("sha256", photoSecret()).update(body).digest("base64url")
  } catch {
    return null
  }

  const sigBuf = Buffer.from(sig)
  const expectedBuf = Buffer.from(expected)
  if (sigBuf.length !== expectedBuf.length) return null
  if (!timingSafeEqual(sigBuf, expectedBuf)) return null

  let payload: unknown
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"))
  } catch {
    return null
  }
  if (!payload || typeof payload !== "object") return null
  const o = payload as Record<string, unknown>
  if (typeof o.code !== "string" || typeof o.name !== "string") return null
  if (typeof o.email !== "string" || typeof o.phone !== "string") return null
  if (typeof o.iat !== "number" || typeof o.exp !== "number") return null
  if (o.exp < Math.floor(Date.now() / 1000)) return null
  if (!o.code.trim() || !o.email.trim() || !o.phone.trim()) return null

  return {
    code: o.code,
    name: o.name,
    email: o.email,
    phone: o.phone,
    iat: o.iat,
    exp: o.exp,
  }
}

export function photoWizardUrl(token: string): string {
  const originRaw = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://autocash.cz").trim().replace(/\/$/, "")
  const origin = originRaw.includes("://") ? originRaw : `https://${originRaw}`
  return `${origin}/fotky/${encodeURIComponent(token)}`
}
