# MLBB International — UI/UX Upgrade Plan (Plan-Only)

**Goal:** Bring the stats site up to industry-standard UX, drawing on what the leading
stats sites do right (Basketball-Reference, FBref, Dotabuff/STRATZ, OP.GG/U.GG/Mobalytics,
VLR.gg/HLTV, SoFIFA/FUTBIN). Based on the in-session design audit (score 68/100).

**Status (updated 2026-06-26):**
- ✅ **Phase 1 — DONE** (foundations & legibility): `StatTable`, tokens, tabular numerals,
  focus-visible, colorblind win/loss, clickable-row fix. Plus a follow-up fix to the sticky
  table-header (`.table-wrap` overflow made the header anchor to the box with a 64px phantom band —
  switched to capped-height inner scroll with `top: 0`).
- ✅ **Phase 2 — DONE** (search & filters): global nav search, Games-played filter (removed the
  forced `min_games=5`), Top-20 + "View full list", active-filter chips + Clear all, `useTransition`
  loading + `loading.js` skeleton, stats legend. Role filter intentionally deferred.
- ⏸️ **Phase 3 — HALTED / saved** (percentiles, normalization, radar, compare). Unblocked; resume when ready.
- ⏸️ **Phase 4 — HALTED / saved** (match pages, results feed, splits, CSV export, hero depth). Unblocked; resume when ready.

The Phase 3 & 4 specs below are kept intact for a future session. Each phase is self-contained
and can be executed in a fresh chat context.

**Hard constraints (from repo rules):**
- `CLAUDE.md`: plain language; ask before assuming; when unsure, say so.
- `security-rules.md`: follow it for any change touching DB/auth/API/env vars.
- `identity-rules.md`: follow it for any change touching player/team/era names, identity, or aggregation.
- `design-rules.md`: Role icon instead of role name; Team icon + code always; Player image + name always;
  Hero icon + name always; fixed team colors.
- Stay consistent with the existing **design-token system** (`app/globals.css :root`) and the
  **server-component data-fetching pattern** (`lib/api.js` on the server; client components hit `/api/*`).

---

## Phase 0 — Documentation Discovery & Ground Truth

This was completed in-session by reading the codebase directly. Consolidated findings below;
re-verify anything marked ⚠️ before the phase that depends on it.

### Allowed APIs / current behavior (with sources)

| Fact | Source | Implication |
|---|---|---|
| Server client calls backend with `x-api-key`; browser must use `/api/*` proxy | `lib/api.js:1-18` | Any client-side fetch (search, percentile population) goes through `/api/intl/*`, never direct. |
| API methods: `editions, leaderboard, player, teams, team, heroes, nations, regions, matches` | `lib/api.js:20-30` | No `search` method exists. No `match(id)` method exists. |
| Only `scope`/`season`/`stage` forwarded to backend | `lib/filters.js:5-18` | `sort`, `role`, `q`, etc. are NOT understood unless added; `intlQuery` is the gate. |
| `min_games` is honored by backend | `app/page.js:17` appends `&min_games=5` directly | Backend supports a games threshold — **repurpose** as an optional "Games played" filter; the default `=5` must be **removed** so all players show. |
| Proxy validates slug, **sorts/canonicalizes** query params, forwards Cache-Control | `app/api/[...slug]/route.js:11-45` | Param order can't be relied on for cache-busting; client sort should NOT round-trip. |
| Responses cached `revalidate: 300` | `lib/api.js:15`, `route.js:36` | Re-fetching the same filtered list (e.g. for percentiles) is cheap. |
| Leaderboard/teams endpoints return the **full filtered population** | `app/page.js:50` and `app/teams/page.js:51` map every row | **Percentiles can be computed client-side** from the list — no new endpoint required for player/team percentiles. |
| Detail endpoints return one entity (`totals`, `by_edition`, `by_hero`, `roster`) | `players/[key]/page.js:55-143`, `teams/[key]/page.js:55-169` | Detail pages lack peer context; must also fetch the list to rank. |
| Matches endpoint returns one row **per game** (`match_code, tournament_code, season, stage, stage_type, match_name, team_a_*, team_b_*, winner_key, played_at`); **per-match detail fields exist** (confirmed by owner) | `app/results/page.js:10-49` | Game-by-game match pages are **unblocked** — confirm exact field names (drafts, per-player KDA, Lord/Turtle, duration) at build time. |
| Tokens defined: colors, fonts, `--nav-h`. **No** radius/space/shadow/motion tokens | `app/globals.css:6-27` | Phase 1 adds the missing token families. |
| Format helpers: `num, int, dec, pct, wrClass` | `lib/format.js` | Reuse; do not reinvent number formatting. |
| Image helpers: `img.hero(heroId)`, `img.team(code)` | `lib/images.js` | **No** `img.player(...)` or `img.role(...)` yet. Per owner: no player images yet and role icons are deferred → use **name only** for players for now. |

