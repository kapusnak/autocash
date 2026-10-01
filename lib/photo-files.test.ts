import assert from "node:assert/strict"
import { test } from "node:test"

import { collectPhotoFiles, MAX_PHOTO_FILE_BYTES, photoAttachments } from "./photo-files.ts"
import { PHOTO_SLOT_LABELS, PHOTO_SLOTS } from "./photo-slots.ts"

function jpegFile(size = 8) {
  return new File([new Uint8Array(size).fill(0xff)], "x.jpg", { type: "image/jpeg" })
}

test("collectPhotoFiles accepts every required JPEG/WebP under the size cap", () => {
  const form = new FormData()
  for (const slot of PHOTO_SLOTS) {
    form.append(slot, jpegFile())
  }
  const result = collectPhotoFiles(form)
  assert.equal(result.ok, true)
  if (result.ok) assert.equal(result.files.size, PHOTO_SLOTS.length)
})

test("collectPhotoFiles rejects missing, wrong type, and oversized files", () => {
  const missing = collectPhotoFiles(new FormData())
  assert.equal(missing.ok, false)
  if (!missing.ok) assert.match(missing.error, /Chybí fotka/)

  const wrongType = new FormData()
  for (const slot of PHOTO_SLOTS) {
    wrongType.append(slot, new File([new Uint8Array([1, 2, 3])], "x.png", { type: "image/png" }))
  }
  const typed = collectPhotoFiles(wrongType)
  assert.equal(typed.ok, false)
  if (!typed.ok) assert.match(typed.error, /JPEG nebo WebP/)

  const huge = new FormData()
  for (const slot of PHOTO_SLOTS) {
    huge.append(slot, jpegFile(MAX_PHOTO_FILE_BYTES + 1))
  }
  const oversized = collectPhotoFiles(huge)
  assert.equal(oversized.ok, false)
  if (!oversized.ok) assert.match(oversized.error, /příliš velká/)
})

test("the old single interior slot does not satisfy the split interior or licence steps", () => {
  const form = new FormData()
  for (const slot of ["front", "rear", "side", "interior", "cargo", "running"]) {
    form.append(slot, jpegFile())
  }
  const result = collectPhotoFiles(form)
  assert.equal(result.ok, false)
  if (!result.ok) assert.equal(result.error, `Chybí fotka: ${PHOTO_SLOT_LABELS.interiorFront}.`)
})

test("attachment names follow the Czech slot labels in wizard order", async () => {
  const form = new FormData()
  for (const slot of PHOTO_SLOTS) {
    form.append(slot, jpegFile())
  }
  const result = collectPhotoFiles(form)
  assert.equal(result.ok, true)
  if (!result.ok) return
  const attachments = await photoAttachments(result.files, "AC-TEST")
  assert.deepEqual(
    attachments.map((item) => item.filename),
    [
      "AC-TEST-Zepredu.jpg",
      "AC-TEST-Zezadu.jpg",
      "AC-TEST-Z-boku.jpg",
      "AC-TEST-Interier-predni-cast.jpg",
      "AC-TEST-Interier-zadni-cast.jpg",
      "AC-TEST-Nakladovy-prostor.jpg",
      "AC-TEST-Nastartovany-vuz.jpg",
      "AC-TEST-Technicky-prukaz-predni-strana.jpg",
      "AC-TEST-Technicky-prukaz-zadni-strana.jpg",
    ],
  )
})
