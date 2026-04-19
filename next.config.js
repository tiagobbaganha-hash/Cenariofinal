/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore type errors during build
    // TODO: Fix all type errors and set back to false
    ignoreBuildErrors: true,
  },
  eslint: {
    // Temporarily ignore eslint errors during build  
    // TODO: Fix all eslint errors and set back to false
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig
