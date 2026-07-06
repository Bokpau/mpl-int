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
  // Runtime images come from the shared raw.githubusercontent CDN; some team
  // logos come from media.aerena.gg. data: covers inline placeholders.
  "img-src 'self' data: https://raw.githubusercontent.com https://media.aerena.gg",
  // Next.js injects inline hydration scripts and inline styles (no nonce setup),
  // so 'unsafe-inline' is required. 'unsafe-eval'/ws: are dev-only (React refresh
  // + HMR) and never shipped to production.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.fontshare.com",
  "font-src 'self' data: https://fonts.gstatic.com https://api.fontshare.com https://cdn.fontshare.com",
  `connect-src 'self'${isDev ? ' ws:' : ''}`,
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
