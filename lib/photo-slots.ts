export const PHOTO_SLOTS = [
  "front",
  "rear",
  "side",
  "interiorFront",
  "interiorRear",
  "cargo",
  "running",
  "tpFront",
  "tpRear",
] as const

export type PhotoSlot = (typeof PHOTO_SLOTS)[number]

export const PHOTO_SLOT_LABELS: Record<PhotoSlot, string> = {
  front: "Zepředu",
  rear: "Zezadu",
  side: "Z boku",
  interiorFront: "Interiér – přední část",
  interiorRear: "Interiér – zadní část",
  cargo: "Nákladový prostor",
  running: "Nastartovaný vůz",
  tpFront: "Technický průkaz – přední strana",
  tpRear: "Technický průkaz – zadní strana",
}

/** Wizard step titles only — not used for filenames or operator emails. */
export const PHOTO_SLOT_TITLES: Record<PhotoSlot, string> = {
  front: "Fotka zepředu",
  rear: "Fotka zezadu",
  side: "Fotka z boku",
  interiorFront: "Interiér – přední část",
  interiorRear: "Interiér – zadní část",
  cargo: "Fotka nákladového prostoru",
  running: "Fotka nastartovaného vozu",
  tpFront: "Technický průkaz – přední strana",
  tpRear: "Technický průkaz – zadní strana",
}

/** Attachment filename stem (Czech label without diacritics, spaces → hyphens). */
export function photoSlotFilename(code: string, slot: PhotoSlot, ext: string): string {
  const label = PHOTO_SLOT_LABELS[slot]
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
  return `${code}-${label}.${ext}`
}

export const PHOTO_SLOT_HINTS: Record<PhotoSlot, string> = {
  front: "Celé auto zepředu, včetně SPZ. Ideálně za dne, auto celé v záběru.",
  rear: "Celé auto zezadu, včetně SPZ.",
  side: "Celý bok vozu. Stačí jedna strana, ať je vidět celý profil.",
  interiorFront: "Přední část kabiny — sedadla řidiče a spolujezdce a palubní deska.",
  interiorRear: "Zadní část kabiny — zadní sedadla a prostor pro cestující.",
  cargo: "Otevřený kufr nebo ložná plocha — nákladový prostor vozu.",
  running:
    "Foto nastartovaného vozu – palubní deska + stav km. Motor běží, ať je vidět budíky a najeté kilometry.",
  tpFront: "Přední strana technického průkazu. Celý dokument v záběru a čitelně.",
  tpRear: "Zadní strana technického průkazu. Celý dokument v záběru a čitelně.",
}

/** Human-readable list for e-mails and privacy copy. */
export const PHOTO_ANGLES_COPY =
  "zepředu, zezadu, z boku, interiér přední části, interiér zadní části, nákladový prostor (kufr / ložná plocha), nastartovaný vůz (palubní deska + stav km), technický průkaz z přední strany a technický průkaz ze zadní strany"

export function isPhotoSlot(value: string): value is PhotoSlot {
  return (PHOTO_SLOTS as readonly string[]).includes(value)
}
