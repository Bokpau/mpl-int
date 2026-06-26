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

  const s = p.toString();
  return s ? `?${s}` : '';
}

// Same logic, but returns the normalized values (for highlighting active filters
// in the UI). Unset = the "All" / "Total" default.
export function activeFilters(sp = {}) {
  const scope = String(sp.scope || '').toUpperCase();
  const stage = String(sp.stage || '').toLowerCase();
  return {
    scope: scope === 'MSC' || scope === 'MWC' ? scope : '',
    season: sp.season ? String(sp.season) : '',
    stage: stage === 'main' || stage === 'qualifier' ? stage : '',
  };
}
