# Move Computation to the Backend — Audit + Plan

> **Goal:** Make `mpl-intl` a **render-only frontend**. All statistical aggregation and
> derivation logic lives behind the shared backend's `/api/intl/*` API (guarded by the
> internal API key). No proprietary rollup/diff logic and no raw per-frame data ship in
> the browser JS bundle. Client components **fetch pre-computed endpoints and render** —
> nothing more.

Last updated: 2026-07-06.

## Execution status (2026-07-06)

- **Phase 1 — DONE (pending backend deploy).** Backend `GET /api/intl/matches/:battleId/role-diff`
  added (`mpl-ph-s17-backend/index.js`, after the intl `map-data` handler); it runs the old
  `buildSeries` rollup server-side and returns the finished `{ series }`. Frontend
  `RoleDiffChart` now fetches `/role-diff` and deletes its client `buildSeries`; `api.matchRoleDiff`
  added. **Deploy the backend first**, then the frontend switch goes live. This is the real win:
  raw per-5s snapshots + the multi-stat rollup no longer ship to the browser.
- **Phase 2 — DESCOPED (BOK, 2026-07-06).** The Matches components genuinely need per-game rows
  (the List view renders per-game `MatchCard` box scores; the Grid needs games for bracket
  attribution), so they can't become "fetch pre-rolled series only" without breaking cards or
  double-fetching. The only browser-shipped rollup is `MatchResultsGrid`'s **trivial win-count**
  `buildSeries`; `DashboardView`'s copy already runs **server-side**. Net value ≈ 0, so
  `buildSeries` stays in `lib/msc2026Bracket.js`. Recorded as an accepted exception in
  [`architecture-rules.md`](../architecture-rules.md).
- **Phase 3 — SKIPPED (BOK, 2026-07-06).** `PlayerStatsView` (client) refetches
  `/api/intl/leaderboard` on filter changes and re-derives team codes with `resolveTeam`, so the
  only removal paths were the Decision-7-rejected backend `team_display_*` route or a filter
  rearchitecture. `resolveTeam` is ~40 lines of publicly-documented era-vs-franchise field
  selection, not a secret formula → accepted as-is. Recorded in
  [`architecture-rules.md`](../architecture-rules.md).
- **Phase 4 — DONE.** [`architecture-rules.md`](../architecture-rules.md) written with the honest
  boundary: no *raw-data* aggregation in client components (rule holds), but trivial
  presentation-filtering / grouping / counting over already-computed rows is allowed. No
  automated grep added (false-positives on the allowed cases).

## Decisions (locked with BOK, 2026-07-06)

1. **Path B — push into the shared backend.** Computation moves into
   `mpl-ph-s17-backend` as new/extended `/api/intl/*` endpoints (SQL/JS), not just into
   server components of this repo. Raw data and logic never leave the backend.
2. **Driver:** (a) hide proprietary logic from view-source / scrapers, and
   (b) architectural cleanliness (frontend renders, backend derives).
3. **Seeding constants stay as frontend constants.** `WILD_CARD_GROUPS` / `DECIDER` /
   `GAUNTLET_SERIES` in [`lib/msc2026Bracket.js`](../lib/msc2026Bracket.js) are public
   Liquipedia bracket structure — a documented MSC 2026 one-off. They stay in code; only
   the **rollup math** that consumes them moves.
4. **Phase 3 (identity resolver exposure) is IN scope.**
5. **Cross-repo, but PH pages are out of scope.** This plan touches only `mpl-intl` and
   the backend's `/api/intl/*` routes. The PH site (`mpl-ph-s17`) is not changed here.
6. **Only the proprietary rollup math moves to the backend; the bracket overlay stays
   frontend.** `buildSeries` (raw games → series W/L) is the valuable aggregation → it
   moves. `computeDecider` is public-bracket slot-matching over already-rolled series →
   it stays as a thin frontend overlay next to the seeding constants (Decision 3). **No
   new `wildcard-bracket` endpoint; no server-parent lift** — the client Matches view
   keeps its interactive stage/week filtering, just over *server-computed* series.
