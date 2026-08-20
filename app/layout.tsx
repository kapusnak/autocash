import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google"
import { AppToaster } from "@/components/app-toaster"
import { GoogleAdsGtag } from "@/components/google-ads-gtag"
import { GoogleAnalytics } from "@/components/google-analytics"
import { GoogleTagManager } from "@/components/google-tag-manager"
import "./globals.css"

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-dm-sans",
  display: "swap",
})

const siteTitle = "Autocash — Peníze za auto, jezdíte dál"
const siteDescription =
  "Hotovost proti vozu. Přepis je zajištění, autem jezdíte dál. Smlouvu a výplatu řeší poskytovatel — obvykle do 24 hodin. Po celé ČR."

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://autocash.cz"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Autocash",
  },
  description: siteDescription,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    images: ["/og-social-share.svg"],
    type: "website",
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-social-share.svg"],
  },
  icons: {
    icon: [{ url: "/logo-autocash.svg", type: "image/svg+xml" }],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="cs">
      <body className={`${plusJakarta.variable} ${dmSans.variable} font-sans antialiased`}>
        <GoogleTagManager />
        <GoogleAdsGtag />
        {children}
        <GoogleAnalytics />
        <AppToaster />
      </body>
    </html>
  )
}
