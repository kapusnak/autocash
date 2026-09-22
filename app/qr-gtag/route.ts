import { NextResponse } from "next/server"

import { GA_EVENT_QR_LETAK, QR_LETAK_CAMPAIGN, QR_REDIRECT_HOLD_MS } from "@/lib/track-qr-letak"
import { isGaMeasurementId, qrGtagDocument } from "@/lib/qr-gtag-document"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/** Inspectable GTM-free collector HTML. `/qr` embeds the same document via srcdoc. */
export function GET() {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ""
  if (!isGaMeasurementId(measurementId)) {
    return new NextResponse("GA measurement id is not set", { status: 404 })
  }

  const html = qrGtagDocument({
    measurementId,
    eventName: GA_EVENT_QR_LETAK,
    campaign: {
      source: QR_LETAK_CAMPAIGN.campaign_source,
      medium: QR_LETAK_CAMPAIGN.campaign_medium,
      name: QR_LETAK_CAMPAIGN.campaign_name,
    },
    callbackTimeoutMs: QR_REDIRECT_HOLD_MS,
  })

  return new NextResponse(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  })
}
