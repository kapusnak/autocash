import { statSync } from "node:fs"

import sharp from "sharp"

const desktopPath = "public/hero-car.webp"
const mobilePath = "public/hero-car-sm.webp"
const maxDesktopBytes = 800 * 1024

async function main() {
  const desktop = await sharp(desktopPath).metadata()
  const mobile = await sharp(mobilePath).metadata()
  const desktopBytes = statSync(desktopPath).size
  const mobileBytes = statSync(mobilePath).size

  if ((desktop.width ?? 0) < 2560) {
    throw new Error(`hero-car.webp must be ≥2560 wide, got ${desktop.width}×${desktop.height}`)
  }
  if (desktopBytes > maxDesktopBytes) {
    throw new Error(`hero-car.webp should stay under 800KB, got ${desktopBytes} bytes`)
  }
  if ((mobile.width ?? 0) < 1600) {
    throw new Error(`hero-car-sm.webp must be ≥1600 wide, got ${mobile.width}×${mobile.height}`)
  }

  console.log(
    `ok ${desktopPath} ${desktop.width}×${desktop.height} ${desktopBytes}B; ${mobilePath} ${mobile.width}×${mobile.height} ${mobileBytes}B`,
  )
}

void main()
