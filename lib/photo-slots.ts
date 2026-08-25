export const PHOTO_SLOTS = ["front", "rear", "side", "interior", "cargo", "running"] as const

export type PhotoSlot = (typeof PHOTO_SLOTS)[number]

export const PHOTO_SLOT_LABELS: Record<PhotoSlot, string> = {
  front: "Zepředu",
  rear: "Zezadu",
  side: "Z boku",
  interior: "Interiér",
  cargo: "Nákladový prostor",
  running: "Nastartovaný vůz",
}

export const PHOTO_SLOT_HINTS: Record<PhotoSlot, string> = {
  front: "Celé auto zepředu, včetně SPZ. Ideálně za dne, auto celé v záběru.",
  rear: "Celé auto zezadu, včetně SPZ.",
  side: "Celý bok vozu. Stačí jedna strana, ať je vidět celý profil.",
  interior: "Interiér vozu — sedačky a celkový dojem kabiny.",
  cargo: "Otevřený kufr nebo ložná plocha — nákladový prostor vozu.",
  running:
    "Foto nastartovaného vozu – palubní deska + stav km. Motor běží, ať je vidět budíky a najeté kilometry.",
}

/** Human-readable list for e-mails and privacy copy. */
export const PHOTO_ANGLES_COPY =
  "zepředu, zezadu, z boku, interiér, nákladový prostor (kufr / ložná plocha) a nastartovaný vůz (palubní deska + stav km)"

export function isPhotoSlot(value: string): value is PhotoSlot {
  return (PHOTO_SLOTS as readonly string[]).includes(value)
}
