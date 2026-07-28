import type { MetadataRoute } from "next"

import { SITE } from "@/lib/site"

export const dynamic = "force-static"

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? `https://${SITE.domain}`).replace(/\/$/, "")
  const paths = ["", "/jak-to-funguje", "/kontakty", "/ochrana-osobnich-udaju", "/zasady-cookies"]
  const now = new Date()

  return paths.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }))
}
