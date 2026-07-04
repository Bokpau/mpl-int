# Separate Current-Tournament vs History — Architecture Split

> **Goal:** Stop the Dashboard / Standings / Matches / Stats pages from doubling as
> both the live-tournament view **and** the historical drill-down. Make the split a
> real route + layout boundary, with shared view components rendered on both sides.

Last updated: 2026-07-04.

---

## Why (the problem)

Today "which edition am I looking at" is a **URL parameter**, not a structural
boundary. Concretely:

1. **The same Dashboard renders both current and history.** `app/page.js` carries its
   own `FilterBar`, and `app/history/page.js` links edition cards back into
   `/?scope=…&season=…` — so `/` is simultaneously the live homepage and the per-edition
   history detail view.
2. **The FilterBar is inconsistent.** Of the 8 main pages, only the Dashboard shows it.
   Standings, Matches, and the 5 Stats pages accept the same edition params via
   `resolveSelection` but expose no UI — history mode is reachable only by hand-typed URLs.
   The comment in `app/history/layout.js` even claims *"the global filter lives ONLY here"* — untrue.
3. **History and Stats are near-duplicate code.** `/history/players` and `/players` are the
   same `StatTable` + columns, differing only in default selection and wrapping layout.
4. **History is incomplete.** It has players/teams/heroes/nations/records but **no Standings
   and no Matches** — which is partly why it bounces back into `/`.

## Decisions (locked in with BOK, 2026-07-04)

- **History scope:** Full parity. History gets its own Dashboard, Standings, Matches, and Stats,
  all edition-switchable. Current pages lock to the live edition and stop doubling as the viewer.
- **Current lock level:** Pin the featured/live edition (URL tampering can't switch it), but keep
  the Wildcard / Main / Total **stage toggle**, which matters during a running event.
- **Route rename:** `/results` → `/matches` (nav already says "Matches"); add a redirect from `/results`.

## Hard constraints (from repo rules)

- `CLAUDE.md`: plain language; ask before assuming; when unsure, say so.
- `security-rules.md`: follow for any change touching DB/auth/API/env vars.
- `identity-rules.md`: follow for any change touching player/team/era names, identity, or aggregation.
- `design-rules.md`: role icon (not name); team icon + code; player image + name; hero icon + name; fixed team colors.
- Keep the design-token system (`app/globals.css :root`) and the server-component data-fetching
  pattern (`lib/api.js` on the server; client components hit `/api/*`).

---

## Target architecture

```
CURRENT (locked to featured/live edition, stage toggle only)
  /                  Dashboard        -> <DashboardView>
  /standings         Standings        -> <StandingsView>
  /matches           Matches          -> <MatchesView>   (renamed from /results)
  /players /heroes /teams /nations /regions  -> <...StatsView>

HISTORY (edition-switchable, FilterBar in layout)
  /history           Overview (edition index) — unchanged
  /history/dashboard   NEW  -> <DashboardView>
  /history/standings   NEW  -> <StandingsView>
  /history/matches     NEW  -> <MatchesView>
  /history/players /heroes /teams /nations /regions /records  -> same shared views
```

Detail pages (`/teams/[key]`, `/players/[key]`, `/heroes/[heroid]`) already default to the
cross-edition aggregate — they stay as-is and serve both sections.

### The one new concept

A `resolveCurrent(sp)` helper in `lib/featured.js`, parallel to `resolveSelection`, that
**forces the featured edition** (ignores `?season`/`?scope`) but still honors `?stage` and
`?min_games`. This is what makes "current" a real lock instead of just a default.

---

## Phases

### Phase 1 — Extract view components (NO behavior change)  ✅
Moved the render bodies out of the 8 main pages into `components/views/`:
`DashboardView`, `StandingsView`, `MatchesView`, `PlayerStatsView`, `HeroStatsView`,
`TeamStatsView`, `NationsView`, `RegionsView`. Each takes the resolved selection
(`{ q, label, eff, editions, featured }`) and does its own fetching + rendering (container
+ PageHead + body). The 8 main pages are now thin wrappers that call `resolveSelection(sp)`
and render `<View {...sel} />` — output is byte-identical to before. No new props or
"chrome" toggles yet; the current/history chrome differences land in Phases 2 & 4.

### Phase 2 — Add `resolveCurrent` + lock the current pages
- Add `resolveCurrent(sp)` to `lib/featured.js`.
- Switch the 8 current pages to `resolveCurrent` (pinned to the live edition regardless of URL).
- Remove the `FilterBar` from the Dashboard; add `components/StageFilter.js` (Total / Main /
  Wildcard only) to the current Dashboard, Standings, and Matches.

### Phase 3 — Rename /results -> /matches
- Create `app/matches/page.js` (renders `MatchesView`), delete `app/results/page.js`.
- Add a `/results` -> `/matches` redirect in `next.config.js` (currently empty).
- Update the Nav "Matches" link.

### Phase 4 — Build History parity
- New routes `app/history/dashboard`, `app/history/standings`, `app/history/matches`, each
  rendering the shared View with `resolveSelection(sp)` (FilterBar already in `history/layout.js`).
  Add `app/history/regions` for a complete set.
- Refactor existing `/history/players|heroes|teams|nations` to render the shared StatsViews
  (kills the near-duplicate `StatTable` blocks).
- Add the new tabs to the History dropdown in Nav.

### Phase 5 — Re-point cross-links + cleanup
- `app/history/page.js` edition cards/rows: link to `/history/dashboard?scope&season` (stay in history).
- Fix the stale `app/history/layout.js` comment.
- Add a "Live" / edition badge to the current PageHead eyebrow so the two sections read differently.

**Verify** after Phases 2, 3, 4 with the preview server: console/network clean, snapshot each
route, confirm current pages ignore a hand-typed `?season=` and history pages honor it.

---

## Status log

- **2026-07-04** — Plan written.
- **2026-07-04** — Phase 1 done: 8 view components extracted to `components/views/`, pages
  reduced to thin wrappers. No behavior change (BOK to eyeball-test). Committed for push.
  Next: Phase 2 (`resolveCurrent` + lock current pages + `StageFilter`).
</content>
</invoke>
