# MANDATORY: Current-Tournament vs History Identity Rules

This is the enforceable contract for how Team code/name/logo and Player name/photo are
displayed across **Current** (live/featured edition) vs **History** (edition-switchable)
pages. It is not guidance — it is the spec every route, view, and endpoint must satisfy.

Implementation: the resolver in [`lib/identity.js`](../lib/identity.js). Backend fields:
`mpl-ph-s17-backend/database/schema_intl_views.sql` (`intl_player_stats` view).

Last updated: 2026-07-06.

---

## 0. Decisions (locked with BOK, 2026-07-06)

1. **A franchise code must NEVER appear on a Current or season-filtered page.** Those
   pages show the edition's **era** code/name/logo. Example: MSC 2026 Falcons show `FLCM` /
   *Team Falcons MENA*, never the PH franchise `FLCN` / *Team Falcons*.
2. **Franchise code/name is allowed only in All-Time / cross-edition aggregates.**
3. **Regional rosters of the same brand stay SEPARATE franchises.** Team Falcons MENA
   (`FLCM`) and a PH Falcons roster (`FLCN`) do not merge in aggregates. This is already the
   DB's behavior (distinct `team_key` per roster) — do not "helpfully" merge them.

---

## 1. The three-layer contract (all three must hold)

Era-correctness is derived by `intl_player_stats` as
`team_code_era = COALESCE(team_era_name.era_code, team_code)`. A franchise code leaks if any
layer fails:

| Layer | Requirement | If it fails |
|---|---|---|
| **A — Data** | Every participating `(season, team_key)` has a `team_era_name` row | `COALESCE` silently falls back to the franchise code |
| **B — Backend** | Every endpoint that surfaces a team on a current/season page SELECTs the era fields | the frontend has no era value to show |
| **C — Frontend** | Every current/season surface reads the era field **via `lib/identity.js`** | the reported filter/header bugs |

**A** is gated by `database/diagnose_intl_era_gaps.sql` — it must return **zero rows** before an
edition is featured. **B** is satisfied by all intl endpoints today (incl. `intlCareerTotals`).
**C** is enforced by the resolver below.

---

## 2. The mandatory resolver (`lib/identity.js`)

Never read `latest_team_code` / `team_code` (or the `_era` variants) directly in a component.
Route every team render through:

- `identityMode(context, eff)` → `'current' | 'season' | 'alltime'`
  (`context === 'current'` → current; else a chosen `season` → season; else alltime).
- `resolveTeam(row, mode)` → `{ code, name, logo, fallbackLogo }`. Auto-detects player rows
  (`latest_team_*`) vs team rows (`team_*`). Era for current/season, franchise for alltime.
- `teamFieldKeys(mode, shape)` → `{ codeKey, nameKey, logoKey }` for `StatTable` column configs.

---

## 3. Team display — field contract by Surface × Context

`mode` = `identityMode(context, eff)`. "Era" = era fields; "Franchise" = franchise fields.

| Surface | Current | Season-filtered | All-Time / aggregate | Wiring |
|---|---|---|---|---|
| Player Stats table (Team col) | Era | Era | Franchise | `CURRENT_PLAYER_COLUMNS` (era) / `PLAYER_COLUMNS` sub (franchise) |
| **Player Stats Team filter** | Era | — | — | `resolveTeam(row,'current').code` |
| Teams table | Era | Era | Franchise | `teamFieldKeys(mode,'team')` |
| Standings table | Era | Era | Franchise | `teamFieldKeys(mode,'team')` |
| Dashboard (rank lists, groups, standings) | Era | Era | Franchise | `resolveTeam(row, mode)` |
| Player detail header | Era | Era | Franchise | `resolveTeam(totals, mode)` |
| Team detail header | — | — | Franchise (latest lineage) | `team_code` / `team_name` |
| Team detail per-season rows | — | Era | — | `team_code_era` / `team_name_era` |

Era field names: teams → `team_code_era`, `team_name_era`; player rows → `latest_team_code_era`,
`latest_team_name_era`. Logo → `team_logo_dark` (already era-correct), CDN fallback `img.team(eraCode)`.

**Known data exception (not a code path):** the schedule feed row `MSC2026GA_M2` is seeded
`FLCN 🇵🇭` instead of `FLCM 🇸🇦`; fix in the backend schedule seed (see task chip).

---

## 4. Player name & photo

| Context | Name | Photo (fallback: **Initials avatar**, never a team logo) |
|---|---|---|
| Current | Era IGN (backend `player`, already corrected) | Current-edition era photo (`photo_url`) |
| Season-filtered history | `Era IGN (Global Name)` — e.g. `FULLCLIP (Kairi)` | Era photo for that season |
| All-Time history | Latest global display name — e.g. `Kairi` | Latest global photo |

Player detail header (`/players/[key]`): Current context → current-edition photo; History → latest
global photo. (Player name/photo is currently followed by convention in the columns + page wiring;
a `resolvePlayer()` companion to `resolveTeam()` is the natural future extension if drift appears.)

---

## 5. Route separation & locking

- **Current pages** (outside `/history`): locked to the live/featured edition via `resolveCurrent`
  — `season`/`scope` URL params are ignored; only `stage` and `min_games` are honored.
- **History pages** (`/history/...`): fully filterable via `resolveSelection` (FilterBar `scope`,
  `season`, `stage`, `min_games`); no filters → All-Time aggregate.

---

## 6. Checklists

**Every PR that touches team/player identity:**
- [ ] No component reads `latest_team_code`/`team_code`/`*_era` directly — it goes through
      `resolveTeam` / `teamFieldKeys` / `identityMode`.
- [ ] Current/season surfaces show the era code (verify with the Falcons case: `FLCM`, never `FLCN`).
- [ ] Any NEW team-surfacing endpoint SELECTs the `*_era` fields (Layer B).

**Before featuring a new edition:**
- [ ] `database/diagnose_intl_era_gaps.sql` returns **zero rows** (Layer A — every team seeded in
      `team_era_name`).
- [ ] Schedule/bracket seed uses era codes, not franchise codes.
