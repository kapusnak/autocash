import type { Metadata } from "next"

import { Header } from "@/components/header"
import { PhotoWizard } from "@/components/photo-wizard"
import { isPhotoWizardShareToken } from "@/lib/photo-share"
import { verifyPhotoToken } from "@/lib/photo-token"

export const dynamic = "force-dynamic"

const fotkyTitle = "Autocash — nahrajte fotky vozu"
const fotkyDescription =
  "Pošlete fotky auta přes tento odkaz. Rychlé, bezpečné, bez instalace aplikace."

const fotkyOgImage = {
  url: "/og-fotky.jpg",
  width: 1200,
  height: 630,
  alt: fotkyTitle,
} as const

export const metadata: Metadata = {
  title: { absolute: fotkyTitle },
  description: fotkyDescription,
  robots: { index: false, follow: false },
  openGraph: {
    title: fotkyTitle,
    description: fotkyDescription,
    images: [fotkyOgImage],
    type: "website",
    locale: "cs_CZ",
  },
  twitter: {
    card: "summary_large_image",
    title: fotkyTitle,
    description: fotkyDescription,
    images: [fotkyOgImage],
  },
}

export default async function FotkyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params
  const token = decodeURIComponent(raw)
  const payload = verifyPhotoToken(token)
  const share = !payload && isPhotoWizardShareToken(token)

  return (
    <main className="min-h-dvh bg-background">
      <Header />
      <section className="pt-28 pb-16 px-4">
        <div className="mx-auto flex justify-center">
          {payload ? (
            <PhotoWizard token={token} code={payload.code} name={payload.name} />
          ) : share ? (
            <PhotoWizard token={token} code="" name="" variant="share" />
          ) : (
            <div className="max-w-md text-center space-y-3">
              <h1 className="font-display text-2xl font-bold">Odkaz už neplatí</h1>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Tento odkaz na fotky je neplatný nebo vypršel. Ozvěte se nám telefonicky, nebo vyplňte poptávku znovu.
              </p>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}
