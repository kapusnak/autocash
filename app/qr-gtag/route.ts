import { NextResponse } from "next/server"

import { isGaMeasurementId, qrGtagDocument } from "@/lib/qr-gtag-document"
import { QR_REDIRECT_HOLD_MS, qrFlyerCampaign, qrFlyerEventFromQuery } from "@/lib/track-qr-letak"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * GTM-free collector HTML. `/qr` loads `/qr-gtag` (field leaflet, `qr_letak`).
 * `/qrposta` loads `/qr-gtag?event=qr_posta`. Any other `event` value is rejected.
 */
export function GET(request: Request) {
  const measurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? ""
  if (!isGaMeasurementId(measurementId)) {
    return new NextResponse("GA measurement id is not set", { status: 404 })
  }

  const eventName = qrFlyerEventFromQuery(new URL(request.url).searchParams.get("event"))
  if (!eventName) {
    return new NextResponse("Unknown QR event", { status: 400 })
  }

  const html = qrGtagDocument({
    measurementId,
    eventName,
    campaign: qrFlyerCampaign(eventName),
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
