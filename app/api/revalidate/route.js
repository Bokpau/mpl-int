import crypto from 'crypto';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';

// On-demand cache purge, called by the backend right after an admin
// upload/sync/refresh-agg finishes (see mpl-ph-s17-backend's
// notifyIntlRevalidate). This is the only thing that makes uploaded
// games/matches show up immediately instead of waiting out the 300s
// fallback in lib/api.js and app/api/[...slug]/route.js.
//
// Not part of the [...slug] proxy: makes no backend call, so it's outside
// security-rules.md Rule 3 ("GET only, backend-scoped") — this route only
// ever touches this site's own Next.js cache.

function timingSafeSecretMatch(provided, expected) {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on length mismatch, and returning early on a
  // length check is fine (length alone doesn't disclose secret content),
  // but comparing content byte-by-byte in constant time is what keeps a
  // correct-length guess from being distinguishable via response timing.
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request) {
  const provided = request.headers.get('x-revalidate-secret');
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !timingSafeSecretMatch(provided, expected)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const tags = Array.isArray(body?.tags) && body.tags.length ? body.tags : ['intl'];
  tags.forEach((tag) => revalidateTag(tag));

  return NextResponse.json({ revalidated: true, tags, now: Date.now() });
}