### Open questions — RESOLVED by product owner (2026-06-26)

1. **Role data:** Some tournaments have **no** role data. Role-derivation logic *may* be built
   later, but **do not surface a role filter or role icons now.** → Role filter is **dropped from
   Phase 2** (moved to a deferred backlog note). Do not show partial/guessed roles.
2. **Minimum games / qualifier:** **No minimum.** ALL players are shown — remove the hardcoded
   `min_games=5`. Replace it with an **optional, user-driven "Games played" filter** (default = no
   filter, everyone visible). → See Phase 2.
3. **Leaderboard length:** Default view shows **Top 20**, with a **"View full list"** control to
   expand to everyone. → See Phase 2. NOTE: percentiles (Phase 3) must use the **full** population,
   not the Top-20 view.
4. **Match detail fields:** **Yes — per-match fields exist.** → Phase 4 match pages are
   **unblocked** (verify exact field names when building, but the data is available).
5. **Player images:** **None yet.** → Detail headers and search results use **name only** for
   players (no player image). Team icon + Hero icon still apply per `design-rules.md`. Revisit when
   a player-image asset path exists.

> Anti-pattern guard: **Do not invent** API params (`role=`, `sort=`, `q=`) and assume the backend
> honors them. Either confirm support or handle client-side. `intlQuery` is the single source of
> truth for what reaches the backend.

---

## Phase 1 — Foundations & Legibility

Lowest risk, highest perceived gain. No backend dependency. Mostly CSS + one client component.

### What to implement
1. **Design tokens** — add to `app/globals.css :root`, then replace literals:
   - `--radius-sm/md/lg/pill` (consolidate the existing `8/10/12/999px` drift)
   - `--space-*` scale (e.g. 4/8/12/16/20/24/32)
   - `--shadow-1/2` (elevation; site is currently flat)
   - `--dur-fast/base` + easing (replace inline `0.15s`)
   - Move inline styles into classes: flag sizing `style={{fontSize:18/15}}`
     (`app/nations/page.js:86`, `app/regions/page.js:65,90,99`) → `.flag` / `.flag-sm`;
     `style={{margin:'0 0 10px'}}` (`app/regions/page.js:80`) → utility class.
2. **Tabular numerals** — add `font-variant-numeric: tabular-nums` to `tbody td` (and stat cards
   `.card .v`) in `app/globals.css`. One-line, fixes decimal misalignment across all tables.
3. **Global `:focus-visible` ring** — add a visible focus outline for `button, a, select,
   [tabindex]` (the current `button{}` reset at `globals.css:45` removes the default → WCAG 2.4.7 fail).
   Use `--accent` outline with offset.
4. **Colorblind-safe win/loss** — `.pos`/`.neg` currently rely on color only (`globals.css:139-140`).
   Add a non-color signal: a leading `▲/▼` or `+/−` glyph via `::before`, OR bold + sign. Keep color.
5. **Fix clickable-row mismatch** — rows get `cursor:pointer` (`globals.css:133`) but only the name
   cell is a link (`app/page.js:54`, `app/teams/page.js:57`). Decide one:
   - (a) make the whole row navigate (wrap row in a client handler / `onClick` router.push), or
   - (b) drop `.clickable` cursor and keep link-only.
   Recommend (a) for parity with stats sites; keep the name `<Link>` for middle-click/SEO.
6. **Sortable tables** — build a reusable **client** `StatTable` (or `useSortable` hook):
   - Props: `columns` (key, label, align, numeric, sortAccessor, optional `title` tooltip,
     optional `render`/`bar`), `rows`, `initialSort`, `getRowKey`, optional `href(row)`.
   - Click header → sort; show `aria-sort` + ▲/▼ indicator; numeric vs text comparators.
   - **Sort is client-only state** to avoid a server round-trip. Optionally mirror to the URL via
     `history.replaceState` (no navigation) so it's shareable; **do NOT** push `?sort=` through the
     router (that re-runs the server component) and **do NOT** forward `sort` to the backend
     (`intlQuery` would drop it anyway).
   - Convert Players, Teams, Heroes, Nations (country table), Regions (standings) to `StatTable`.
     Keep the H2H matrix as-is (not a sortable list).
   - Re-rank the `#` column on sort (compute index after sort), like Basketball-Reference.

