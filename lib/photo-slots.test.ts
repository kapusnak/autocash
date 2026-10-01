import assert from "node:assert/strict"
import { test } from "node:test"

import {
  PHOTO_ANGLES_COPY,
  PHOTO_SLOT_HINTS,
  PHOTO_SLOT_LABELS,
  PHOTO_SLOT_TITLES,
  PHOTO_SLOTS,
  photoSlotFilename,
} from "./photo-slots.ts"

test("wizard titles are the confirmed Czech headings and do not change filename stems", () => {
  assert.deepEqual(PHOTO_SLOTS, [
    "front",
    "rear",
    "side",
    "interiorFront",
    "interiorRear",
    "cargo",
    "running",
    "tpFront",
    "tpRear",
  ])
  assert.equal(PHOTO_SLOTS.length, 9)
  assert.equal((PHOTO_SLOTS as readonly string[]).includes("interior"), false)

  assert.deepEqual(PHOTO_SLOT_TITLES, {
    front: "Fotka zepředu",
    rear: "Fotka zezadu",
    side: "Fotka z boku",
    interiorFront: "Interiér – přední část",
    interiorRear: "Interiér – zadní část",
    cargo: "Fotka nákladového prostoru",
    running: "Fotka nastartovaného vozu",
    tpFront: "Technický průkaz – přední strana",
    tpRear: "Technický průkaz – zadní strana",
  })
  assert.equal(PHOTO_SLOTS.every((slot) => PHOTO_SLOT_HINTS[slot].length > 0), true)
  assert.equal(PHOTO_SLOT_LABELS.interiorFront, "Interiér – přední část")
  assert.equal(PHOTO_SLOT_LABELS.interiorRear, "Interiér – zadní část")
  assert.equal(PHOTO_SLOT_LABELS.tpFront, "Technický průkaz – přední strana")
  assert.equal(PHOTO_SLOT_LABELS.tpRear, "Technický průkaz – zadní strana")
  assert.equal(PHOTO_SLOT_LABELS.cargo, "Nákladový prostor")
  assert.equal(PHOTO_SLOT_LABELS.running, "Nastartovaný vůz")
  assert.equal(photoSlotFilename("AC-TEST", "interiorFront", "jpg"), "AC-TEST-Interier-predni-cast.jpg")
  assert.equal(photoSlotFilename("AC-TEST", "interiorRear", "webp"), "AC-TEST-Interier-zadni-cast.webp")
  assert.equal(photoSlotFilename("AC-TEST", "cargo", "jpg"), "AC-TEST-Nakladovy-prostor.jpg")
  assert.equal(photoSlotFilename("AC-TEST", "running", "jpg"), "AC-TEST-Nastartovany-vuz.jpg")
  assert.equal(
    photoSlotFilename("AC-TEST", "tpFront", "jpg"),
    "AC-TEST-Technicky-prukaz-predni-strana.jpg",
  )
  assert.equal(
    photoSlotFilename("AC-TEST", "tpRear", "jpg"),
    "AC-TEST-Technicky-prukaz-zadni-strana.jpg",
  )
  assert.match(PHOTO_ANGLES_COPY, /interiér přední části/)
  assert.match(PHOTO_ANGLES_COPY, /interiér zadní části/)
  assert.match(PHOTO_ANGLES_COPY, /technický průkaz z přední strany/)
  assert.match(PHOTO_ANGLES_COPY, /technický průkaz ze zadní strany/)
  assert.doesNotMatch(PHOTO_ANGLES_COPY, /interiér,/)
})
