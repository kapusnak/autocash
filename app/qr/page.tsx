import type { Metadata } from "next"
import { headers } from "next/headers"
import { redirect } from "next/navigation"

import { QrLetakRedirect } from "./qr-letak-redirect"
import { isCrawlerUserAgent } from "@/lib/crawler-user-agent"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Autocash",
  robots: { index: false, follow: false },
}

export default async function QrFlyerPage() {
  const userAgent = (await headers()).get("user-agent")
  if (isCrawlerUserAgent(userAgent)) {
    redirect("/")
  }

  return <QrLetakRedirect />
}
