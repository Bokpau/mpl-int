# Current-vs-History Identity Enforcement — Audit + Plan

> **Goal:** Make era-correct Team Code / Team Name / Team Logo / Player Name / Player
> Photo display **mandatory and drift-proof** across Current vs History — and guarantee
> **future tournaments cannot reintroduce** the bug where a franchise code (PH `FLCN`)
> leaks onto a Current surface that should show the era code (`FLCM`).

Last updated: 2026-07-06 (rev 2 — backend now in scope).

## Decisions (locked with BOK, 2026-07-06)
1. **FLCN rule:** A franchise code must **never** appear on a Current or season-filtered
   page. Those pages always use era code/name/logo. Franchise code is allowed only in
   All-Time / cross-edition aggregates.
2. **Scope:** Frontend **and** backend. Fix it permanently; do not leave a frontend
   workaround if the backend is the right place.
3. **Lineage rollup:** Regional rosters of the same brand (Falcons MENA `FLCM` vs a PH
   Falcons roster `FLCN`) stay **separate** franchises. Do **not** merge.

---

## How era-correctness actually works (root of the whole thing)

The `intl_stats` view derives era fields by joining every game row to
`team_era_name (tournament_id, season, team_key)`:

```
team_code_era = COALESCE(team_era_name.era_code, team_code)     -- schema_intl_views.sql:62
team_name_era = COALESCE(team_era_name.era_name, …, current_team)            -- :63
team_logo_dark = team_era_name.logo_dark                                     -- :84
```

Three independent things must all hold, or a franchise code leaks:

| Layer | Requirement | Failure mode |
|---|---|---|
| **A. Data** | Every `(season, team_key)` in an edition has a `team_era_name` row | `COALESCE` falls back to franchise `team_code` → **silent** `FLCN` leak |
| **B. Backend** | Every endpoint that surfaces a team on a current/season page SELECTs the era fields | endpoint returns only franchise field → frontend has nothing era to show |
| **C. Frontend** | Every current/season surface READS the era field (not `latest_team_code`) | the reported filter bug |

The reported bug was **C**. But "future tournaments won't repeat it" requires **A + B + C**
locked together — that's the core of rev 2.

---

## Audit results

### Layer A — data (MSC 2026): COMPLETE
All 9 MSC 2026 teams resolve era fields (verified live: Falcons → `FLCM` / `Team Falcons
MENA`, logo `FLCM_MSC2026_allmode.png`). No data fix needed **now**; the risk is future
editions shipping without `team_era_name` rows.

### Layer B — backend endpoints: ONE gap
Systematic scan of every `/api/intl/*` handler for era-field SELECTs:

| Endpoint | Era fields? |
|---|---|
| leaderboard, players/:key, players/:key/seasons, players/:key/vs-teams, teams, teams/:key, heroes/:id/vs-teams, records, matches, matches/rich, schedule | ✅ present |
| **`intlCareerTotals`** (feeds `/players/:key/career` → the player detail header) | ❌ **franchise only** (`index.js:7078-7116` selects `latest_team_code`/`latest_team` but no `team_code_era`/`team_name_era`/`team_logo_dark`) |

### Layer C — frontend surfaces: TWO gaps
| Surface | File | Reads | Should read (Current) | Status |
|---|---|---|---|---|
| **Player Stats Team filter** (the reported bug) | `components/views/PlayerStatsView.js` L101,111,123,252 | `latest_team_code` (`FLCN`) | `latest_team_code_era` (`FLCM`) | 🔴 |
| **Player detail header** | `app/players/[key]/page.js` L74 | `img.team(latest_team_code)` | era code/name/logo | 🔴 (needs Layer B fix first) |
| Player table Team column | `lib/columns.js` `CURRENT_PLAYER_COLUMNS` L97 | `latest_team_code_era` | — | ✅ |
| Teams / Standings tables | `TeamStatsView` L18-25 / `StandingsView` L37 | era when season/current | — | ✅ |
| Dashboard | `DashboardView` L104-115 | re-derives era from match rows (`eCode`) | era fields already on rows | 🟡 redundant 3rd mechanism |

**Root cause (frontend):** three competing ways to pick a code exist — trust `*_era`
(tables), re-derive from matches (Dashboard), or use raw franchise (`filter`, `detail`) —
and nothing enforces one path.

---

## Plan

### Phase 0 — Backend: close the one gap + guarantee future data
1. **`intlCareerTotals`** (`index.js:~7083`): add three lines, mirroring the leaderboard
   handler exactly:
   ```
   (array_agg(p.team_code_era  ORDER BY p.played_at DESC NULLS LAST))[1] AS latest_team_code_era,
   (array_agg(p.team_name_era  ORDER BY p.played_at DESC NULLS LAST))[1] AS latest_team_name_era,
   (array_agg(p.team_logo_dark ORDER BY p.played_at DESC NULLS LAST))[1] AS team_logo_dark,
   ```
   No SQL migration — the view already exposes these columns. Pure JS query edit.