7. **Phase 3 uses server-render prop-threading, not backend-resolved fields.**
   `lib/identity.js` stays the single source of truth (per `current-vs-history-rules.md`);
   it runs server-side and threads resolved `{code,name,logo}` props to client
   components. Era-mode awareness is **not** pushed into the backend API — that would
   fragment the resolver across frontend + backend SQL and risk the drift those rules
   exist to prevent.

---

## Why (the problem)

The heavy stat math is **already** server-side: `/api/intl/*` returns pre-aggregated rows
(`avg_kills`, `win_rate`, `kda`, `gpm`, totals). [`lib/columns.js`](../lib/columns.js) only
labels/formats them. That baseline is correct.

But four things still derive data **in the browser** (or duplicate derivation logic that
should have one home in the backend):

| # | Where | What derives client-side | Ships to browser? |
|---|-------|--------------------------|-------------------|
| 1 | [`components/RoleDiffChart.js:66`](../components/RoleDiffChart.js) `buildSeries` | Fetches **raw per-player, per-5s snapshots** from `/matches/:id/map-data`, aggregates team/role gold·xp·dmg diffs over time | **Yes** — raw data *and* logic (`'use client'`) |
| 2 | [`lib/msc2026Bracket.js:35`](../lib/msc2026Bracket.js) `buildSeries` / `computeDecider` | Rolls per-game rows into series; overlays bracket seeding | **Yes** — via client `MatchResultsGrid` ← `MatchesListView` |
| 3 | [`components/views/DashboardView.js:179`](../components/views/DashboardView.js) `groupStandings` + ranking sorts | W/L group standings, player-ranking sorts | No (server component) — but duplicates #2's rollup logic |
| 4 | [`lib/identity.js`](../lib/identity.js) `resolveTeam` / `teamFieldKeys` | Era-vs-franchise display rules | **Yes** — via client `PlayerStatsView` |

**Backend facts confirmed** (`mpl-ph-s17-backend/index.js`, Express + SQL views):
- Raw snapshots endpoint: `GET /api/intl/matches/:battleId/map-data` (`index.js:8493`) →
  `intl_match_realtime_snapshots`, sampled `game_time % 5 = 0`. Used by RoleDiffChart
  **and** MapReview (positions), so it stays.
- Series data source today: `GET /api/intl/matches/rich` (`index.js:8213`) — one row per
  game, carries `match_code`, era codes, `winner_key`, `played_at`.
- Endpoints are plain `app.get(...)`; SQL views live in `database/schema_intl_*.sql`.

---

## Non-goals (correctly staying in the frontend)

- [`lib/filters.js`](../lib/filters.js) — builds the **request** query string (whitelist).
  It must stay client/server-shared; it derives nothing about stats.
- [`lib/featured.js`](../lib/featured.js) — server-only already (`process.env`), never ships.
- [`lib/columns.js`](../lib/columns.js), `format.js`, `images.js` — pure presentation config.
- [`lib/jungleCamps.js`](../lib/jungleCamps.js) — static map coordinates (reference data,
  not computation).
- Seeding constants (Decision 3).

---

## Phase 1 — Role/gold-diff series → backend (highest impact)

Kills the biggest leak: raw per-frame data **and** the diff logic currently both ship.

**Backend (`mpl-ph-s17-backend`):**
- Add `GET /api/intl/matches/:battleId/role-diff`. Runs the
  [`RoleDiffChart.js:66`](../components/RoleDiffChart.js) `buildSeries` aggregation
  server-side over `intl_match_realtime_snapshots` (JS in the handler is fine; SQL view
  optional). Returns the **finished** series only:
  ```jsonc
  {
    "stats": ["gold","exp","total_damage", ...],   // available diff stats
    "series": [
      { "game_time": 60,
        "TEAM_blue_gold": 12345, "TEAM_red_gold": 12000, "TEAM_diff_gold": 345,
        "JUNGLE_blue_gold": ..., "JUNGLE_red_gold": ..., "JUNGLE_diff_gold": ...,
        /* per-role scopes ... */ }
    ]
  }
  ```
