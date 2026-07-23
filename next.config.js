/** @type {import('next').NextConfig} */

// Single source of truth for security response headers. Defined here (not in
// vercel.json) so they apply in `next dev` AND on Vercel, and can be verified
// locally. See security-rules.md → "Rule 4 — HTTP response headers".
const isDev = process.env.NODE_ENV !== 'production';

const CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  // Runtime images are served through jsDelivr (cdn.jsdelivr.net), which mirrors
  // the mlbb-tool repo — raw.githubusercontent.com rate-limits (429) under load
  // and is kept only as a fallback. Some team logos come from media.aerena.gg.
  // data: covers inline placeholders.
  "img-src 'self' data: https://cdn.jsdelivr.net https://raw.githubusercontent.com https://media.aerena.gg",
  // Next.js injects inline hydration scripts and inline styles (no nonce setup),
  // so 'unsafe-inline' is required. 'unsafe-eval'/ws: are dev-only (React refresh
  // + HMR) and never shipped to production.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval' http://localhost:8400" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
  "font-src 'self' data: https://fonts.gstatic.com https://api.fontshare.com https://cdn.fontshare.com",
  `connect-src 'self'${isDev ? ' ws: http://localhost:8400' : ''}`,
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: CSP },
];

const nextConfig = {
  // Filter changes are soft navigations to the same route with new searchParams.
  // Next 14.2's client Router Cache otherwise serves the stale (unfiltered) page,
  // so History filters appeared to do nothing in prod. 0 = always refetch.
  experimental: { staleTimes: { dynamic: 0, static: 0 } },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net',
      },
      {
        protocol: 'https',
        hostname: 'raw.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'media.aerena.gg',
      },
    ],
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: '/results',
        destination: '/matches',
        permanent: true,
      },
    ];
  },
};
module.exports = nextConfig;
