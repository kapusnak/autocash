import type { MetadataRoute } from "next"

import { SITE } from "@/lib/site"

export const dynamic = "force-static"

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${SITE.domain}`).replace(/\/$/, "")
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/fotky/", "/qr", "/qr-gtag"],
    },
    sitemap: `${base}/sitemap.xml`,
  }
}
