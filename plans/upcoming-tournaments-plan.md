# Integrate Upcoming Tournaments — Plan & Status

> **Status:** Phases 1–3 implemented and building cleanly. **Phases 4–5 halted on
> purpose** pending a review of the database structure (how it handles International
> vs MPL PH data). This file is the single source of truth for the effort.

Last updated: 2026-06-27.

---

## Goal

Restructure the intl site so it works like the MPL PH S17 site:

- The **most recent / currently-featured tournament** is the bulk of the site — its
  players, teams, heroes, etc. are what you see by default.
- **History** is a single tab (with its own sub-nav) holding the cross-edition,
  all-time aggregate views.
- When a **new tournament is announced**, it can become the featured event the moment
  it's announced (before any games are played).

## The model (how PH S17 does it)

- Main tabs all show **only the current season**. The season isn't a frontend setting —
  the backend's main endpoints are scoped to the current season.
- `History` is one nav item with a sub-nav; the all-time aggregate lives only there.
- Split: **main site = current event, scoped; History = everything-ever, aggregated.**

## How the intl site was built (the gap we closed)

It was built backwards: the default view was the **all-time aggregate**, and the
"current event" was just one option in a global filter bar. There was no `/history`
tab and no concept of a "featured/recent" edition. Phases 1–3 flipped this.

---

## Backend facts this work relies on

- **Two parallel systems in the same backend (`mpl-ph-s17-backend/index.js`):**
  - MPL PH domestic league → `/api/...` and `/api/historical/*` (tournament_id 1).
  - International → `/api/intl/*` (tournaments where `tournament_id IN (2, 3)` = **MSC**
    and **M-Series / MWC**).
- **`/api/intl/editions`** (`index.js:6020`) returns per edition: `tournament_code`,
  `tournament_name`, `tournament_type`, `season_id`, `season_number`, `season` (label),
  **`status`**, and a **`stages`** array. It does **not** currently return
  `start_date` / `end_date` (they exist on the `seasons` table) or any champion field.
- **`seasons` table** (`database/schema_international.sql:53`): `status VARCHAR(20)
  CHECK (status IN ('live','closed'))`, plus `start_date`, `end_date`, `season_number`,
  `label`, `tournament_id`. All existing intl editions are seeded `'closed'`.
- **Every `/api/intl/*` stat endpoint** accepts `scope` + `season` + `stage` and, when
  `season` is unset, **aggregates across all editions** — that is what History uses.
- **Identity:** intl rollups are grouped by stable `player_key` / `team_key`
  (rename/account proof), via the `intl_*` views.

**Result: Phases 1–3 were frontend-only. No backend changes were required.**

---

## Phase status

| Phase | Status | Summary |
|---|---|---|
| 1 — Featured concept | ✅ Done | Featured-edition concept + the filter-bar/data default. |
| 2 — Reorient main pages | ✅ Done | Main list pages lead with the featured edition and name it. |
| 3 — History tab | ✅ Done | `/history` section: editions index + all-time leaderboards. |
| 4 — Upcoming / empty states | ⛔ Halted | Pending DB review (see below). |
| 5 — Per-cycle playbook | ⛔ Halted | Pending DB review (see below). |

---

## Phase 1 — Featured concept ✅ Done

The site now has a "featured edition" and the main list pages lead with it instead of
the all-time aggregate.

- **`lib/featured.js`** (new):
  - `featuredPin()` reads server-only env var `FEATURED_EDITION` (`"CODE:season"`,
    e.g. `MSC:2025` or `MWC:M6`) — pins a just-announced edition before it has games.
  - `pickFeatured(editions, pin)`: pin → else the `live` edition → else latest by
    `season_id`. Uses the real `status` values (`live` / `closed`).
  - `getFeatured()`: resilient server helper (returns `null` → falls back to aggregate).
