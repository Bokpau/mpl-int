# Architecture Rules — International Site (`mpl-intl`)

MANDATORY. Follow these for every edit to `mpl-intl`. When in doubt, re-read this
file before adding a component, a page, or a data fetch — especially anything that
turns raw match data into a stat, series, or chart.

This site is **frontend-only**: a render layer over the shared backend's
`/api/intl/*` API. **Computation and raw data belong on the backend**
(`mpl-ph-s17-backend`), not in the browser. This file is the enforceable contract
for that boundary. Origin:
[`plans/backend-computation-offload-plan.md`](plans/backend-computation-offload-plan.md)
(BOK, 2026-07-06).

## The mental model

```
raw rows / per-frame snapshots  →  backend aggregates them (SQL / JS in the handler)
  →  /api/intl/* returns the FINISHED numbers
    →  mpl-intl fetches and RENDERS them (labels, formats, filters, draws)
```

The browser receives results, not raw data to crunch. Reference implementation:
`GET /api/intl/matches/:battleId/role-diff` rolls up `intl_match_realtime_snapshots`
server-side; the client [`RoleDiffChart`](components/RoleDiffChart.js) only renders
`{ series }`.

## Rule 1 — Raw per-frame / per-event data is aggregated on the backend

If a component needs a derived **series** (time-series diffs, per-minute curves,
roll-ups of per-snapshot or per-event rows), the backend computes it and returns the
finished result. Raw `*_realtime_snapshots` / per-event rows must **not** be shipped
to the browser just to be summed, differenced, or rolled up there.

## Rule 2 — Statistical formulas live in the backend

Averages, per-minute rates, win%, KDA, control %, kill participation, totals, etc.
are computed by `/api/intl/*` endpoints and SQL views. The frontend **labels and
formats** them ([`lib/columns.js`](lib/columns.js), [`lib/format.js`](lib/format.js))
— it does not compute them. Adding a new stat means adding it to the backend
endpoint, not deriving it in a component.

## Rule 3 — `'use client'` components do not aggregate raw data

A `'use client'` component fetches a pre-computed endpoint and renders it. It must not
turn raw rows into stats or roll per-frame snapshots into series. If you find yourself
writing `.reduce()` to sum raw metrics, or grouping snapshots into a time-series inside
a client component, stop — that logic goes in a backend endpoint.

## What IS allowed on the client (not a violation)

The site is genuinely interactive. These are presentation, not computation-to-hide:

- **Filtering / slicing already-computed rows** by the user's active selection —
  stage, week, role, team (e.g. [`MatchesListView`](components/views/MatchesListView.js),
  [`PlayerStatsView`](components/views/PlayerStatsView.js)).
- **Grouping pre-computed rows for layout** (e.g. games → per-`match_code` cards) and
  **trivial win-counting** for a bracket box.
- **Sorting** rows for display.

The test: *does the client turn raw data into a stat/series, or does it arrange rows the
backend already computed?* The former violates Rule 3; the latter is normal frontend work.

## Known accepted exceptions (as of 2026-07-06)

Documented so they are not treated as precedent for new code:

- `lib/msc2026Bracket.js` `buildSeries` (win-count rollup) runs client-side in
  `MatchResultsGrid`. Accepted — trivial counting over per-game rows the List view needs
  anyway; not proprietary. (Plan Phase 2 descoped.)
- `lib/identity.js` `resolveTeam` runs client-side in `PlayerStatsView` for the team
  filter. Accepted — publicly-documented era-vs-franchise field selection; the clean
  removal path was rejected (plan Decision 7). (Plan Phase 3 skipped.)

New code does **not** get to add to this list without an explicit decision recorded in the
plan doc.

## When you add or change a feature

1. Does it derive a number/series from raw or per-frame data? → backend endpoint.
2. Is it just filtering/sorting/laying out rows the API already computed? → frontend is fine.
3. Deploying a new/changed backend endpoint? Ship and verify the **backend first**, then
   the frontend switch (otherwise the frontend calls a route that 404s until deploy).

## Enforcement

Reviewed by eye at PR time against Rule 3. An automated grep (e.g. `.reduce(` in
`'use client'` files) was considered and **not** added — it false-positives on the allowed
filtering/counting above. If a mechanical check is ever added, it must target *raw-data
aggregation* specifically, not any array method.
