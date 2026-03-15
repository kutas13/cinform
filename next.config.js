/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: [],
  },
  env: {
    CUSTOM_KEY: 'foxvize-panel',
  },
}

module.exports = nextConfig