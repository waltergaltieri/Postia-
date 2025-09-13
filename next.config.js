/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  images: {
    domains: [
      'images.unsplash.com',
      'via.placeholder.com',
      'images.bananabanana.com', // BananaBanana API images
      'lh3.googleusercontent.com', // Google profile images
    ],
  },
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  // Enable standalone output for Docker
  output: 'standalone',
}

module.exports = nextConfig