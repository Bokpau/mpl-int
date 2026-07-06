# Plan: Recreate Player Page (Current vs. History Split)

This plan outlines the architecture and implementation steps to recreate the player
detail page from MPL PH in MPL International, splitting the detail pages into distinct
Current Tournament and History views.

> [!IMPORTANT]
> **Rules compliance is not optional here.** This work touches data fetches, new API
> routes, and player/team identity, so it is governed by all three mandatory rule
> files: [`security-rules.md`](file:///Users/bok/Documents/GitHub/mpl-intl/security-rules.md),
> [`architecture-rules.md`](file:///Users/bok/Documents/GitHub/mpl-intl/architecture-rules.md),
> and `mpl-ph-s17/identity-rules.md` (mirrored via `lib/identity.js`). The decisions
> below are constrained by those files — where a rule forces a choice, it is recorded
> as **settled**, not offered as an open option.

---

## Architecture decision (SETTLED by mandatory rules)

**All 12 advanced-stats endpoints are implemented on the shared Express backend
(`mpl-ph-s17-backend`) and reached through the existing `intl/*` proxy. `mpl-intl`
gets no database client, no Supabase client, and no service-role key.**

The originally-drafted "Option A" (install `@supabase/supabase-js` in the frontend,
put Supabase URL + service-role/anon keys in `mpl-intl`'s `.env.local`, and add
`app/api/players/[roleid]` routes that query `intl_` tables directly) is **rejected**
because it violates two mandatory rule files:

- **`security-rules.md`** — preamble ("frontend-only… **no** database client, **no**
  Supabase client, **no** service-role key of its own"), Rule 1 (the internal key is
  attached in *exactly two* server files; no third data path), Rule 3 (the proxy is
  the *only* public entry, scoped to `intl/*`, GET-only), and Rule 5 (only
  `INTERNAL_API_KEY` / `BACKEND_URL` / server config belong in Vercel env — a Supabase
  service-role key does not).
- **`architecture-rules.md`** — this site is a render layer; computation and raw data
  belong on the backend (`raw rows → backend aggregates → /api/intl/* returns finished
  numbers → mpl-intl renders`). Putting 12 SQL stat routes into this repo makes it a
  computation layer with raw DB access, which Rules 1–3 exist to prevent.

Only the compliant path below is pursued.

---

## Routing structure (SETTLED by BOK)

Two **separate, independent** pages. The rich dashboard is **current-tournament only**;
history is its own plain career page. They are **not connected** — no shared layout, no
tabs, no cross-links. The single bridge is a **one-way server-side redirect** below.

1. **Current Tournament Player Detail** (`/players/[key]`) — `app/players/[key]/page.js`
   - Strictly locked to the Current Tournament (MSC 2026).
   - Resolves `player_key` (e.g. `kairi`) → the player's current-edition `roleid` via
     the backend (identity resolution stays server-side; see Identity section).
   - Renders the rich dashboard: Masthead, Filter Sidebar, Performance Overview cards,
     Hero Pool, Comparison vs same-role players, Record vs Teams, Win/Loss split,
     collapsible Game Log, and Advanced Analytics panels.
   - **If the player is NOT in MSC 2026 → server-side redirect to
     `/history/players/[key]`.** No fallback message, no link — the page simply resolves
     to the history page for non-participants. (Next.js `redirect()` in the server
     component, so the URL changes and no current-page shell renders.)
2. **Historical/Legacy Player Detail** (`/history/players/[key]`) — new
   `app/history/players/[key]/page.js`
   - Career rollup across all editions, fully filterable.
   - Renders the existing `PlayerLegacy` component (Career Stats, By Team, Per Season,
     Hero Pool, vs Teams, vs Nation, Compare).
   - **No rich dashboard here, and no link back to the current page.** Fully standalone.

---

## Scope: Phase 1 = basics now, advanced analytics deferred (SETTLED by BOK)

We build the **basic** current-tournament dashboard first, at **full PH parity**. The
**12 advanced analytics tabs are deferred** to a later phase — which tabs (all vs. a
subset) is decided then.

> **Backend gap (confirmed 2026-07-06).** The intl player endpoints are career-oriented
> (`intl_player_stats`, keyed by `player_key`, filtered by `season`/`scope` only). The PH
> rich dashboard needs current-tournament endpoints the intl API does **not** have yet:
> a **win-loss split**, a **rich game log** (items/emblems/spells per game), a **rich hero
> pool** (prio pick / adj pick / meta win%), tabbed **Performance Overview** breakdowns,
> and `phase / week / side / patch / result` filters. **Decision (BOK): build full PH
> parity across both repos** — new backend endpoints in `mpl-ph-s17-backend` against the
> `intl_match_*` rich tables, then the frontend. Backend ships and is verified **first**
> (BOK deploys; this sandbox cannot push), then the frontend switch.
>
> Current-tournament scoping uses `resolveCurrent()` (locks `scope`/`season` to the
> `FEATURED_EDITION`, MSC:2026). The rich per-game tables key on `roleid`, so each new
> endpoint resolves `player_key` → the current edition's `roleid` server-side.

### Phase 1 — Basics (this plan)
Current-tournament dashboard, **without** the advanced analytics panels:
- Masthead (era-correct name, photo, team, role)
- Filter Sidebar
- Performance Overview cards
- Hero Pool
- Comparison vs same-role players
- Record vs Teams (`VsTeamsTable`)
- Win/Loss split
- Collapsible Game Log (items, emblem icons, per-game stats)
- Plus both routes and the non-participant → history redirect.

These read from existing/basic `intl/*` endpoints. Any stat still needs a **backend**
endpoint returning finished numbers (no new client-side aggregation).

### Phase 2 — Advanced analytics (LATER, not now)
The 12 subcomponents: Consistency, Damage Profile, Death Profile, Farm DNA, Heatzones,
Hero Builds, KDA Distribution, Matchup Diff, Milestone Stats, Pathing, Tempo, Map
Analysis. Open when we get there:
- Which of the 12 to port (all vs. subset) — `intl_match_player_stats` and
  `intl_match_per_minute_stats` are fully populated for MSC 2026, but heatzone / pathing
  coordinates may be sparser internationally.
- First-objective stats (first-turtle / first-lord) are **not available** internationally
  — any tab depending on them cannot be shown as-is.

---

## Proposed Changes

### Backend: [mpl-ph-s17-backend](file:///Users/bok/Documents/GitHub/mpl-ph-s17-backend) — do this FIRST

Per `architecture-rules.md` §3: ship and verify the backend before the frontend switch.

**Key finding that makes this tractable:** the intl rich tables are `LIKE match_player_stats
INCLUDING ALL` (see `database/schema_intl_live.sql`) and the collector writes them through
the same `T(table, tournamentId)` path as PH — so `intl_match_player_stats` / `intl_matches`
/ `intl_match_team_stats` / `intl_match_draft` are **1:1 with PH in both schema and
population** (`week_number`, `phase`, `game_patch`, `campid`, `is_winner`, `computed_kda`,
`kill_participation` are all filled). The PH player endpoints therefore port almost
verbatim — swap table names, and swap PH's `game_mvp` table for the `mps.mvp` flag and
`match_mvp` for `intl_match_mvp`.

**The one non-mechanical piece — the `player_key` → `roleid` bridge.** The frontend routes
by stable `player_key`; the rich tables key by `roleid` (a per-tournament account id). They
are two planes populated from the *same* battle at ingest: `historical_player_stats` carries
`player_key` + `game_code` (`'<SEASONSLUG>-<battleId>'`) + IGN; `intl_match_player_stats`
carries `roleid` + `battle_id` + IGN. Bridge them on the ingest-time invariants (same battle,
same IGN):

```sql
SELECT DISTINCT mps.roleid
FROM historical_player_stats h
JOIN intl_match_player_stats mps
  ON substring(h.game_code from '^[^-]+-(.*)$') = mps.battle_id::text
 AND LOWER(mps.player_name) = LOWER(h.player_name)
WHERE h.player_key = $1 AND h.tournament_id = $2 AND h.season = $3
LIMIT 1
```

Follows `identity-rules.md`: no roleid resolved ⇒ **404** (player not in the current edition)
→ frontend redirects to history. We never mint or guess an id. Because `roleid` is
per-tournament, resolving it naturally scopes every downstream query to this edition.

**New endpoints (all `intl/*`, GET-only, so the existing proxy forwards them unchanged —
`security-rules.md` Rule 3):**
1. `GET /api/intl/current/roster` — edition roster + full per-player stats (comparison +
   ranking). Port of PH `/api/stats/players` against `intl_*`.
2. `GET /api/intl/current/players/:key` — resolve `key`→`roleid` (bridge), return
   `{ player, stats, games }`. Port of PH `/api/players/:roleid`.
3. `GET /api/intl/current/roles/:roleid/heroes` — rich hero pool (prio/adj pick, meta win%).
4. `GET /api/intl/current/roles/:roleid/vs-teams` — record vs teams.
5. `GET /api/intl/current/roles/:roleid/win-loss` — win/loss split.
   (Patches reuse the existing `GET /api/intl/patches`.)

Scope/season come from the frontend's `resolveCurrent()` (`?scope=MSC&season=…`); the roster/
meta scans currently see only MSC 2026 rows (the only live-collected edition) — documented,
revisit when MWC data lands. All aggregation is server-side and follows `stats-rules.md`
(No-Averaging for KDA/KP/Turtle/Lord/Turret%/win%; averages for GPM/DPM/DTPM).

**STATUS (implemented, awaiting deploy):** the 5 endpoints + `intlRichFilters()` +
`resolveCurrentRoleid()` are written in `mpl-ph-s17-backend/index.js` (inserted before the
`/api/intl/teams` route). `node --check` passes; helper/column refs verified against the
schema. **Not deployed** (this sandbox can't push) — BOK reviews + deploys to Render, then
the frontend can be built and verified against live routes.

### Frontend: [mpl-intl](file:///Users/bok/Documents/GitHub/mpl-intl)

#### [NEW] `app/history/players/[key]/page.js`
- Historical player detail: renders `PlayerLegacy` inside the history breadcrumb nav,
  supporting fully filterable query params.

#### [MODIFY] `app/players/[key]/page.js`
- Recreate as the Current Tournament player page (rich dashboard, **current only**).
- Resolve path `key` (`player_key`) → current-edition `roleid` **server-side** (server
  component / `lib/api.js`, or a backend resolve endpoint) — the browser never holds a
  DB path or the internal key (`security-rules.md` Rules 1–2).
- **If resolution finds the player is not in MSC 2026, call Next.js `redirect()` to
  `/history/players/[key]`** before rendering any dashboard shell. The two pages stay
  otherwise independent — no shared components, no cross-links.
- Replicate the PH layout (FilterSidebar, Performance Overview cards, Comparison, etc.).

#### [PORT] `components/`
**Phase 1** ports only the basics: `PlayerFilters.js` and `VsTeamsTable.js` (plus the
masthead / overview-card / hero-pool / game-log markup for the dashboard).

**Phase 2 (deferred)** ports the advanced-analytics components: `PlayerAdvancedStats.js`,
`PlayerDeathProfile.js`, `PlayerHeatzones.js`, `PlayerHeroBuilds.js`,
`PlayerKDADistribution.js`, `PlayerMapAnalysis.js`, `PlayerMatchupDiff.js`,
`PlayerMilestoneStats.js`, `PlayerPathing.js`, `PlayerTempo.js`.

Audit each component during its port:

- **Render-only rule (`architecture-rules.md` Rule 3):** any `'use client'` component
  must fetch a pre-computed `/api/intl/...` endpoint and render it. If a PH component
  computes a stat/series client-side (rolling per-minute rows into a curve, `.reduce()`
  over raw metrics, building a distribution), that logic **moves to the backend
  endpoint** — it does not come across into `mpl-intl`. Filtering/sorting/laying out
  already-computed rows is fine.
- **Class names:** `mpl-intl` and PH `globals.css` have diverged — verify each class
  name exists here before porting PH markup; don't assume.
- **Table alignment:** header and cells in a column must share the same text-align
  (numbers right, identity left).

### Identity (follow `mpl-ph-s17/identity-rules.md` via `lib/identity.js`)

- Resolution keys off the **stable `player_key`**, never the display name
  (`identity-rules.md` §1, §6). Career/aggregation group by key.
- Before treating a `key` as unknown, check the **three identity sources** (Liquipedia
  scrape, primary intl seed, PH seed) rather than minting a new key.
- Use **era-correct** name/team fields for display on the current page
  (`identity-rules.md` §3). Be explicit about the **era-vs-franchise** team fields —
  this is the source of the known FLCN/FLCM Current-page mix-up; the current page must
  render the era-correct team, not the franchise rollup.

---

## Verification Plan

### Security checks (`security-rules.md` Rule 7 — mandatory, we touch fetch paths + new routes)
1. No server-only secret leaked to the client:
   `grep -rn "INTERNAL_API_KEY\|BACKEND_URL" app components` matches **only** the two
   server files. No Supabase key or DB URL appears anywhere in `mpl-intl`.
2. Proxy still scoped: a non-`intl` path is rejected —
   `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/players` → `400`.
3. A valid intl path works —
   `curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/api/intl/players/<roleid>/<phase1-endpoint>`
   → `200`.
4. Security headers present on a page response
   (`curl -sI http://localhost:3000/ | grep -i "content-security-policy\|strict-transport"`),
   and no CSP violations in the browser console.

### Architecture check
5. New advanced-stats endpoints return finished numbers/series; no raw per-frame /
   per-event rows are shipped to the browser to be aggregated there. No client
   component turns raw data into a stat/series.

### Manual functional verification
6. `/players/kairi` (Current, Phase 1):
   - Name and photo show **era-correct** Kairi details; team shown is era-correct
     (FLCN/FLCM handled correctly).
   - Basics render: Performance Overview cards, Hero Pool, Comparison, Record vs Teams,
     Win/Loss split. (Advanced analytics panels are Phase 2 — not present yet.)
   - Collapsible Game Log shows items, emblem icons, and stats.
   - Searching a player **not** in MSC 2026 auto-redirects to `/history/players/[key]`
     (URL changes; no current-page shell renders; no cross-link shown).
7. `/history/players/kairi` (History):
   - Renders the legacy/career view; season filter changes seasons correctly.
   - Standalone: no rich dashboard, no link back to the current page.
