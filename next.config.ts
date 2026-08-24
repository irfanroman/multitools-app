import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Rewrites barrel imports (`import { Wallet } from 'lucide-react'`) into
  // direct per-module paths so the bundler never has to walk the whole
  // package index. Cuts cold-start compile time and keeps tree shaking exact.
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts', 'papaparse'],
  },

  // Strip console noise from production while keeping real errors.
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
  },

  // Trims a few hundred bytes per response and one fingerprinting header.
  poweredByHeader: false,
  compress: true,

  images: {
    formats: ['image/avif', 'image/webp'],
  },

  async headers() {
    return [
      {
        // Hashed build assets are immutable; let the browser keep them.
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        ],
      },
    ];
  },
};

export default nextConfig;
