const MAX_EDGE = 1600
const START_QUALITY = 0.8
const MIN_QUALITY = 0.45
const MAX_BYTES = 900_000

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Komprese fotky selhala."))
          return
        }
        resolve(blob)
      },
      "image/jpeg",
      quality,
    )
  })
}

/**
 * Resize to max edge ~1600px and JPEG-compress so SMTP stays under ~1 MB per photo.
 * HEIC: Safari often decodes it; otherwise createImageBitmap throws.
 */
export async function compressImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(file)
  } catch {
    throw new Error("HEIC")
  }

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) {
      throw new Error("Komprese fotky selhala.")
    }
    ctx.drawImage(bitmap, 0, 0, width, height)

    let quality = START_QUALITY
    let blob = await canvasToJpeg(canvas, quality)
    while (blob.size > MAX_BYTES && quality > MIN_QUALITY) {
      quality = Math.max(MIN_QUALITY, quality - 0.1)
      blob = await canvasToJpeg(canvas, quality)
    }
    return blob
  } finally {
    bitmap.close()
  }
}
