import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { QrLetakRedirect } from "../qr/qr-letak-redirect"
import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"
import { GA_EVENT_QR_POSTA } from "@/lib/track-qr-letak"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Autocash",
  robots: { index: false, follow: false },
}

export default async function QrPostaPage() {
  const userAgent = (await headers()).get("user-agent")
  if (isCrawlerUserAgent(userAgent)) {
    redirect("/")
  }

  return <QrLetakRedirect eventName={GA_EVENT_QR_POSTA} />
}
