import { trackLeadGenerated } from "@/lib/track-lead-conversion"

export type LeadParams = {
  source: "calculator" | "popup" | "cta"
  phone: string
  email?: string
  name?: string
  amount?: number
  vehicleModel?: string
  vehicleYear?: string
  vehicleMileage?: string
  vehicleVin?: string
  /** Current path for GA (e.g. /kontakty); set for popup/cta phone leads */
  pagePath?: string
}

export type SendLeadResult = {
  photoToken?: string
}

export async function sendLead(params: LeadParams): Promise<SendLeadResult> {
  const res = await fetch("/api/lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: params.source,
      phone: params.phone,
      ...(params.email != null ? { email: params.email } : {}),
      ...(params.name != null ? { name: params.name } : {}),
      ...(params.amount != null ? { amount: params.amount } : {}),
      ...(params.vehicleModel != null ? { vehicleModel: params.vehicleModel } : {}),
      ...(params.vehicleYear != null ? { vehicleYear: params.vehicleYear } : {}),
      ...(params.vehicleMileage != null ? { vehicleMileage: params.vehicleMileage } : {}),
      ...(params.vehicleVin != null ? { vehicleVin: params.vehicleVin } : {}),
      ...(params.pagePath != null ? { pagePath: params.pagePath } : {}),
    }),
  })

  let data: { error?: string; photoToken?: string } = {}
  try {
    data = (await res.json()) as { error?: string; photoToken?: string }
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    const detail = data.error?.trim() || `HTTP ${res.status}`
    console.error("[lead]", detail)
    throw new Error(`Odeslání poptávky selhalo: ${detail}`)
  }

  trackLeadGenerated({
    source: params.source,
    ...(params.pagePath != null && params.pagePath !== ""
      ? { pagePath: params.pagePath }
      : {}),
    ...(params.amount != null && Number.isFinite(params.amount)
      ? { leadValue: params.amount }
      : {}),
  })

  const photoToken = data.photoToken?.trim()
  return photoToken ? { photoToken } : {}
}

/** Rohový popup – pouze telefon. */
export async function sendPopupPhone(phone: string, pagePath?: string): Promise<void> {
  await sendLead({ source: "popup", phone, pagePath })
}
