# Plan: Integrate Upcoming Tournaments (MPL PH S17 model)

## Goal

Restructure the intl site so it works like the MPL PH S17 site:

- The **most recent / currently-featured tournament** is the bulk of the site — its
  standings, players, teams, heroes, etc. are what you see by default.
- **History** is a single tab (with its own sub-nav) holding the cross-edition,
  all-time aggregate views.
- When a **new tournament is announced**, it can become the featured event the moment
  it's announced (before any games are played).

## The model (how PH S17 does it)

- Main tabs (Dashboard, Standings, Matches, Stats…) all show **only the current season**.
  The season isn't a frontend setting — the backend's main endpoints are scoped to S17.
- `History` is one nav item with a sub-nav (`HistorySubNav.js`): History Home, Hall of
  Fame, Season Explorer, Player Legacy, Hero Meta, Team Dynasty. These hit separate
  `/api/historical/*` endpoints — the all-time aggregate lives only here.
- Split: **main site = current event, scoped; History = everything-ever, aggregated.**

## Current intl state (the gap)

The intl site is built backwards from this:

- Default (no filters) is the **all-time aggregate** — the landing page is an all-editions
  career leaderboard (`app/page.js`).
- The "current event" is just one option inside the global filter bar (`components/FilterBar.js`).
- There is no `/history` tab and no concept of a "featured/recent" edition.

Every `/api/intl/*` endpoint already accepts `scope` + `season` + `stage` (`lib/api.js`),
so the data layer can already do either view. What's missing is the **featured-edition
concept** and the **page restructure** around it.

## Findings from the backend (both prior unknowns closed)

`/api/intl/editions` (backend `index.js:6020`) already returns per edition:
`tournament_code`, `tournament_name`, `tournament_type`, `season_id`, `season_number`,
`season` (label), **`status`**, and a **`stages`** array.

1. **Featured selection needs no backend change.** `season_number` gives auto-latest;
   `status` distinguishes upcoming / ongoing / completed (so we can detect the
   "announced, no games yet" state directly); `stages` can drive the Stage filter per edition.
   The only missing field is a per-edition **champion** — defer it (derive from the
   grand-final via `/api/intl/matches`, or add a column later).
2. **History reuses `/api/intl/*`, not `/api/historical/*`.** The `/api/historical/*`
   routes are the PH **domestic league's** system, separate from intl. Intl endpoints
   already aggregate across all editions when `season` is unset. Build History from those.

**Result: Phases 1–3 are frontend-only. No backend changes required.**

## Recommended approach: featured edition = config, falling back to auto-latest

Because an upcoming event should headline the moment it's announced, pure auto-detect
isn't enough (the backend may not list a zero-game event yet). So:

- `lib/featured.js` exports the featured `{ tournament_code, season }`.
- If unset, derive the newest edition from `/api/intl/editions` (max `season_number`,
  preferring a `status` of ongoing/upcoming when present).
- When a new tournament is announced, set one value (or env var) to pin it. When it ends
  and the next is announced, flip it again — or let auto-latest carry it.

This gives PH-style "the now is the whole site" plus the manual control the
"as soon as announced" requirement needs.

## Phased build

| Phase | Work | Backend? |
|---|---|---|
| **1 — Featured concept** ✅ DONE | `lib/featured.js` (env pin `FEATURED_EDITION` + auto-pick: `live` edition, else latest by `season_id`). `effectiveFilters` in `lib/filters.js` resolves the featured default + `season=all` aggregate sentinel. The 6 list pages default to the featured edition; the filter bar leads with it and exposes "All editions". Detail pages keep their full-career default. | No |
| **2 — Reorient main pages** ✅ DONE | All 6 list pages use `resolveSelection(sp)` (one call → `{ q, label, eff, editions, featured }`) and a shared `PageHead` with an eyebrow naming the current selection ("MSC 2025" / "All Editions"). `selectionLabel`/`editionTitle`/`familyLabel` centralized in `lib/filters.js`. Copy softened to read correctly under a single edition. | No |
| **3 — History tab** | Add `/history` layout + sub-nav. Relocate the current all-time aggregate pages under it (all-time Players / Teams / Heroes / Nations + a History Home with an editions/champions timeline). Add "History" to `components/Nav.js`. Build from `/api/intl/*` with `season` unset. | No |
| **4 — Upcoming / empty states** | Empty-state components for a featured edition with `status = upcoming` / no games ("Bracket and rosters announced — stats appear once games are played"). Optional schedule/groups/rosters view to show first. | No |
| **5 — Per-cycle playbook** | Document the one-value flip + a checklist for "new tournament announced." | No |

## Deferred / optional

- **Champion-per-edition field** on `/api/intl/editions` for a clean History Home champions
  timeline (otherwise derive from grand-final results). Backend change, low priority.

## Open decisions (not blocking)

- Exact `status` values the backend emits (e.g. `upcoming` / `active` / `completed`) —
  confirm before wiring the empty-state logic in Phase 4.
- Whether History Home should also surface an all-time stat overview block (PH does, via
  `/api/historical/overview`); intl has no equivalent endpoint, so this would be derived
  client-side or deferred.
