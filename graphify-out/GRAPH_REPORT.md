# Graph Report - mpl-intl  (2026-07-23)

## Corpus Check
- 109 files · ~126,148 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 817 nodes · 1495 edges · 53 communities (48 shown, 5 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `47b44f64`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- DashboardView.js
- featured.js
- api.js
- MatchViewer.js
- Move Computation to the Backend — Audit + Plan
- MatchResultsGrid.js
- MLBB International — UI/UX Upgrade Plan (Plan-Only)
- ObjectiveTimingChart.js
- PlayerLegacy.js
- International Team Logos — Liquipedia Scrape Plan
- Design System: MLBB International
- CurrentHeroStatsView.js
- CurrentHeroDashboard.js
- Nav.js
- Plan: Recreate Player Page (Current vs. History Split)
- Nav.js
- Current-vs-History Identity Enforcement — Audit + Plan
- Integrate Upcoming Tournaments — Plan & Status
- PlayerTable.js
- MatchAnalysis.js
- scripts
- Separate Current-Tournament vs History — Architecture Split
- Separate Current-Tournament vs History — Architecture Split
- TeamStatsTimeline.js
- MatchBreakdown.js
- MatchViewer.js
- Security Rules — International Site (`mpl-intl`)
- Security Rules — International Site (`mpl-intl`)
- page.js
- Product
- vercel.json
- mpl-intl
- MLBB International (working title)
- vercel.json
- next.config.js
- mpl-intl — Project Instructions
- pre-commit
- loading.js
- TeamKdaDistribution.js
- HistoryDashboardClient.js
- MatchCard.js
- TeamKdaDistribution.js
- MatchCard.js
- LoadingSkeleton.js
- msc2026MainBracket.js
- page.js
- route.js
- identity.js
- MatchCard.js
- ItemTimings.js
- msc2026MainBracket.js
- PageHead.js

## God Nodes (most connected - your core abstractions)
1. `resolveCurrent()` - 27 edges
2. `img` - 27 edges
3. `num()` - 23 edges
4. `api` - 22 edges
5. `resolveSelection()` - 21 edges
6. `TeamLogo()` - 20 edges
7. `dec()` - 18 edges
8. `ErrorBox()` - 15 edges
9. `Architecture Rules — International Site (`mpl-intl`)` - 15 edges
10. `RoleImg()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `HeroDetail()` --calls--> `resolveCurrent()`  [EXTRACTED]
  app/heroes/[heroid]/page.js → lib/featured.js
- `HistoryDashboardPage()` --calls--> `resolveSelection()`  [EXTRACTED]
  app/history/dashboard/page.js → lib/featured.js
- `HistoryHeroes()` --calls--> `resolveSelection()`  [EXTRACTED]
  app/history/heroes/page.js → lib/featured.js
- `HistoryMatchesPage()` --calls--> `resolveSelection()`  [EXTRACTED]
  app/history/matches/page.js → lib/featured.js
- `HistoryPlayers()` --calls--> `resolveSelection()`  [EXTRACTED]
  app/history/players/page.js → lib/featured.js

## Import Cycles
- None detected.

## Communities (53 total, 5 thin omitted)

### Community 0 - "DashboardView.js"
Cohesion: 0.19
Nodes (8): metadata, HistoryPlayers(), metadata, metadata, PlayersPage(), PlayerStatsView(), api, PLAYER_COLUMNS

### Community 1 - "featured.js"
Cohesion: 0.06
Nodes (35): 1. Wide tables — horizontal scroll + sticky first column, 2. Comparison grids — scroll wrapper + minWidth inner div, 3. Card grids — use auto-fit/auto-fill, 4. Day-column grids (match schedule) — scroll wrapper, 5. Flex rows that wrap, 6. SVG charts — use viewBox + width: 100%, 7. Card-level horizontal scroll for multi-column grids inside cards, 8. Stacked grid (breakpoint class) for two-panel layouts (+27 more)

### Community 2 - "api.js"
Cohesion: 0.15
Nodes (14): apiToMap(), C1_SHADES, C2_SHADES, CAMP_ABBR, campStateAt(), fmtTime(), GOLD_SOURCES, MapReview() (+6 more)

### Community 3 - "MatchViewer.js"
Cohesion: 0.07
Nodes (30): DonutChart(), DualBar(), fmtK(), GOLD_SOURCES, GoldDistribution(), MatchAnalysis(), PIE_STATS, PlayerVsPlayer() (+22 more)

### Community 4 - "Move Computation to the Backend — Audit + Plan"
Cohesion: 0.05
Nodes (35): Architecture Rules — International Site (`mpl-intl`), Enforcement, Known accepted exceptions (as of 2026-07-06), Reference: `eraTeams` vs `teams`, Reference: featured edition & filter resolution, Reference: key `lib/` files, Reference: `tournament_stage`, Reference: two data tiers (+27 more)

### Community 5 - "MatchResultsGrid.js"
Cohesion: 0.15
Nodes (12): FilterSidebar(), ROLES, selStyle, WEEKS, getTier(), getWrColor(), HeroCard(), TeamImg() (+4 more)

### Community 6 - "MLBB International — UI/UX Upgrade Plan (Plan-Only)"
Cohesion: 0.11
Nodes (22): avg(), dotRadius(), fmtK(), fmtPct(), fmtTime(), icon(), normSeq(), OBJ_TYPES (+14 more)

### Community 7 - "ObjectiveTimingChart.js"
Cohesion: 0.08
Nodes (12): HistoryDashboardPage(), metadata, DashboardMainTabs(), DashboardStatsTabs(), DashboardView(), fmtHms(), fmtPct(), fmtSec() (+4 more)

### Community 8 - "PlayerLegacy.js"
Cohesion: 0.20
Nodes (10): BracketCol(), QualifiedCol(), SeriesBox(), SubHead(), LAYOUT_LABELS, MatchResultsGrid(), buildSeries(), computeDecider() (+2 more)

### Community 9 - "International Team Logos — Liquipedia Scrape Plan"
Cohesion: 0.22
Nodes (10): buildLines(), CMP_MODES, fmtTime(), MAP_COLORS, PAD, pickScale(), pickYStep(), STAT_CONFIGS (+2 more)

### Community 10 - "Design System: MLBB International"
Cohesion: 0.22
Nodes (10): HistoryMatchesPage(), metadata, GenericMatchesView(), MatchesListView(), STAGES, getMatchMeta(), findStage(), FORMATS (+2 more)

### Community 11 - "CurrentHeroStatsView.js"
Cohesion: 0.10
Nodes (20): 1. Overview, 2. Colors, 3. Typography, 4. Elevation, 5. Components, 6. Do's and Don't's, Buttons, Cards / Containers (+12 more)

### Community 12 - "CurrentHeroDashboard.js"
Cohesion: 0.11
Nodes (17): Architecture check, Architecture decision (SETTLED by mandatory rules), Backend: [mpl-ph-s17-backend](file:///Users/bok/Documents/GitHub/mpl-ph-s17-backend) — do this FIRST, Frontend: [mpl-intl](file:///Users/bok/Documents/GitHub/mpl-intl), Identity (follow `mpl-ph-s17/identity-rules.md` via `lib/identity.js`), Manual functional verification, [MODIFY] `app/players/[key]/page.js`, [NEW] `app/history/players/[key]/page.js` (+9 more)

### Community 13 - "Nav.js"
Cohesion: 0.13
Nodes (6): metadata, I, ICONS, Nav, rank(), Search()

### Community 14 - "Plan: Recreate Player Page (Current vs. History Split)"
Cohesion: 0.12
Nodes (16): Audit results, Current-vs-History Identity Enforcement — Audit + Plan, Decisions (locked with BOK, 2026-07-06), How era-correctness actually works (root of the whole thing), Layer A — data (MSC 2026): COMPLETE, Layer B — backend endpoints: ONE gap, Layer C — frontend surfaces: TWO gaps, Phase 0 — Backend: close the one gap + guarantee future data (+8 more)

### Community 15 - "Nav.js"
Cohesion: 0.07
Nodes (27): Allowed APIs / current behavior (with sources), Anti-pattern guards, Anti-pattern guards, Anti-pattern guards, Anti-pattern guards, Deferred backlog (not in this phase), Documentation references, Documentation references (+19 more)

### Community 16 - "Current-vs-History Identity Enforcement — Audit + Plan"
Cohesion: 0.23
Nodes (10): CategorySelect(), ALL_CATS, formatGameInfo(), getUrlWithParams(), HistoryRecordsPage(), metadata, PLAYER_GROUPS, td (+2 more)

### Community 17 - "Integrate Upcoming Tournaments — Plan & Status"
Cohesion: 0.12
Nodes (15): Backend facts this work relies on, Database questions to resolve, Files touched so far, Goal, ⛔ Halted: why, and what to resolve first, How the intl site was built (the gap we closed), How to resume, Integrate Upcoming Tournaments — Plan & Status (+7 more)

### Community 18 - "PlayerTable.js"
Cohesion: 0.36
Nodes (6): apiToMap(), CATEGORIES, ROLE_COLOR, ROLES, TeamKdaDistribution(), toPx()

### Community 19 - "MatchAnalysis.js"
Cohesion: 0.17
Nodes (13): RuneImg(), SkillImg(), big(), computeHighlights(), cs(), fmtCC(), LOWER_BETTER, PlayerRow() (+5 more)

### Community 20 - "scripts"
Cohesion: 0.31
Nodes (7): PlayerPhoto(), TeamLogo(), big(), n(), VsTeamsTable(), cdnify(), img

### Community 21 - "Separate Current-Tournament vs History — Architecture Split"
Cohesion: 0.13
Nodes (14): dependencies, next, react, react-dom, recharts, name, private, scripts (+6 more)

### Community 22 - "Separate Current-Tournament vs History — Architecture Split"
Cohesion: 0.14
Nodes (13): Decisions (locked in with BOK, 2026-07-04), Hard constraints (from repo rules), Phase 1 — Extract view components (NO behavior change)  ✅, Phase 2 — Add `resolveCurrent` + lock the current pages, Phase 3 — Rename /results -> /matches, Phase 4 — Build History parity, Phase 5 — Re-point cross-links + cleanup, Phases (+5 more)

### Community 23 - "TeamStatsTimeline.js"
Cohesion: 0.15
Nodes (13): HistoryHeroes(), metadata, HeroStatsView(), COMBAT_AVG, CURRENT_PLAYER_COLUMNS, DAMAGE, GROUP, HERO_COLUMNS (+5 more)

### Community 24 - "MatchBreakdown.js"
Cohesion: 0.23
Nodes (6): metadata, BoxScore(), fmtCC(), HeroBanImg(), fmtTime(), MatchBreakdown()

### Community 25 - "MatchViewer.js"
Cohesion: 0.24
Nodes (11): big(), COMPARE_STATS, CurrentPlayerDashboard(), n(), pct(), PERF_FILTERS, rankAmong(), rankAmongRole() (+3 more)

### Community 26 - "Security Rules — International Site (`mpl-intl`)"
Cohesion: 0.20
Nodes (9): How data reaches this site (the mental model), Rule 1 — The internal API key stays server-only, Rule 2 — Client components fetch through the proxy, never the backend directly, Rule 3 — The proxy is scoped, read-only, and input-validated, Rule 4 — HTTP response headers, Rule 5 — Environment variables, Rule 6 — Secret-scanning pre-commit hook, Rule 7 — Verify before calling it done (+1 more)

### Community 27 - "Security Rules — International Site (`mpl-intl`)"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 28 - "page.js"
Cohesion: 0.16
Nodes (11): big(), COMPARE_STATS, CurrentHeroDashboard(), n(), pct(), PERF_FILTERS, rankAmong(), rankAmongRole() (+3 more)

### Community 29 - "Product"
Cohesion: 0.33
Nodes (5): How data flows, MLBB International (working title), Notes / TODO, Setup, What's here

### Community 30 - "vercel.json"
Cohesion: 0.40
Nodes (4): buildCommand, devCommand, framework, installCommand

### Community 31 - "mpl-intl"
Cohesion: 0.40
Nodes (3): Commands, Mandatory rules, mpl-intl

### Community 32 - "MLBB International (working title)"
Cohesion: 0.50
Nodes (3): CSP, nextConfig, securityHeaders

### Community 36 - "mpl-intl — Project Instructions"
Cohesion: 0.25
Nodes (10): EARLY_RUNNER_UPS, formatDateRange(), HistoryDashboardClient(), INTL_LOGO_OVERRIDES, intlLogo(), MONTH, parseLocal(), TeamEntity() (+2 more)

### Community 37 - "pre-commit"
Cohesion: 0.13
Nodes (14): 1. Aggregation principle: recompute from totals, 2.1 KDA, 2.2 Turtle Control %, 2.3 Lord Control %, 2.4 Kill Participation (player), 2.5 Team Kill Participation (team-level), 2.6 Per-minute stats (GPM, DPM, DTPM, Turret Dmg/min), 2.7 Turret Destroyed % (+6 more)

### Community 38 - "loading.js"
Cohesion: 0.18
Nodes (10): Breakpoint scale (the five groups), Core techniques (used everywhere), Current state (audit findings), Out of scope, Phase 0 — Foundations (globals.css + shell), Phase 1 — Current MSC 2026 pages (priority), Phase 2 — History section, Phase 3 — Long tail + polish (+2 more)

### Community 39 - "TeamKdaDistribution.js"
Cohesion: 0.21
Nodes (9): HistoryTeams(), metadata, metadata, TeamsPage(), DEFS, StatLegend(), TeamStatsView(), TEAM_COLUMNS (+1 more)

### Community 40 - "HistoryDashboardClient.js"
Cohesion: 0.36
Nodes (6): HeroPoint(), HeroScatterChart(), median(), METRICS, Tip(), winColor()

### Community 41 - "MatchCard.js"
Cohesion: 0.22
Nodes (9): ROLE_ORDER, HeroImg(), PHOTO_FALLBACK, PlayerAvatar(), RoleImg(), SynergyTable(), dash(), DraftStatsView() (+1 more)

### Community 42 - "TeamKdaDistribution.js"
Cohesion: 0.23
Nodes (10): BracketView(), computeGeometry(), elbowPath(), FallbackBracket(), LayoutBracket(), LB_ROUNDS, UB_ROUNDS, getKnockoutLayout() (+2 more)

### Community 43 - "MatchCard.js"
Cohesion: 0.22
Nodes (8): M1, M2, M3, M4, M5, M6, M7, MAPS

### Community 44 - "LoadingSkeleton.js"
Cohesion: 0.06
Nodes (57): DraftPage(), metadata, HeroesPage(), metadata, HistoryNations(), metadata, fmtDuration(), HistoryOverview() (+49 more)

### Community 46 - "page.js"
Cohesion: 0.16
Nodes (27): big(), card, CareerSection(), COMPARE_ROWS, CompareSection(), d2(), duration(), HeroesSection() (+19 more)

### Community 48 - "identity.js"
Cohesion: 0.36
Nodes (7): HistoryPlayerDetail(), fieldSet(), isEraMode(), PLAYER_ROW, resolveTeam(), TEAM_ROW, teamFieldKeys()

### Community 50 - "ItemTimings.js"
Cohesion: 0.33
Nodes (5): ItemImg(), fmtTime(), ItemTimings(), PlayerTimingRow(), ROLE_ORDER

### Community 51 - "msc2026MainBracket.js"
Cohesion: 0.33
Nodes (5): MAIN_GROUPS, MAIN_QUALIFIER_REFS, MAIN_TREE, refLabel(), resolveMainGroup()

### Community 52 - "PageHead.js"
Cohesion: 0.47
Nodes (3): PageHead(), buildBracket(), MatchesView()

## Knowledge Gaps
- **330 isolated node(s):** `metadata`, `ROLE_KEYS`, `PERF_FILTERS`, `COMPARE_STATS`, `WL_STATS` (+325 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `img` connect `scripts` to `api.js`, `MatchViewer.js`, `mpl-intl — Project Instructions`, `MatchResultsGrid.js`, `ObjectiveTimingChart.js`, `PlayerLegacy.js`, `MatchCard.js`, `HistoryDashboardClient.js`, `LoadingSkeleton.js`, `Nav.js`, `page.js`, `Current-vs-History Identity Enforcement — Audit + Plan`, `MatchCard.js`, `PlayerTable.js`, `identity.js`, `MatchBreakdown.js`, `MatchViewer.js`, `page.js`?**
  _High betweenness centrality (0.069) - this node is a cross-community bridge._
- **Why does `api` connect `DashboardView.js` to `MLBB International — UI/UX Upgrade Plan (Plan-Only)`, `ObjectiveTimingChart.js`, `TeamKdaDistribution.js`, `MatchCard.js`, `International Team Logos — Liquipedia Scrape Plan`, `LoadingSkeleton.js`, `Current-vs-History Identity Enforcement — Audit + Plan`, `PlayerTable.js`, `scripts`, `PageHead.js`, `TeamStatsTimeline.js`, `MatchBreakdown.js`, `page.js`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `TeamLogo()` connect `scripts` to `mpl-intl — Project Instructions`, `MatchResultsGrid.js`, `ObjectiveTimingChart.js`, `PlayerLegacy.js`, `MatchCard.js`, `LoadingSkeleton.js`, `page.js`, `Current-vs-History Identity Enforcement — Audit + Plan`, `MatchCard.js`, `MatchBreakdown.js`, `MatchViewer.js`, `page.js`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **What connects `metadata`, `ROLE_KEYS`, `PERF_FILTERS` to the rest of the system?**
  _330 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `featured.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `api.js` be split into smaller, more focused modules?**
  _Cohesion score 0.14619883040935672 - nodes in this community are weakly interconnected._
- **Should `MatchViewer.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06612685560053981 - nodes in this community are weakly interconnected._