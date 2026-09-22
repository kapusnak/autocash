/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    qualities: [75, 85, 88],
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920, 2048, 2560, 2880],
  },
}

export default nextConfig
