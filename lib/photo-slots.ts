export const PHOTO_SLOTS = ["front", "rear", "side", "interior", "cargo"] as const

export type PhotoSlot = (typeof PHOTO_SLOTS)[number]

export const PHOTO_SLOT_LABELS: Record<PhotoSlot, string> = {
  front: "Zepředu",
  rear: "Zezadu",
  side: "Z boku",
  interior: "Interiér",
  cargo: "Nákladový prostor",
}

export const PHOTO_SLOT_HINTS: Record<PhotoSlot, string> = {
  front: "Celé auto zepředu, včetně SPZ. Ideálně za dne, auto celé v záběru.",
  rear: "Celé auto zezadu, včetně SPZ.",
  side: "Celý bok vozu. Stačí jedna strana, ať je vidět celý profil.",
  interior: "Palubní deska a interiér. Pokud to jde, i stav kilometrů na displeji.",
  cargo: "Otevřený kufr nebo ložná plocha — nákladový prostor vozu.",
}

export function isPhotoSlot(value: string): value is PhotoSlot {
  return (PHOTO_SLOTS as readonly string[]).includes(value)
}
