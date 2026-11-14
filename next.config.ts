import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Static HTML export: the same out/ folder is served by Vercel and Cloudflare Pages.
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
}

export default nextConfig
