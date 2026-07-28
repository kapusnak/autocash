import emailjs from "@emailjs/browser"

import { trackLeadGenerated } from "@/lib/track-lead-conversion"

const PUBLIC_KEY = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
const SERVICE_ID = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID
const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
/** Client confirmation template — used when sending success email to the client */
const CLIENT_TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_CLIENT_TEMPLATE_ID ?? "template_3t8h00d"

export type LeadParams = {
  source: "calculator" | "popup" | "cta"
  phone: string
  email?: string
  name?: string
  amount?: number
  assetType?: string
  serviceType?: string
  /** Current path for GA (e.g. /kontakty); set for popup/cta phone leads */
  pagePath?: string
}

const CALLBACK_ONLY_SERVICE = "Není relevantní (Callback)"
const CALLBACK_ONLY_AMOUNT = "--- Pouze požadavek na zavolání ---"
const PLACEHOLDER = "---"

/** Format amount for email: "1 800 000,- Kč" */
function formatAmountCzk(value: number): string {
  const integer = Math.round(value)
  const withSpaces = integer.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
  return `${withSpaces},- Kč`
}

/**
 * Value for EmailJS `{{source}}` — public site URL only.
 */
function leadEmailSourceUrl(): string {
  const origin =
    typeof window !== "undefined" && window.location?.origin
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/\/$/, "")
  const cleaned = (origin || "—").replace(/^Odesláno z:\s*/i, "").trim()
  return cleaned || "—"
}

function normalizePhoneForTel(phone: string): string {
  const trimmed = phone.trim()
  if (!trimmed) return ""
  const digits = trimmed.replace(/\D/g, "")
  if (digits.length === 12 && digits.startsWith("420")) return `+${digits}`
  if (digits.length === 9) return `+420${digits}`
  return trimmed.replace(/\s/g, "")
}

function formatPhoneDisplayForNotification(phone: string): string {
  const trimmed = phone.trim()
  if (!trimmed) return ""
  let digits = trimmed.replace(/\D/g, "")
  if (digits.length >= 11 && digits.startsWith("420")) digits = digits.slice(3)
  const national = digits.slice(0, 9)
  if (national.length !== 9) return trimmed
  const groups = national.match(/.{1,3}/g)?.join(" ") ?? national
  return `+420 ${groups}`
}

function formatEmailJsError(err: unknown): string {
  if (err && typeof err === "object") {
    const o = err as Record<string, unknown>
    if (typeof o.text === "string" && o.text.trim()) return o.text.trim()
    if (typeof o.message === "string" && o.message.trim()) return o.message.trim()
  }
  if (err instanceof Error && err.message) return err.message
  return String(err)
}

export async function sendLead(params: LeadParams): Promise<void> {
  if (!PUBLIC_KEY || !SERVICE_ID || !TEMPLATE_ID) {
    const detail =
      "Chybí NEXT_PUBLIC_EMAILJS_PUBLIC_KEY, NEXT_PUBLIC_EMAILJS_SERVICE_ID nebo NEXT_PUBLIC_EMAILJS_TEMPLATE_ID. U statického exportu musí být nastavené před `npm run build` (nejen na serveru po buildu)."
    console.error("[EmailJS]", detail)
    throw new Error(detail)
  }
  const isCallbackOnly = params.source === "cta" || params.source === "popup"
  const assetTypeValue = isCallbackOnly ? PLACEHOLDER : (params.assetType ?? "Automobil")
  const phoneTel = normalizePhoneForTel(params.phone)
  const templateParams = {
    source: leadEmailSourceUrl(),
    phone: phoneTel || params.phone.trim(),
    phoneDisplay: formatPhoneDisplayForNotification(params.phone),
    email: params.email ?? "",
    name: isCallbackOnly ? PLACEHOLDER : (params.name ?? ""),
    assetType: assetTypeValue,
    collateralType: assetTypeValue,
    propertyType: assetTypeValue,
    serviceType: isCallbackOnly ? CALLBACK_ONLY_SERVICE : (params.serviceType ?? ""),
    amount:
      params.amount != null
        ? formatAmountCzk(params.amount)
        : isCallbackOnly
          ? CALLBACK_ONLY_AMOUNT
          : "",
  }
  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, { publicKey: PUBLIC_KEY })
  } catch (err) {
    console.error("[EmailJS] Hlavní šablona (lead):", formatEmailJsError(err), err)
    throw new Error(`Odeslání poptávky selhalo: ${formatEmailJsError(err)}`)
  }

  if (process.env.NODE_ENV === "development") {
    console.info("[EmailJS] Hlavní šablona odeslána OK (template:", TEMPLATE_ID + ")")
  }

  trackLeadGenerated({
    source: params.source,
    ...(params.pagePath != null && params.pagePath !== "" ? { pagePath: params.pagePath } : {}),
    ...(params.amount != null && Number.isFinite(params.amount) ? { leadValue: params.amount } : {}),
  })

  const clientEmail = (params.email ?? "").trim()
  if (clientEmail && PUBLIC_KEY && SERVICE_ID && CLIENT_TEMPLATE_ID) {
    const clientParams = {
      email: clientEmail,
      to_email: clientEmail,
      client_email: clientEmail,
      name: isCallbackOnly ? "" : (params.name ?? ""),
      phone: phoneTel || params.phone.trim(),
      amount:
        params.amount != null
          ? formatAmountCzk(params.amount)
          : isCallbackOnly
            ? CALLBACK_ONLY_AMOUNT
            : "",
      assetType: assetTypeValue,
      collateralType: assetTypeValue,
      propertyType: assetTypeValue,
      serviceType: isCallbackOnly ? CALLBACK_ONLY_SERVICE : (params.serviceType ?? ""),
    }
    try {
      await emailjs.send(SERVICE_ID, CLIENT_TEMPLATE_ID, clientParams, { publicKey: PUBLIC_KEY })
      if (process.env.NODE_ENV === "development") {
        console.info("[EmailJS] Klientská šablona odeslána OK (template:", CLIENT_TEMPLATE_ID + ")")
      }
    } catch (err) {
      console.warn(
        "[EmailJS] Klientské potvrzení se nepovedlo (poptávka už mohla dorazit vám):",
        formatEmailJsError(err),
        err,
      )
    }
  }
}
