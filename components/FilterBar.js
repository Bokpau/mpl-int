'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Global scope / edition / stage selector. Writes the three whitelisted filters
// into the URL searchParams; every page reads them server-side and forwards them
// to the intl API. Default state (no params) = All International / Total stage.
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

export default function FilterBar({ editions = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const scope = (sp.get('scope') || '').toUpperCase();
  const season = sp.get('season') || '';
  const stage = (sp.get('stage') || '').toLowerCase();

  // Editions available under the current scope (all if scope = All).
  const scopeEditions = editions.filter((e) => !scope || e.tournament_code === scope);

  function push(next) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function onScope(val) {
    // Changing scope can invalidate the chosen edition — drop it if it no longer fits.
    const stillValid = editions.some(
      (e) => e.season === season && (!val || e.tournament_code === val)
    );
    push({ scope: val, season: stillValid ? season : '' });
  }

  return (
    <div className="filterbar">
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
    </div>
  );
}