### Documentation references (patterns to copy)
- Existing table markup to preserve visually: `app/teams/page.js:34-77`, `app/page.js:33-74`.
- Sticky header + H2H sticky corner already solved: `app/globals.css:124-128, 194-197` (reuse the
  sticky-first-column technique later for wide tables).
- Number formatting: always go through `lib/format.js` (`int/dec/pct/wrClass`).

### Verification checklist
- [ ] `grep -rn "style={{" app/` returns **0** inline styles in pages (moved to classes).
- [ ] `grep -n "tabular-nums" app/globals.css` present; visually, a KDA column aligns at the decimal.
- [ ] Keyboard Tab through nav/filters/table headers shows a visible focus ring on every control.
- [ ] Win/loss cells are distinguishable in grayscale (glyph/sign present, not color alone).
- [ ] Clicking any cell in a player/team row navigates (or cursor removed) — no dead pointer.
- [ ] Clicking a column header re-sorts rows and updates `#`; `aria-sort` toggles; no full-page reload/refetch.
- [ ] All five list pages use `StatTable`; `next build` passes.

### Anti-pattern guards
- Do NOT push sort state through `router.push` (causes a server refetch). Client state only.
- Do NOT forward `sort`/`dir` to the backend or add them to `intlQuery`.
- Do NOT hardcode new hex/px values — use the new tokens.

---

## Phase 2 — Search & Filters

Brings the site to "every stats site has this" baseline. Some items gated on ⚠️ role data.

