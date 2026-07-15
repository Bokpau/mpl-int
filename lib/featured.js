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
import { effectiveFilters, intlQuery, selectionLabel } from './filters';

// Newest edition first. Compares season_number (chronological year/order) if tournament codes match,
// otherwise falls back to season_id (insertion order).
const byRecency = (a, b) => {
  if (a?.tournament_code && b?.tournament_code && a.tournament_code === b.tournament_code) {
    return (Number(b.season_number) || 0) - (Number(a.season_number) || 0);
  }
  return (Number(b?.season_id) || 0) - (Number(a?.season_id) || 0);
};

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

// Helper to resolve division (female vs open)
function resolveDivision(sp) {
  const rawDiv = String(sp?.division || sp?.gender_division || '').toLowerCase();
  return rawDiv === 'female' || rawDiv === 'women' ? 'female' : 'open';
}

// Choose the featured edition from the list /api/intl/editions returns.
// `pin` is an optional manual override { tournament_code, season }.
export function pickFeatured(editions = [], pin = null, division = 'open') {
  if (!Array.isArray(editions) || editions.length === 0) return null;

  // Filter editions by division to ensure we don't mix Open (MSC/MWC) and Female (MWI)
  const isFemale = division === 'female' || division === 'women';
  const filtered = editions.filter((e) => {
    const isMwi = String(e.tournament_code).toUpperCase() === 'MWI';
    return isFemale ? isMwi : !isMwi;
  });

  if (filtered.length === 0) return null;

  if (pin) {
    const hit = filtered.find(
      (e) =>
        String(e.tournament_code).toUpperCase() === pin.tournament_code &&
        String(e.season) === String(pin.season)
    );
    if (hit) return hit;
  }

  const live = filtered
    .filter((e) => String(e.status).toLowerCase() === 'live')
    .sort(byRecency);
  if (live.length) return live[0];

  return [...filtered].sort(byRecency)[0];
}

// Server helper for pages: fetch editions and resolve the featured one. Resilient —
// returns null (= no default, fall back to the all-time aggregate) if the backend
// isn't reachable, so a page never crashes over this.
export async function getFeatured(division = 'open') {
  try {
    const editions = await api.editions();
    return pickFeatured(editions, featuredPin(), division);
  } catch {
    return null;
  }
}

// One-stop resolver for list pages: fetch editions, pick the featured edition, and
// derive the effective filters, the API query string, and the heading label for the
// current selection. `editions` is also returned for callers that need it.
export async function resolveSelection(sp = {}, useFeatured = true) {
  let editions = [];
  try {
    editions = await api.editions();
  } catch {
    editions = [];
  }
  const division = resolveDivision(sp);
  const featured = useFeatured ? pickFeatured(editions, featuredPin(), division) : null;
  const eff = effectiveFilters(sp, featured);
  return {
    editions,
    featured,
    eff,
    q: intlQuery(sp, featured),
    label: selectionLabel(eff, editions),
  };
}

// A resolver for the current/live tournament pages. Puts a lock on scope + season
// (forces them to match the featured edition, ignoring URL tampering) while still
// honoring stage, min_games, etc.
export async function resolveCurrent(sp = {}) {
  let editions = [];
  try {
    editions = await api.editions();
  } catch {
    editions = [];
  }
  const division = resolveDivision(sp);
  const featured = pickFeatured(editions, featuredPin(), division);

  // Force scope and season to be the featured ones
  const currentSp = { ...sp };
  if (featured) {
    currentSp.scope = featured.tournament_code;
    currentSp.season = featured.season;
  }

  const eff = effectiveFilters(currentSp, featured);
  return {
    editions,
    featured,
    eff,
    q: intlQuery(currentSp, featured),
    label: selectionLabel(eff, editions),
  };
}

