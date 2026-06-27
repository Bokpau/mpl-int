'use client';

import { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { effectiveFilters, familyLabel, editionTitle } from '../lib/filters';

// Global scope / edition / stage / games selector. Writes the whitelisted filters
// into the URL searchParams; every list page reads them server-side and forwards them
// to the intl API. The default (clean URL) leads with the FEATURED edition — the most
// recent / currently-running tournament — so it's the bulk of the site. Picking
// "All editions" (season=all) switches to the cross-edition aggregate.
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

const ALL = 'all'; // explicit cross-edition aggregate sentinel

const editionOptionLabel = (e) => editionTitle(e);

export default function FilterBar({ editions = [], featured = null }) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Resolve the URL into the filters actually in effect, applying the featured default.
  const spObj = Object.fromEntries(sp.entries());
  const eff = effectiveFilters(spObj, featured);

  // The Event segment is built from the families that actually exist, plus "All".
  const FAMILIES = [{ val: '', label: 'All' }];
  for (const code of ['MSC', 'MWC']) {
    if (editions.some((e) => e.tournament_code === code)) {
      FAMILIES.push({ val: code, label: familyLabel(code) });
    }
  }

  // Editions listed under the current family (all of them when family = All).
  const scopeEditions = editions.filter((e) => !eff.scope || e.tournament_code === eff.scope);

  function push(next) {
    const params = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(next)) {
      if (v) params.set(k, v);
      else params.delete(k);
    }
    const qs = params.toString();
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
  }

  function onFamily(val) {
    // Keep the chosen edition only if it still belongs to the new family; otherwise
    // drop to that family's aggregate (All editions) so the view stays coherent.
    const keep =
      val && !eff.isAll && eff.season &&
      editions.some((e) => e.season === eff.season && e.tournament_code === val);
    push({ scope: val, season: keep ? eff.season : ALL });
  }

  // The edition <select> shows the featured edition by default, the aggregate when
  // "All editions" is active, or the explicitly chosen edition.
  const selectValue = eff.isAll ? ALL : eff.season || ALL;

  // Active-filter chips — only deviations from the featured default appear. Clearing
  // an edition chip drops both season and scope, returning to the featured default.
  const chips = [];
  if (eff.isAll) {
    chips.push({
      k: 'season',
      label: eff.scope ? `All ${familyLabel(eff.scope)} editions` : 'All editions',
      clear: { season: '', scope: '' },
    });
  } else if (eff.season && (!featured || eff.season !== String(featured.season))) {
    const e = editions.find((x) => x.season === eff.season && (!eff.scope || x.tournament_code === eff.scope));
    chips.push({ k: 'season', label: e ? editionOptionLabel(e) : eff.season, clear: { season: '', scope: '' } });
  }
  if (eff.stage) chips.push({ k: 'stage', label: eff.stage === 'qualifier' ? 'Wildcard' : 'Main', clear: { stage: '' } });
  if (eff.min_games) chips.push({ k: 'min_games', label: `${eff.min_games}+ games`, clear: { min_games: '' } });

  return (
    <div className="filterbar-wrap" aria-busy={isPending}>
      <div className="filterbar" data-pending={isPending ? '' : undefined}>
        <div className="filter-group">
          <label>Event</label>
          <div className="seg">
            {FAMILIES.map((s) => (
              <button key={s.val} className={eff.scope === s.val ? 'on' : ''} onClick={() => onFamily(s.val)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Edition</label>
          <select value={selectValue} onChange={(e) => push({ season: e.target.value })}>
            <option value={ALL}>All editions</option>
            {scopeEditions.map((e) => (
              <option key={`${e.tournament_code}-${e.season}`} value={e.season}>
                {editionOptionLabel(e)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Stage</label>
          <div className="seg">
            {STAGES.map((s) => (
              <button key={s.val} className={eff.stage === s.val ? 'on' : ''} onClick={() => push({ stage: s.val })}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-group">
          <label>Games</label>
          <div className="seg">
            {GAMES.map((g) => (
              <button key={g.val} className={String(eff.min_games || '') === g.val ? 'on' : ''} onClick={() => push({ min_games: g.val })}>
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
            <button key={c.k} className="chip" onClick={() => push(c.clear)} aria-label={`Remove ${c.label} filter`}>
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
