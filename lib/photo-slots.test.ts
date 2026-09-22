import assert from "node:assert/strict"
import { test } from "node:test"

import {
  PHOTO_SLOT_HINTS,
  PHOTO_SLOT_LABELS,
  PHOTO_SLOT_TITLES,
  PHOTO_SLOTS,
  photoSlotFilename,
} from "./photo-slots.ts"

test("wizard titles are the confirmed Czech headings and do not change filename stems", () => {
  assert.deepEqual(PHOTO_SLOT_TITLES, {
    front: "Fotka zepředu",
    rear: "Fotka zezadu",
    side: "Fotka z boku",
    interior: "Fotka interiéru",
    cargo: "Fotka nákladového prostoru",
    running: "Fotka nastartovaného vozu",
  })
  assert.equal(PHOTO_SLOTS.every((slot) => PHOTO_SLOT_HINTS[slot].length > 0), true)
  assert.equal(PHOTO_SLOT_LABELS.interior, "Interiér")
  assert.equal(PHOTO_SLOT_LABELS.cargo, "Nákladový prostor")
  assert.equal(PHOTO_SLOT_LABELS.running, "Nastartovaný vůz")
  assert.equal(photoSlotFilename("AC-TEST", "interior", "jpg"), "AC-TEST-Interier.jpg")
  assert.equal(photoSlotFilename("AC-TEST", "cargo", "jpg"), "AC-TEST-Nakladovy-prostor.jpg")
  assert.equal(photoSlotFilename("AC-TEST", "running", "jpg"), "AC-TEST-Nastartovany-vuz.jpg")
})
