/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Hero source is 2560×1440 — do not list widths above that or next/image upscales.
    qualities: [75, 85, 88, 90],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920, 2048, 2560],
  },
}

export default nextConfig
