# MANDATORY: Frontend / Backend Computation Boundary

This is the enforceable contract for **where computation lives** in `mpl-intl`. It is not
guidance — it is the line every new view, endpoint, and refactor must respect.

Origin: [`backend-computation-offload-plan.md`](backend-computation-offload-plan.md)
(BOK, 2026-07-06). Driver: keep proprietary logic and raw data off the browser, and keep
the frontend a render layer.

Last updated: 2026-07-06.

---

## The rule

1. **Raw per-frame / per-event data never ships to the browser to be aggregated there.**
   If a component needs a derived series, the **backend** aggregates it and returns the
   finished result. Reference implementation: `GET /api/intl/matches/:battleId/role-diff`
   rolls up `intl_match_realtime_snapshots` server-side; the client
   [`RoleDiffChart`](../components/RoleDiffChart.js) only renders `{ series }`.

2. **Statistical formulas (averages, per-minute, rates, KDA, control %, etc.) live in the
   backend** `/api/intl/*` endpoints / SQL views. The frontend labels and formats them
   ([`lib/columns.js`](../lib/columns.js), [`lib/format.js`](../lib/format.js)) — it does
   not compute them.

3. **`'use client'` components must not aggregate raw data.** No summing/averaging raw
   rows into stats, no rolling per-frame snapshots into series. Fetch a pre-computed
   endpoint and render it.

## What is explicitly allowed on the client (not a violation)

The site has genuinely interactive views. These are fine and are **not** "computation to
hide":

- **Filtering / slicing already-computed rows** by the user's active selection
  (stage, week, role, team) — e.g. [`MatchesListView`](../components/views/MatchesListView.js)
  filtering games by stage/week, [`PlayerStatsView`](../components/views/PlayerStatsView.js)
  filtering the leaderboard by team/role.
- **Grouping pre-computed rows for layout** (e.g. games → per-`match_code` cards) and
  **trivial win-counting** for a bracket box. These are presentation, not proprietary math.
- **Sorting** rows for display.

The test: *does the client turn raw data into a stat/series, or does it arrange rows the
backend already computed?* The former is a violation; the latter is normal frontend work.

## Known accepted exceptions (as of 2026-07-06)

- `lib/msc2026Bracket.js` `buildSeries` (win-count rollup) runs client-side in
  `MatchResultsGrid`. **Accepted** — trivial counting over per-game rows the List view
  needs anyway; not proprietary. (Phase 2 descoped.)
- `lib/identity.js` `resolveTeam` runs client-side in `PlayerStatsView` for the team
  filter. **Accepted** — publicly-documented era-vs-franchise field selection, and the
  clean removal path was rejected (see plan Decision 7). (Phase 3 skipped.)

## Enforcement

Reviewed by eye at PR time against rule 3 above. An automated grep (e.g. `.reduce(` in
`'use client'` files) was considered and **not** added — it false-positives on the allowed
filtering/counting above, so it would be noise. If a mechanical check is ever added, it
must target *raw-data aggregation* specifically, not any array method.
