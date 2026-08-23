import type { Metadata } from "next"

import { Header } from "@/components/header"
import { PhotoWizard } from "@/components/photo-wizard"
import { verifyPhotoToken } from "@/lib/photo-token"

export const metadata: Metadata = {
  title: "Fotky vozu",
  description: "Nahrajte fotky vozu k poptávce Autocash.",
  robots: { index: false, follow: false },
}

export default async function FotkyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token: raw } = await params
  const token = decodeURIComponent(raw)
  const payload = verifyPhotoToken(token)

  return (
    <main className="min-h-dvh bg-background">
      <Header />
      <section className="pt-28 pb-16 px-4">
        <div className="mx-auto flex justify-center">
          {payload ? (
            <PhotoWizard token={token} code={payload.code} name={payload.name} />
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
