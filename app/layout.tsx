import type React from "react"
import type { Metadata } from "next"
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google"
import { AppToaster } from "@/components/app-toaster"
import { FormularHashScroll } from "@/components/formular-hash-scroll"
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

const siteTitle = "Autocash — peníze za auto, se kterým jezdíte dál"
const siteDescription =
  "Získejte hotovost za hodnotu svého vozu a jezděte s ním dál. Vůz se dočasně přepíše na nás, vy zůstáváte provozovatelem. Po celé ČR, obvykle do 24 hodin od podpisu."

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
    images: [
      {
        url: "/og-social-share.jpg",
        width: 1024,
        height: 576,
        alt: "Autocash — peníze za auto, se kterým jezdíte dál",
      },
    ],
    type: "website",
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-social-share.jpg"],
  },
  icons: {
    icon: [
      { url: "/logo-autocash-64.png", type: "image/png", sizes: "64x64" },
      { url: "/logo-autocash.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
        <FormularHashScroll />
        {children}
        <GoogleAnalytics />
        <AppToaster />
      </body>
    </html>
  )
}
