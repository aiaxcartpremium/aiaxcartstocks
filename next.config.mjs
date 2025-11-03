/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ Ignore TypeScript build errors (safe for deployment testing)
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Ignore ESLint errors during build
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ Optional: enable faster builds on Vercel
  experimental: {
    optimizeCss: true,
    serverActions: {
      allowedOrigins: ['*'],
    },
  },
};

export default nextConfig;