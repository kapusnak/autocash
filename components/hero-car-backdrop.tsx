import Image from "next/image"

/** Soft-masked hero car that dissolves into the emerald gradient. */
export function HeroCarBackdrop() {
  return (
    <div className="hero-car-backdrop pointer-events-none absolute inset-0 overflow-hidden">
      <picture className="absolute inset-0 block">
        <source media="(max-width: 767px)" srcSet="/hero-car-sm.webp" type="image/webp" />
        <Image
          src="/hero-car.webp"
          alt="Auto připravené k ocenění"
          fill
          priority
          sizes="(max-width: 767px) 800px, 1280px"
          className="hero-car-photo object-cover object-[50%_60%] sm:object-[52%_56%] lg:object-[58%_52%]"
        />
      </picture>
      <div
        className="absolute inset-0 bg-gradient-to-b from-emerald-500/80 via-primary/45 to-emerald-950/80"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-emerald-800/25 via-transparent to-emerald-950/55 lg:from-emerald-800/15 lg:to-emerald-950/70"
        aria-hidden
      />
    </div>
  )
}
