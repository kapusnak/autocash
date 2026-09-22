import { PHOTO_SLOT_LABELS, PHOTO_SLOTS, photoSlotFilename, type PhotoSlot } from "./photo-slots"

export const MAX_PHOTO_FILE_BYTES = 1_000_000
export const ALLOWED_PHOTO_TYPES = new Set(["image/jpeg", "image/webp"])

export type PhotoFileMap = Map<PhotoSlot, File>

export function collectPhotoFiles(
  form: FormData,
): { ok: true; files: PhotoFileMap } | { ok: false; status: 400; error: string } {
  const files: PhotoFileMap = new Map()
  for (const slot of PHOTO_SLOTS) {
    const value = form.get(slot)
    if (!(value instanceof File) || value.size === 0) {
      return { ok: false, status: 400, error: `Chybí fotka: ${PHOTO_SLOT_LABELS[slot]}.` }
    }
    const type = (value.type || "").toLowerCase()
    if (!ALLOWED_PHOTO_TYPES.has(type)) {
      return { ok: false, status: 400, error: `Fotka ${PHOTO_SLOT_LABELS[slot]} musí být JPEG nebo WebP.` }
    }
    if (value.size > MAX_PHOTO_FILE_BYTES) {
      return { ok: false, status: 400, error: `Fotka ${PHOTO_SLOT_LABELS[slot]} je příliš velká.` }
    }
    files.set(slot, value)
  }
  return { ok: true, files }
}

export async function photoAttachments(files: PhotoFileMap, code: string) {
  return Promise.all(
    PHOTO_SLOTS.map(async (slot) => {
      const file = files.get(slot)!
      const buffer = Buffer.from(await file.arrayBuffer())
      const ext = file.type === "image/webp" ? "webp" : "jpg"
      return {
        filename: photoSlotFilename(code, slot, ext),
        content: buffer,
        contentType: file.type || "image/jpeg",
      }
    }),
  )
}
