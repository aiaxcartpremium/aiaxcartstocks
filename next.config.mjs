/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Huwag muna gamitin optimizeCss para iwas 'critters' error
  experimental: {},
  // important: huwag gumamit ng `output: 'export'`
  // kailangan natin ng default server output dahil may Supabase/auth
};
export default nextConfig;