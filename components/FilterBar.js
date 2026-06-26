'use client';

import { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Global scope / edition / stage / games selector. Writes the whitelisted filters
// into the URL searchParams; every page reads them server-side and forwards them
// to the intl API. Default state (no params) = All International / Total / no games floor.
const SCOPES = [
  { val: '', label: 'All' },
  { val: 'MSC', label: 'MSC' },
  { val: 'MWC', label: 'M-Series' },
];
const STAGES = [
  { val: '', label: 'Total' },
  { val: 'main', label: 'Main' },
  { val: 'qualifier', label: 'Wildcard' },
];
const GAMES = [
  { val: '', label: 'Any' },
  { val: '5', label: '5+' },
  { val: '10', label: '10+' },
  { val: '20', label: '20+' },
];

export default function FilterBar({ editions = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const scope = (sp.get('scope') || '').toUpperCase();
  const season = sp.get('season') || '';
  const stage = (sp.get('stage') || '').toLowerCase();
  const minGames = sp.get('min_games') || '';

  // Editions available under the current scope (all if scope = All).
  const scopeEditions = editions.filter((e) => !scope || e.tournament_code === scope);

  function push(next) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  function onScope(val) {
    // Changing scope can invalidate the chosen edition — drop it if it no longer fits.
    const stillValid = editions.some(
      (e) => e.season === season && (!val || e.tournament_code === val)
    );
    push({ scope: val, season: stillValid ? season : '' });
  }

  // Active-filter chips (only non-default values appear).
  const editionLabel = (s) => {
    const e = editions.find((x) => x.season === s);
    return e && e.tournament_code === 'MWC' ? `M-Series ${s}` : s;
  };
  const chips = [];
  if (scope) chips.push({ k: 'scope', label: scope === 'MWC' ? 'M-Series' : scope });
  if (season) chips.push({ k: 'season', label: editionLabel(season) });
  if (stage) chips.push({ k: 'stage', label: stage === 'qualifier' ? 'Wildcard' : 'Main' });
  if (minGames) chips.push({ k: 'min_games', label: `${minGames}+ games` });

  return (
    <div className="filterbar-wrap" aria-busy={isPending}>
      <div className="filterbar" data-pending={isPending ? '' : undefined}>
        <div className="filter-group">
          <label>Event</label>
          <div className="seg">
            {SCOPES.map((s) => (
              <button key={s.val} className={scope === s.val ? 'on' : ''} onClick={() => onScope(s.val)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Edition</label>
          <select value={season} onChange={(e) => push({ season: e.target.value })}>
            <option value="">All editions</option>
            {scopeEditions.map((e) => (
              <option key={`${e.tournament_code}-${e.season}`} value={e.season}>
                {e.tournament_code === 'MWC' ? `M-Series ${e.season}` : e.season}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Stage</label>
          <div className="seg">
            {STAGES.map((s) => (
              <button key={s.val} className={stage === s.val ? 'on' : ''} onClick={() => push({ stage: s.val })}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Games</label>
          <div className="seg">
            {GAMES.map((g) => (
              <button key={g.val} className={minGames === g.val ? 'on' : ''} onClick={() => push({ min_games: g.val })}>
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {isPending ? <span className="filter-pending" role="status">Updating…</span> : null}
      </div>

      {chips.length > 0 ? (
        <div className="filter-chips">
          {chips.map((c) => (
            <button key={c.k} className="chip" onClick={() => push({ [c.k]: '' })} aria-label={`Remove ${c.label} filter`}>
              {c.label}<span className="chip-x" aria-hidden="true">×</span>
            </button>
          ))}
          <button className="chip-clear" onClick={() => push({ scope: '', season: '', stage: '', min_games: '' })}>
            Clear all
          </button>
        </div>
      ) : null}
    </div>
  );
}
