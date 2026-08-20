"use client"

import { useState } from "react"
import { Car, Info, Menu, Phone, X } from "lucide-react"
import Link from "next/link"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-primary/95 backdrop-blur-md border-b border-white/10">
      <div className="container mx-auto px-4 py-3.5">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <img
              src="/logo-autocash.svg"
              alt=""
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl object-contain shrink-0 transition-transform group-hover:scale-105"
            />
            <span className="font-display text-xl sm:text-2xl font-bold tracking-tight text-card">Autocash</span>
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center text-card"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/jak-to-funguje"
              className="flex items-center gap-2 text-card/80 hover:text-card transition-colors font-medium"
            >
              <Info className="w-4 h-4 shrink-0" />
              Jak to funguje
            </Link>
            <Link
              href="/kontakty"
              className="flex items-center gap-2 text-card/80 hover:text-card transition-colors font-medium"
            >
              <Phone className="w-4 h-4 shrink-0" />
              Kontakty
            </Link>
            <a
              href="/#formular"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-gold-foreground shadow-md transition-all hover:bg-gold/90 active:scale-[0.98]"
            >
              <Car className="w-4 h-4" />
              Chci peníze za auto
            </a>
          </nav>
        </div>
      </div>

      {isMenuOpen && (
        <nav className="md:hidden bg-primary border-t border-white/20 shadow-lg">
          <div className="container mx-auto px-4 py-4 flex flex-col gap-1">
            <Link
              href="/jak-to-funguje"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 text-white hover:bg-white/10 transition-colors font-medium py-3 px-2 rounded-lg"
            >
              <Info className="w-5 h-5 shrink-0" />
              Jak to funguje
            </Link>
            <Link
              href="/kontakty"
              onClick={() => setIsMenuOpen(false)}
              className="flex items-center gap-2 text-white hover:bg-white/10 transition-colors font-medium py-3 px-2 rounded-lg"
            >
              <Phone className="w-5 h-5 shrink-0" />
              Kontakty
            </Link>
            <a
              href="/#formular"
              onClick={() => setIsMenuOpen(false)}
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-3 text-sm font-bold text-gold-foreground"
            >
              <Car className="w-4 h-4" />
              Chci peníze za auto
            </a>
          </div>
        </nav>
      )}
    </header>
  )
}
