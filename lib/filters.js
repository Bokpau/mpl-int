// Turn a Next.js `searchParams` object into the intl API query string. Only the
// three whitelisted filters the backend understands are forwarded: scope (event
// family), season (edition label), stage (the three-way Total/Main/Wildcard).
// Everything else is dropped so junk params can't bust the upstream cache.
export function intlQuery(sp = {}) {
  const p = new URLSearchParams();

  const scope = String(sp.scope || '').toUpperCase();
  if (scope === 'MSC' || scope === 'MWC') p.set('scope', scope);

  if (sp.season) p.set('season', String(sp.season));

  const stage = String(sp.stage || '').toLowerCase();
  if (stage === 'main' || stage === 'qualifier') p.set('stage', stage);

  // Optional "games played" threshold. Only a positive integer is forwarded, so
  // junk values can't bust the upstream cache. There is NO default — unset = all.
  const mg = parseInt(sp.min_games, 10);
  if (Number.isFinite(mg) && mg > 0) p.set('min_games', String(mg));

  const s = p.toString();
  return s ? `?${s}` : '';
}

// Same logic, but returns the normalized values (for highlighting active filters
// in the UI). Unset = the "All" / "Total" default.
export function activeFilters(sp = {}) {
  const scope = String(sp.scope || '').toUpperCase();
  const stage = String(sp.stage || '').toLowerCase();
  const mg = parseInt(sp.min_games, 10);
  return {
    scope: scope === 'MSC' || scope === 'MWC' ? scope : '',
    season: sp.season ? String(sp.season) : '',
    stage: stage === 'main' || stage === 'qualifier' ? stage : '',
    min_games: Number.isFinite(mg) && mg > 0 ? mg : 0,
  };
}
