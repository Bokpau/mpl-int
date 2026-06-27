// Resolve a Next.js `searchParams` object into the filters actually applied, taking
// the featured-edition default into account. Three cases for the edition:
//   • no `season` param   → the featured edition (its scope + season are pinned), so
//                           the page leads with the most recent tournament.
//   • `season=all`        → the explicit cross-edition aggregate (no season filter).
//   • `season=<label>`    → that specific edition.
// `featured` is the { tournament_code, season } chosen by lib/featured.js. When it's
// null (backend unreachable, or a detail page that opts out) the default is the
// all-time aggregate — the site's original behavior.
export function effectiveFilters(sp = {}, featured = null) {
  const rawScope = String(sp.scope || '').toUpperCase();
  let scope = rawScope === 'MSC' || rawScope === 'MWC' ? rawScope : '';

  const rawSeason = sp.season != null ? String(sp.season) : '';
  const isAll = rawSeason.toLowerCase() === 'all';

  let season = '';
  if (isAll) {
    season = ''; // aggregate — honor scope if given, drop any season filter
  } else if (rawSeason) {
    season = rawSeason; // a specific edition was chosen
  } else if (featured && featured.season) {
    // Default: lead with the featured edition. Pin both scope + season so two
    // tournaments that ever share a season label can't collide.
    season = String(featured.season);
    if (!scope) scope = String(featured.tournament_code || '').toUpperCase();
  }

  const rawStage = String(sp.stage || '').toLowerCase();
  const stage = rawStage === 'main' || rawStage === 'qualifier' ? rawStage : '';

  const mg = parseInt(sp.min_games, 10);
  const min_games = Number.isFinite(mg) && mg > 0 ? mg : 0;

  return {
    scope: scope === 'MSC' || scope === 'MWC' ? scope : '',
    season,
    isAll,
    stage,
    min_games,
  };
}

// Build the intl API query string. Only the whitelisted filters the backend
// understands are forwarded, so junk params can't bust the upstream cache.
export function intlQuery(sp = {}, featured = null) {
  const f = effectiveFilters(sp, featured);
  const p = new URLSearchParams();
  if (f.scope) p.set('scope', f.scope);
  if (f.season) p.set('season', f.season);
  if (f.stage) p.set('stage', f.stage);
  if (f.min_games) p.set('min_games', String(f.min_games));
  const s = p.toString();
  return s ? `?${s}` : '';
}

// Same resolution, but returns the normalized values — for highlighting active
// filters in the UI.
export function activeFilters(sp = {}, featured = null) {
  return effectiveFilters(sp, featured);
}
