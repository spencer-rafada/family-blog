import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      new URL('https://hlxtuikmmagosicqiomi.supabase.co/**'),
      new URL('http://127.0.0.1:54321/**'),
    ],
  },
}

export default nextConfig
