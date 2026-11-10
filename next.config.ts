import type { NextConfig } from 'next'

const cabecalhos = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  ...(process.env.NODE_ENV === 'production'
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' }]
    : []),
]

const config: NextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  serverExternalPackages: ['@prisma/client', '@prisma/adapter-pg', 'pg'],
  async headers() {
    return [{ source: '/:path*', headers: cabecalhos }]
  },
}

export default config