- **`lib/filters.js`**: new `effectiveFilters(sp, featured)` resolves three cases — clean
  URL → featured edition (pins scope + season); `season=all` → cross-edition aggregate;
  `season=<label>` → that edition. `intlQuery` now takes an optional `featured` arg
  (old call sites still behave as before when it's null).
- **`app/layout.js`** computes featured (`pickFeatured` + `featuredPin`) and passes it to
  `Nav`; **`components/Nav.js`** forwards it to `FilterBar`.
- **`components/FilterBar.js`**: leads with the featured edition, builds the Event
  segment from families that exist, adds an explicit **"All editions"** option
  (`season=all`), and only shows chips for deviations from the featured default.
- **Scoped to featured:** the 6 list pages. **Left on full-career default:**
  `players/[key]`, `teams/[key]` (so career pages don't collapse to one edition).
  Defaults are injected server-side, so URLs stay clean and click-through to a player
  still shows their whole career.

## Phase 2 — Reorient main pages ✅ Done

Every main page names the tournament you're viewing.

- **`lib/featured.js`**: `resolveSelection(sp)` → `{ q, label, eff, editions, featured }`
  in one call. The 6 list pages use it.
- **`lib/filters.js`**: `familyLabel`, `editionTitle` ("MSC 2025" / "M-Series M6"),
  `selectionLabel(eff, editions)` ("All Editions" / edition name). FilterBar reuses these.
- **`components/PageHead.js`** (new) + `.page-eyebrow` in `app/globals.css`: an accent
  eyebrow above each title showing the current selection.
- **Updated all 6 list pages** (`app/page.js`, `teams`, `heroes`, `nations`, `regions`,
  `results`) to the `PageHead`/eyebrow pattern; softened copy that wrongly asserted
  "spans every edition" so it reads correctly under a single edition.

## Phase 3 — History tab ✅ Done

The all-time aggregate now lives in a dedicated History section.

- **`app/history/layout.js`** + **`app/history/HistorySubNav.js`** (new): masthead +
  sub-nav (Overview / Players / Teams / Heroes / Nations).
- **`app/history/page.js`** (Overview): an **editions index** grouped by family, newest
  first, each edition a card with a **Live / Completed** badge and a **Featured** marker,
  linking into the main site scoped to that edition (`/?scope=…&season=…`).
- **`app/history/{players,teams,heroes,nations}/page.js`** (new): all-time leaderboards
  (`api.*('')`, no season filter), reusing shared columns.
- **`lib/columns.js`** (new): extracted `PLAYER_/TEAM_/HERO_/NATION_COLUMNS`; the 4 main
  pages and 4 History pages now share one definition (no drift).
- **`components/Nav.js`**: added "History"; the per-edition filter bar is **hidden on
  `/history/*`** (those pages are always all-editions).
- History CSS (sub-nav, edition cards, badges) added to `app/globals.css`.

**Build:** `npm run build` compiles all 14 routes. Not yet verified against live backend
data — point at a running backend / `.env.local` to confirm the featured edition resolves
as expected.

---

## ⛔ Halted: why, and what to resolve first

Phases 4–5 are paused so the **database structure can be reviewed** — specifically how it
will handle International **and** MPL PH data together, and how a brand-new/upcoming
tournament shows up. These answers directly shape Phase 4's empty-states and the Phase 5
playbook.

### Database questions to resolve

1. **Coexistence:** PH (tournament_id 1) and intl (2, 3) live in the **same**
   `tournaments` / `seasons` / `stages` tables, separated by `tournament_id`. Confirm
   that's the intended long-term shape (one schema, many tournaments) vs. separate
   schemas — and that the intl `intl_*` views won't accidentally pull PH rows.
2. **New/upcoming tournament creation:** When a new event is announced, what creates the
   `seasons` row, and with what `status`? Today `status` is only **`live` / `closed`** —
   there is **no distinct `upcoming`/`announced` state**, so an announced-but-unplayed
   event would be `live` with zero games. Decide whether to add an `upcoming` status (or
   rely on "live + zero games"). **Phase 4's empty-state logic depends on this.**
3. **Pre-game content:** Before any games, does the DB hold the bracket / groups /
   rosters / schedule for an upcoming event, and via which tables/endpoints? Phase 4's
   "announced" view needs a data source, or it's just a placeholder.
4. **Expose dates:** `seasons.start_date` / `end_date` exist but aren't returned by
   `/api/intl/editions`. Exposing them makes auto-pick and "upcoming vs ongoing"
   detection robust (instead of leaning on `season_id` order).
5. **Champion / placement:** Is there an accolades/results source for intl (champion,
   runner-up, finals MVP per edition)? PH has `/api/historical/accolades`; intl does not.
   Needed to enrich the History Overview cards beyond a status badge.
6. **Shared identity:** Is `player_key` / `team_key` unified across PH and intl, so a
   player's domestic and international careers could ever be linked? Relevant only if you
   later want cross-competition profiles.

### Phase 4 — Upcoming / empty states (not started)

- Empty-state component for a featured edition with no games yet ("Bracket and rosters
  announced — stats appear once games are played"), shown on the 6 list pages.
- Optional schedule / groups / rosters view to display before stats exist.
- **Blocked on DB Q2 + Q3** (how "upcoming" is represented and where pre-game data lives).

### Phase 5 — Per-cycle playbook (not started)

- Document the one-value flip (`FEATURED_EDITION`) and a checklist for "new tournament
  announced → featured" each cycle.
- **Blocked on DB Q2** (the exact lifecycle a new edition goes through in the DB).

---

## How to resume

1. Answer the DB questions above (this is the current blocker).
2. If adding an `upcoming` status / exposing `start_date`/`end_date` / a champion field:
   make those small backend changes, then revisit `pickFeatured` and the Overview cards.
3. Build Phase 4 empty-states against the confirmed "upcoming" representation.
4. Write the Phase 5 playbook.

## Files touched so far

**New:** `lib/featured.js`, `lib/columns.js`, `components/PageHead.js`,
`app/history/layout.js`, `app/history/HistorySubNav.js`, `app/history/page.js`,
`app/history/{players,teams,heroes,nations}/page.js`.

**Modified:** `lib/filters.js`, `components/FilterBar.js`, `components/Nav.js`,
`app/layout.js`, `app/globals.css`, and the 6 list pages (`app/page.js`,
`app/{teams,heroes,nations,regions,results}/page.js`).

**Untouched:** detail pages `app/players/[key]/page.js`, `app/teams/[key]/page.js`
(kept on full-career default).