### What to implement
1. **Global typeahead search in the nav** (`components/Nav.js`) — OP.GG/U.GG "smart search" pattern:
   - Client component; debounced; queries a small in-memory index.
   - **Data source decision (pick one, ask user):**
     - (a) Build the index client-side from already-cacheable lists (`/api/intl/leaderboard`,
       `/api/intl/teams`, `/api/intl/heroes`) — no backend change; fine for tournament-sized data.
     - (b) Add a dedicated `/api/intl/search?q=` backend endpoint — better if lists are large.
   - Results grouped Player / Team / Hero. **Team + Hero show icon + name; players show name only**
     (no player-image asset yet — Open Q#5). Enter routes to the top hit; arrow-key navigation;
     respects current filter params in the URL.
2. **Remove the minimum-games default + add an optional "Games played" filter** (resolves Open Q#2):
   - **Delete** the hardcoded `min_games=5` in `app/page.js:17` so ALL players show by default.
   - Add an **optional** "Games played" control to `FilterBar` (e.g. `Any / ≥5 / ≥10 / ≥20` or a
     small number input). Default = **Any** (no filtering). It is a *user choice*, not a qualifier.
   - Plumb via the URL; append to the leaderboard query the way `app/page.js:17` already does
     (backend honors the games threshold param). Naming TBD at build — keep default omitted entirely.
3. **Top-20 default with "View full list"** (resolves Open Q#3):
   - List pages (Players first; apply to Teams/Heroes/Nations as fits) render the **top 20 rows by
     default** with a **"View full list" / "Show all"** toggle that reveals the complete set.
   - Implement as client-side slice of the already-fetched rows (the full list is available; just
     collapsed). Keep it compatible with `StatTable` sorting (sort the full set, then slice).
   - NOTE for Phase 3: percentiles must use the **full** population, never the collapsed Top-20.
   - *(Role filter is intentionally NOT included — deferred per Open Q#1. See backlog note below.)*
4. **Active-filter chips + Clear all** — read normalized state from `activeFilters()`
   (`lib/filters.js:22`, already written for exactly this). Render removable chips under the
   filter bar; each chip removes its param; "Clear all" returns to default.
5. **Loading states** — wrap filter navigation in `useTransition` (in `FilterBar`) to show a
   pending state, and add `loading.js` route skeletons for each list page (table-shaped shimmer)
   so a slow filter change doesn't look frozen.
6. **Stat-header tooltips + legend** — add `<abbr title="...">` (or `title=` on `th`) for
   GPM/DPM/KP%/KDA, plus a small collapsible "What do these mean?" legend component reused across
   pages (FBref keeps a consistent, explained stat set).

### Documentation references
- `activeFilters()` already returns normalized chip state — `lib/filters.js:22-30`.
- Existing filter UI to extend, not replace — `components/FilterBar.js:49-85`.
- Games-threshold param precedent (to repurpose, not default) — `app/page.js:13-19`.

### Verification checklist
- [ ] Typing 2+ chars in nav search shows grouped results; team/hero show icons, players show name only; Enter navigates; Esc closes.
- [ ] Search results route correctly to `/players/[key]`, `/teams/[key]`, `/heroes` (or hero anchor).
- [ ] With no filter set, **every** player shows (no `min_games=5`); the "Games played" filter is `Any` by default.
- [ ] Selecting a Games-played threshold filters the list and is reflected in the URL; clearing it restores all.
- [ ] List shows Top 20 by default; "View full list" reveals all rows and still sorts correctly.
- [ ] Active filters render as chips; removing a chip / Clear all updates the table.
- [ ] During a filter change, a skeleton or pending state is visible (no frozen UI).
- [ ] Every stat header exposes a tooltip; the legend lists all abbreviations.
- [ ] No role filter / role icons are shipped (deferred).

### Anti-pattern guards
- Do NOT re-introduce a default minimum-games qualifier — default is ALL players.
- Do NOT add `q`/`role` to the backend forward list without confirming support.
- Do NOT show guessed/partial roles — role data is incomplete across tournaments.
- Do NOT fetch on every keystroke without debounce; do NOT block page render on search-index load.

### Deferred backlog (not in this phase)
- **Role derivation + role icons:** some tournaments lack role data. A future task may infer role
  from hero/lane heuristics, but nothing role-related ships until coverage + an icon asset exist.
- **Player images:** add `img.player(...)` + player photos in search/detail once an asset path exists.

---

## Phase 3 — Context & Judgment (FBref-style differentiator)

The standout feature set: turn flat numbers into "is this good?". **Unblocked** — the full
population is available (Top-20 is only a display collapse; the complete list is returned).

### What to implement
1. **Use the FULL population** (do first): compute percentiles against the complete filtered list,
   **not** the Top-20 display slice from Phase 2. The list endpoints already return everyone.
2. **Percentile bars on detail pages** — FBref scouting-report pattern:
   - On `players/[key]` and `teams/[key]`, also fetch the matching list for the same filter
     (`api.leaderboard(q)` / `api.teams(q)`), compute each stat's percentile vs the **full** peer
     pool (follow `identity-rules.md` for era/identity aggregation correctness).
   - If a "Games played" filter is active, decide explicitly whether the peer pool respects it or
     always uses the unfiltered population — document the choice in UI text (plain language).
   - Render a labeled percentile bar per key stat (KDA, Win%, KP%, GPM, DPM, MVP-rate) next to the
     existing stat cards (`players/[key]/page.js:72-81`).
3. **Per-game / per-90 normalization toggle** — let users switch totals ↔ per-game. MLBB has no
   fixed 90-min match, so define the rate basis explicitly (per-game is the honest analogue;
   per-10-min if duration is available). Document the chosen basis in UI text (plain language).
4. **Radar / pizza chart on the player header** — small SVG radar of percentile values (reuse the
   same percentiles from item 2). Keep it lightweight (no heavy chart lib; hand-rolled SVG fits the
   existing no-dependency approach).
5. **Compare mode** — SoFIFA/FUTBIN side-by-side:
   - New route `/compare?players=a,b,c` (and/or teams). Client selection UI (search-driven, reuse
     Phase 2 search). Render 2–3 entities in columns with shared rows + percentile bars; highlight
     the leader per row.

### Documentation references
- Detail stat layout to extend — `app/players/[key]/page.js:72-81`, `app/teams/[key]/page.js:72-81`.
- Population fetch pattern — `app/page.js:14-19`, `app/teams/page.js:14-20`.
- H2H/matrix SVG-free rendering precedent (for the radar's hand-rolled approach) — `app/regions/page.js:95-117`.

### Verification checklist
- [ ] Percentiles are computed against the full population (NOT the Top-20 display slice).
- [ ] A player detail page shows percentile bars whose values match a manual rank check on the list.
- [ ] Normalization toggle switches totals ↔ per-game and clearly labels the basis.
- [ ] Radar renders from the same percentile data; degrades gracefully with missing stats.
- [ ] `/compare` shows 2–3 entities side-by-side with leader highlighting; deep-links via URL.

### Anti-pattern guards
- Do NOT compute percentiles against a truncated list (silently wrong). Verify population first.
- Do NOT claim "per-90" if MLBB matches aren't 90 min — name the real basis.
- Do NOT violate `identity-rules.md` aggregation (era/identity grouping) when pooling peers.

---

## Phase 4 — Depth & Feeds (esports-grade)

Highest effort. **Match pages are unblocked** — per-match detail fields exist (confirmed by owner);
verify exact field names at build time.

### What to implement
1. **Clickable individual match pages** (VLR/HLTV tabbed pattern) — per-game data exists
   (drafts, per-player KDA, Lord/Turtle, duration). First, confirm the exact field names/shape on
   the matches (or a match-by-id) endpoint; add an `api.match(code, q)` helper if needed. Route:
   `/results/[matchCode]` with Overview / per-game tabs. Make match cards in
   `app/results/page.js:114-121` link to it.
2. **Chronological results feed** — alongside the existing bracket, a date-grouped reverse-chron
   list (Sofascore/VLR feed). Reuse `api.matches` data already rolled up in
   `app/results/page.js:10-60`; add a feed view toggle (bracket ↔ feed).
3. **Splits on detail pages** — Basketball-Reference splits: same stats sliced by stage
   (Wildcard vs Main) and by event family (MSC vs M-Series). The data already arrives as
   `by_edition` (`players/[key]/page.js:97`); add stage/event grouping toggles.
4. **CSV export per table** — Basketball-Reference "Share & more": a button on each `StatTable`
   that serializes current (sorted/filtered) rows to CSV client-side. No backend needed.
5. **Heroes depth** — "top players on this hero" + duo synergies (Dotabuff). ⚠️ synergy needs
   pair-level data; confirm availability before committing. Top-players-per-hero may be derivable
   from existing per-hero player rows — verify.

### Documentation references
- Match rollup logic to reuse for the feed — `app/results/page.js:10-60`.
- Detail `by_edition` shape for splits — `app/players/[key]/page.js:96-107`, `app/teams/[key]/page.js:96-107`.
- `StatTable` from Phase 1 is the hook point for CSV export.

### Verification checklist
- [ ] Match cards link to a match page; match page renders per-game detail from real fields.
- [ ] Results page offers bracket ↔ feed; feed is reverse-chronological and filter-aware.
- [ ] Detail pages can split stats by stage and by event; totals reconcile with the unsplit view.
- [ ] CSV export downloads the current sorted/filtered rows; opens cleanly in a spreadsheet.
- [ ] Hero "top players"/synergy ships only if backing data is confirmed.

### Anti-pattern guards
- Match data exists, but still verify exact field names against the live payload before rendering.
- Do NOT recompute aggregates in ways that diverge from backend totals (reconcile; `identity-rules.md`).

---

## Final Phase — Verification & Consistency Sweep

1. **Docs/Rules match:** re-read `design-rules.md`, `security-rules.md`, `identity-rules.md`;
   confirm every new UI honors team-icon+code and hero-icon+name. (Player image + role icon are
   **deferred** — no assets/coverage yet; players render name-only and no roles are shown.)
   Confirm no client code ever sees `INTERNAL_API_KEY`.
2. **Token audit:** `grep -rn "#[0-9a-fA-F]\{3,6\}" app/ components/` → 0 stray hex outside
   `:root`; `grep -rn "style={{" app/ components/` → 0 inline styles.
3. **A11y:** keyboard-only pass (focus rings, `aria-sort`, search combobox roles); grayscale pass
   (win/loss legible without color); contrast check on new components.
4. **Security:** `grep -rn "INTERNAL_API_KEY\|BACKEND_URL" app/ components/ lib/` confined to
   server files (`lib/api.js`, `app/api/.../route.js`); no new client direct-to-backend fetches.
5. **Build/perf:** `npm run build` passes; verify sort/search don't trigger needless refetches;
   confirm `revalidate: 300` caching still applies to new fetches.
6. **Regression:** all original pages render with default filters identical to today.

---

## Execution notes
- All open questions are **resolved** — every phase is unblocked. Remaining "verify at build time"
  items are field-name confirmations (match payload, games-threshold param name), not blockers.
- **Deferred (not in scope until assets exist):** role filter / role icons, player images.
- Phases are ordered by risk/dependency. **Phase 1 is fully unblocked** — safe to start anytime.
- Recommended first slice: **Phase 1 + the Phase 2 global search box + remove min-games / Top-20
  toggle** (biggest perceived jump, no backend dependency).
