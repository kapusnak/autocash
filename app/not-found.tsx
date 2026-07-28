import type { Metadata } from "next"
import Link from "next/link"

import { Header } from "@/components/header"

export const metadata: Metadata = {
  title: "Stránka nenalezena",
}

export default function NotFound() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 pt-32 pb-20 text-center">
        <p className="font-display text-6xl font-bold text-primary mb-4">404</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-3">Stránka nenalezena</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Tato adresa neexistuje. Vraťte se na úvodní stránku a získejte nabídku financování za auto.
        </p>
        <Link
          href="/"
          className="inline-flex rounded-xl bg-gold px-6 py-3.5 text-sm font-bold text-gold-foreground hover:bg-gold/90 transition-colors"
        >
          Zpět na Autocash
        </Link>
      </div>
    </main>
  )
}