- Keep `/map-data` unchanged (MapReview still needs raw positions).

**Frontend (`mpl-intl`):**
- Add `matchRoleDiff: (battleId) => get('/api/intl/matches/${...}/role-diff')` to
  [`lib/api.js`](../lib/api.js).
- [`components/RoleDiffChart.js`](../components/RoleDiffChart.js): fetch the new endpoint
  via the proxy, render the returned `series` directly. **Delete** the client `buildSeries`
  (~50 lines) and the `STATS`/`SCOPES` aggregation loop.

**Result:** raw snapshots + diff math no longer reach the browser.

---

## Phase 2 — Series rollup (buildSeries / computeDecider) → backend

**Backend:**
- Add series-level output — either `GET /api/intl/matches/series` **or** a `?group=series`
  mode on `/matches/rich`. Implements [`msc2026Bracket.js:35`](../lib/msc2026Bracket.js)
  `buildSeries` in SQL/JS. One row per `match_code`:
  ```jsonc
  { "match_code": "...", "stage": "...", "stage_type": "...", "match_name": "...",
    "week_number": 1, "day_number": 2, "match_number": 3, "match_count": 3,
    "team_a": "FUT", "team_b": "FLCM", "team_a_key": "...", "team_b_key": "...",
    "team_a_flag": "...", "team_b_flag": "...",
    "a_wins": 2, "b_wins": 1, "games": 3,
    "winner_key": "...", "winner_code": "FUT", "played_at": "..." }
  ```
  (Exact field set = what `buildSeries` produces today, so consumers change only their
  data source, not their shape.)

Today [`MatchesListView`](../components/views/MatchesListView.js) (client) fetches raw
`/matches/rich` games and rolls them into series **twice** — its own `useMemo` (line 118)
for the list, then [`MatchResultsGrid`](../components/MatchResultsGrid.js) calls
`buildSeries` again — with interactive stage/week filters. The rollup is what moves; the
filtering stays.

**Frontend:**
- Add `matchSeries: (q) => get('/api/intl/matches/series${q}')` to `lib/api.js`.
- [`MatchesListView`](../components/views/MatchesListView.js): fetch the **series** endpoint
  instead of `/matches/rich`; delete the `useMemo` rollup. Keep the interactive
  **stage/week filtering** — that's list-filtering of pre-rolled series, not aggregation.
- [`MatchResultsGrid`](../components/MatchResultsGrid.js): consume the passed series
  directly; delete its `buildSeries(...)` call. Keep `computeDecider` + the seeding
  constants (Decision 6) — it now decorates server-computed series with the public bracket.
- [`DashboardView`](../components/views/DashboardView.js) (server): swap its data source to
  the series endpoint; `groupStandings`/`computeDecider` stay (server-side, never shipped).
- [`lib/msc2026Bracket.js`](../lib/msc2026Bracket.js): **delete `buildSeries`** (moved to
  backend). **Keep** `computeDecider`, `WILD_CARD_GROUPS`, `DECIDER`, `GAUNTLET_SERIES` —
  post-Phase-2 these are non-proprietary public-bracket slot-matching (Decision 6).

---

## Phase 3 — Identity resolver exposure (IN scope)

`resolveTeam` / `teamFieldKeys` ([`lib/identity.js`](../lib/identity.js)) encode the
era-vs-franchise rules and ship to the browser via client `PlayerStatsView`.

