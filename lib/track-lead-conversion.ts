/** Homepage loan calculator form (full form). */
export const GA_EVENT_FORMULAR = "vyplneny_formular"

/** Phone-only: popup, CTA on Kontakty / Jak to funguje. */
export const GA_EVENT_TELEFON = "telefonni_cislo"

/** Matches `LeadParams["source"]` in send-lead — kept local to avoid circular imports. */
export type LeadSource = "calculator" | "popup" | "cta"

function gaMeasurementSendTo(): string {
  return process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ""
}

function googleAdsLeadConversionSendTo(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_SEND_TO?.trim() ?? ""
}

/**
 * Fires exactly one GA4 event per successful lead:
 * - `vyplneny_formular` — homepage calculator (full form)
 * - `telefonni_cislo` — phone-only (popup + CTA sections)
 * `send_to` is the GA4 measurement id so GTM's Google tag delivers that one hit.
 * Optionally fires Google Ads `conversion` when NEXT_PUBLIC_GOOGLE_ADS_LEAD_CONVERSION_SEND_TO is set.
 */
export function trackLeadGenerated(params: {
  source: LeadSource
  leadValue?: number
  /** e.g. /kontakty — for phone events (popup + CTA) */
  pagePath?: string
}): void {
  if (typeof window === "undefined") return
  const gtag = window.gtag
  if (!gtag) return

  const measurementId = gaMeasurementSendTo()

  if (params.source === "calculator") {
    const eventParams: Record<string, string | number> = {
      lead_source: params.source,
    }
    if (params.leadValue != null && Number.isFinite(params.leadValue)) {
      eventParams.currency = "CZK"
      eventParams.value = params.leadValue
    }
    if (measurementId) eventParams.send_to = measurementId
    gtag("event", GA_EVENT_FORMULAR, eventParams)
  } else {
    const eventParams: Record<string, string> = {
      lead_source: params.source,
    }
    if (params.pagePath) {
      eventParams.page_path = params.pagePath
    }
    if (measurementId) eventParams.send_to = measurementId
    gtag("event", GA_EVENT_TELEFON, eventParams)
  }

  const sendTo = googleAdsLeadConversionSendTo()
  if (sendTo) {
    gtag("event", "conversion", { send_to: sendTo })
  }
}
