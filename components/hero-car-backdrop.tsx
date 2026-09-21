import Image from "next/image"

/** Soft-masked hero car on the right; left side washes into the emerald UI. */
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
          className="hero-car-photo object-cover object-[42%_58%] sm:object-[44%_52%] lg:object-[40%_48%]"
        />
      </picture>
      {/* Left-weighted wash: copy sits on the open road; the car stays clear on the right. */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-emerald-600 from-0% via-primary/75 via-[42%] to-transparent to-[68%] lg:from-emerald-600/95 lg:via-primary/45 lg:via-[36%] lg:to-transparent lg:to-[58%]"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-emerald-500/75 via-transparent to-emerald-950/80 lg:from-emerald-500/45 lg:to-emerald-950/35"
        aria-hidden
      />
      {/* Mobile: photo stays secondary behind stacked copy + form. */}
      <div className="absolute inset-0 bg-primary/40 lg:hidden" aria-hidden />
    </div>
  )
}