**Approach (locked, Decision 7) — resolve on the server, thread display-ready props:**
- Server parents (the page or a server view) compute `{ code, name, logo, fallbackLogo }`
  per row via `resolveTeam`, and pass those down. Client components render the resolved
  strings; they no longer import `lib/identity.js`.
- Audit every importer:
  [`PlayerStatsView`](../components/views/PlayerStatsView.js) (client — **must change**),
  [`StandingsView`](../components/views/StandingsView.js),
  [`TeamStatsView`](../components/views/TeamStatsView.js),
  [`DashboardView`](../components/views/DashboardView.js) (server — OK),
  [`app/players/[key]/page.js`](../app/players/[key]/page.js) (server — OK).
- **Constraint:** this must not violate
  [`plans/current-vs-history-rules.md`](current-vs-history-rules.md). The resolver stays
  the single source of truth for the era/franchise choice; we only move **where** it runs
  (server) not **what** it decides. `StatTable` column configs that use `teamFieldKeys`
  need the resolved keys/values threaded as props instead of computing in the client.
- **Rejected alternative:** backend emits resolved `team_display_{code,name,logo}` keyed
  off the request's `context`/`season`. Rejected because it pushes era-mode awareness into
  every endpoint and duplicates the resolver rules into backend SQL — the exact
  frontend/backend drift `current-vs-history-rules.md` exists to prevent. Identity is
  display-field selection, not stat math, so server-render alone keeps it off the browser.

---

## Phase 4 — Guardrail (prevent regression)

- Add `plans/architecture-rules.md` (or a section in `security-rules.md`): **no
  aggregation/derivation inside `'use client'` components** — client code only calls
  pre-computed `/api/intl/*` endpoints and renders. List the banned patterns
  (`.reduce` for sums/averages, division-for-averages, series rollups, bracket math).
- Optional automated check in [`.githooks`](../.githooks): grep changed `'use client'`
  files for `\.reduce(` / `buildSeries` / aggregation markers and warn.

---

## Cross-repo & deploy notes

- **Two repos on disk:** `mpl-intl` (this) and `../mpl-ph-s17-backend`. Backend edits
  follow `mpl-ph-s17/security-rules.md`; identity edits follow
  `mpl-ph-s17/identity-rules.md`.
- **This sandbox cannot push or deploy.** BOK deploys the backend (Render) and pushes both
  repos. **Sequencing:** ship + deploy the backend endpoint **first**, verify it live, then
  merge the frontend switch — otherwise the frontend calls a 404 (pages degrade to the
  existing "couldn't load data" notice, but avoid the gap).
- Backend responses keep the existing `revalidate: 300` cache path; new endpoints should
  set `Cache-Control` the proxy already forwards ([`route.js:49`](../app/api/[...slug]/route.js)).

## Verification per phase

1. **P1:** new endpoint returns the same numbers RoleDiffChart drew before (spot-check one
   `battleId`); confirm `/map-data` no longer requested by the chart in the network panel;
   confirm no `buildSeries` string in the built client bundle.
2. **P2:** Dashboard standings + Matches list/grid render identically off the series
   endpoint; `msc2026Bracket.js` no longer exports `buildSeries`; no `buildSeries` string
   in the client bundle. (`computeDecider` may remain — it's the allowed thin overlay.)
3. **P3:** era-vs-franchise still correct on Current vs History per
   `current-vs-history-rules.md` (FLCM on MSC 2026 Current, FLCN only in all-time);
   `lib/identity.js` absent from the client bundle.
4. **P4:** hook/rule documented; sample offending edit is flagged.

## Resolved decisions (2026-07-06)

Both prior open questions are now locked — see Decisions 6 and 7 above.
- **Phase 2 overlay:** move only `buildSeries` to the backend; keep `computeDecider` +
  seeding as a thin frontend overlay. No `wildcard-bracket` endpoint, no server-parent lift.
- **Phase 3:** server-render prop-threading; keep `lib/identity.js` as the single source of
  truth. Backend-resolved `team_display_*` rejected.
