// Decides which tournament edition is "featured" — the one the site leads with.
// The main list pages default to this edition instead of the all-time aggregate, so
// the bulk of the site is the most recent / currently-running tournament.
//
// Selection order:
//   1. A manual pin via the server-only FEATURED_EDITION env var ("CODE:season",
//      e.g. "MSC:2025" or "MWC:M6"). This lets an announced edition headline the
//      moment it's announced — before it has any games.
//   2. Auto: the live edition (status 'live'); if several, the most recently added.
//   3. Fallback: the latest edition overall (most recent by season_id).
//
// `season_id` is the editions endpoint's monotonic row id, so a higher id = a more
// recently added edition. It's the only cross-tournament recency signal the
// /api/intl/editions payload exposes today (start_date/end_date exist in the DB but
// aren't returned yet — exposing them would make this more robust).
import { api } from './api';

// Newest edition first (most recently added row).
const byRecency = (a, b) => (Number(b?.season_id) || 0) - (Number(a?.season_id) || 0);

// Parse the FEATURED_EDITION env var ("CODE:season") into { tournament_code, season }.
export function featuredPin() {
  const raw = process.env.FEATURED_EDITION;
  if (!raw) return null;
  const i = String(raw).indexOf(':');
  if (i < 0) return null;
  const tournament_code = raw.slice(0, i).trim().toUpperCase();
  const season = raw.slice(i + 1).trim();
  if (!tournament_code || !season) return null;
  return { tournament_code, season };
}

// Choose the featured edition from the list /api/intl/editions returns.
// `pin` is an optional manual override { tournament_code, season }.
export function pickFeatured(editions = [], pin = null) {
  if (!Array.isArray(editions) || editions.length === 0) return null;

  if (pin) {
    const hit = editions.find(
      (e) =>
        String(e.tournament_code).toUpperCase() === pin.tournament_code &&
        String(e.season) === String(pin.season)
    );
    if (hit) return hit;
  }

  const live = editions
    .filter((e) => String(e.status).toLowerCase() === 'live')
    .sort(byRecency);
  if (live.length) return live[0];

  return [...editions].sort(byRecency)[0];
}

// Server helper for pages: fetch editions and resolve the featured one. Resilient —
// returns null (= no default, fall back to the all-time aggregate) if the backend
// isn't reachable, so a page never crashes over this.
export async function getFeatured() {
  try {
    const editions = await api.editions();
    return pickFeatured(editions, featuredPin());
  } catch {
    return null;
  }
}
