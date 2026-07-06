import { NextResponse } from 'next/server';

// Catch-all proxy so client components can reach the shared backend without ever
// seeing the internal API key. Mirrors the PH site's proxy: it validates the path,
// canonicalizes the query string (collapses param-reorder cache-busting), attaches
// x-api-key on the server, and forwards the backend's Cache-Control to the edge.
const BACKEND = process.env.BACKEND_URL || 'https://mpl-ph-s17-backend.onrender.com';
const API_KEY = process.env.INTERNAL_API_KEY;
const MAX_SLUG_DEPTH = 8;

function canonicalSearch(rawSearch) {
  const p = new URLSearchParams(rawSearch);
  p.sort();
  const s = p.toString();
  return s ? `?${s}` : '';
}

export async function GET(request, { params }) {
  const { slug } = await params;

  if (
    !Array.isArray(slug) ||
    slug.length === 0 ||
    slug.length > MAX_SLUG_DEPTH ||
    // Scope the proxy to the international API only. Without this, the route would
    // attach the shared INTERNAL_API_KEY to *any* backend path (e.g. /api/players),
    // turning this deployment into an authenticated open proxy for the whole PH
    // backend. Every browser call from this site is /api/intl/* (see lib/api.js).
    slug[0] !== 'intl' ||
    slug.some((s) => !s || s === '.' || s === '..' || s.includes('/') || s.includes('\\'))
  ) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const path = slug.map(encodeURIComponent).join('/');
  const search = canonicalSearch(request.nextUrl.search);
  const url = `${BACKEND}/api/${path}${search}`;

  const res = await fetch(url, {
    headers: API_KEY ? { 'x-api-key': API_KEY } : {},
    next: { revalidate: 300 },
  });

  if (!res.ok) {
    return NextResponse.json({ error: 'API error' }, { status: res.status });
  }

  const data = await res.json();
  const cacheControl = res.headers.get('cache-control');
  return NextResponse.json(data, cacheControl ? { headers: { 'Cache-Control': cacheControl } } : undefined);
}