2. **Data-completeness gate (the future-proofing):** add a diagnostic query + document it
   in the intl runbook — for any edition, list participating `(season, team_key)` with **no**
   `team_era_name` row. Must return zero rows before an edition goes live. Example:
   ```sql
   SELECT DISTINCT s.season, s.team_key
   FROM intl_stats s
   LEFT JOIN team_era_name t
     ON t.tournament_id=s.tournament_id AND t.season=s.season AND t.team_key=s.team_key
   WHERE t.team_key IS NULL;
   ```
   This is what stops a future edition from silently falling back to franchise codes.
3. **Deploy:** backend runs on Render (deploys on push) — **BOK pushes/deploys**; this
   sandbox can't. Sequence: merge backend → deploy → then ship the frontend that depends on it.

### Phase 1 — One mandatory resolver (`lib/identity.js`) — the enforcement mechanism
```
context: 'current' | 'season' | 'alltime'
resolveTeam(row, context) -> { code, name, logo, fallbackLogo }
  current | season -> era fields (team_code_era / latest_team_code_era, *_name_era, team_logo_dark);
                      fallbackLogo = img.team(eraCode)     // era code, never franchise
  alltime          -> franchise (team_code / latest_team_code, team_name / latest_team)
TEAM_FIELDS(context) -> { codeKey, nameKey, logoKey }      // for StatTable column configs
```
JSDoc header states the rule: **no view may read `latest_team_code`/`team_code` directly;
all team identity goes through this module.**

### Phase 2 — Fix the two frontend gaps
1. **Player Stats filter** (`PlayerStatsView.js`): build `availableTeams`, `teamLogoMap`,
   `filteredRows`, and the chip from `resolveTeam(row,'current')`. Fixes the reported bug.
2. **Player detail header** (`app/players/[key]/page.js`): once Phase 0.1 ships, read
   `totals.latest_team_code_era` + `totals.team_logo_dark` in current context (no leaderboard
   workaround); keep franchise (`latest_team` + `img.team(latest_team_code)`) in history context.

### Phase 3 — Route existing tables through the resolver (no visual change)
`TeamStatsView` / `StandingsView` swap their inline `isSeasonFiltered ? era : franchise` for
`TEAM_FIELDS(context)`. `DashboardView` drops the `displayToEra`/`eCode` re-derivation in favor
of the era fields already on the rows (collapses the 3rd mechanism). Verify bracket/series
lookups that key by era code still resolve.

### Phase 4 — Rewrite `current-vs-history-rules.md` as an enforceable spec
- The decisions above (FLCN-never-on-Current; regional rosters separate).
- The **A/B/C three-layer contract** and the `(Surface × Context) → exact field` table, with
  intl examples (`FLCM` / `Team Falcons MENA`).
- Mandatory rules: (C) every identity render goes through `lib/identity.js`; (B) every new
  team-surfacing endpoint SELECTs era fields; (A) the `team_era_name` completeness query must
  pass before an edition is featured.
- A PR/edition checklist.

### Phase 5 — Verify
Preview: Player Stats (Current) filter shows `FLCM` + Falcons MENA logo (not `FLCN`); detail
header (current) shows `FLCM`; Teams/Standings/Dashboard unchanged; History shows franchise in
All-Time and era when season-filtered. Console/network clean; snapshot each route. Re-run the
Phase 0.2 completeness query = 0 rows.

---

## Sequencing & risk
- **Order:** Phase 0 (backend, BOK deploys) → Phases 1-4 (frontend) → Phase 5. Frontend detail
  header depends on the deployed backend; everything else is independent.
- **Low risk:** backend change is additive (new columns on a response); no consumer breaks.
- **Regional-roster separation** (decision 3) is already the DB's behavior (distinct `team_key`
  per roster) — document it so no one "helpfully" merges Falcons MENA into PH Falcons.

---

## Status log
- **2026-07-06** — All phases complete. Phase 0 (backend career era fields + era-gap diagnostic,
  deployed), Phase 1 (`lib/identity.js` resolver + Player Stats filter fix), Phase 2.2 (player
  detail header), Phase 3 (Teams/Standings/Dashboard routed through the resolver), Phase 4
  (`current-vs-history-rules.md` rewritten as the enforceable spec). Each frontend change verified
  against the deployed backend (MENA Falcons show `FLCM` / *Team Falcons MENA* on current pages).
  Note: `FLCN` 🇵🇭 (PH Falcons) and `FLCM` 🇸🇦 (MENA Falcons) are two distinct MSC 2026 teams — the
  earlier "schedule-seed bug" was a misread; that row is correct. Open question raised with BOK:
  the MENA team's *franchise* code is `FLCN` (same as the PH team) — see below.
</content>
