# Graph Report - mpl-intl  (2026-08-08)

## Corpus Check
- 115 files · ~133,222 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 855 nodes · 1552 edges · 48 communities (44 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `80820633`
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
- resolveSelection
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
- filters.js
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
- Hero Class / Specialty / Release Date — mpl-intl rollout plan
- HistoryDashboardClient.js
- MatchCard.js
- TeamKdaDistribution.js
- MatchCard.js
- LoadingSkeleton.js
- BoxScore.js
- page.js
- route.js

## God Nodes (most connected - your core abstractions)
1. `resolveCurrent()` - 27 edges
2. `img` - 27 edges
3. `num()` - 23 edges
4. `api` - 22 edges
5. `resolveSelection()` - 21 edges
6. `TeamLogo()` - 20 edges
7. `dec()` - 18 edges
8. `ErrorBox()` - 15 edges
9. `int()` - 15 edges
10. `Architecture Rules — International Site (`mpl-intl`)` - 15 edges

## Surprising Connections (you probably didn't know these)
- `HeroDetail()` --calls--> `resolveCurrent()`  [EXTRACTED]
  app/heroes/[heroid]/page.js → lib/featured.js
- `HistoryMatchesPage()` --calls--> `resolveSelection()`  [EXTRACTED]
  app/history/matches/page.js → lib/featured.js
- `HistoryPlayers()` --calls--> `resolveSelection()`  [EXTRACTED]
  app/history/players/page.js → lib/featured.js
- `MatchesPage()` --calls--> `resolveCurrent()`  [EXTRACTED]
  app/matches/page.js → lib/featured.js
- `PlayersPage()` --calls--> `resolveCurrent()`  [EXTRACTED]
  app/players/page.js → lib/featured.js

## Import Cycles
- None detected.

## Communities (48 total, 4 thin omitted)

### Community 0 - "DashboardView.js"
Cohesion: 0.18
Nodes (13): DonutChart(), DualBar(), fmtK(), GOLD_SOURCES, GoldDistribution(), MatchAnalysis(), PIE_STATS, PlayerVsPlayer() (+5 more)

### Community 1 - "featured.js"
Cohesion: 0.06
Nodes (35): 1. Wide tables — horizontal scroll + sticky first column, 2. Comparison grids — scroll wrapper + minWidth inner div, 3. Card grids — use auto-fit/auto-fill, 4. Day-column grids (match schedule) — scroll wrapper, 5. Flex rows that wrap, 6. SVG charts — use viewBox + width: 100%, 7. Card-level horizontal scroll for multi-column grids inside cards, 8. Stacked grid (breakpoint class) for two-panel layouts (+27 more)

### Community 2 - "api.js"
Cohesion: 0.29
Nodes (5): H2, metadata, P, SECTION, UL

### Community 3 - "MatchViewer.js"
Cohesion: 0.06
Nodes (31): SkillImg(), apiToMap(), C1_SHADES, C2_SHADES, CAMP_ABBR, campStateAt(), fmtTime(), GOLD_SOURCES (+23 more)

### Community 4 - "Move Computation to the Backend — Audit + Plan"
Cohesion: 0.05
Nodes (35): Architecture Rules — International Site (`mpl-intl`), Enforcement, Known accepted exceptions (as of 2026-07-06), Reference: `eraTeams` vs `teams`, Reference: featured edition & filter resolution, Reference: key `lib/` files, Reference: `tournament_stage`, Reference: two data tiers (+27 more)

### Community 5 - "MatchResultsGrid.js"
Cohesion: 0.17
Nodes (23): big(), card, CareerSection(), COMPARE_ROWS, CompareSection(), d2(), duration(), HeroesSection() (+15 more)

### Community 6 - "MLBB International — UI/UX Upgrade Plan (Plan-Only)"
Cohesion: 0.11
Nodes (22): avg(), dotRadius(), fmtK(), fmtPct(), fmtTime(), icon(), normSeq(), OBJ_TYPES (+14 more)

### Community 7 - "resolveSelection"
Cohesion: 0.13
Nodes (14): HistoryDashboardPage(), metadata, HistoryHeroes(), metadata, HistoryNations(), metadata, HistoryRegionsPage(), metadata (+6 more)

### Community 8 - "PlayerLegacy.js"
Cohesion: 0.23
Nodes (10): fmtDuration(), HistoryOverview(), metadata, tdWithLink, th, CurrentPlayerPage(), byRecency(), featuredPin() (+2 more)

### Community 9 - "International Team Logos — Liquipedia Scrape Plan"
Cohesion: 0.22
Nodes (10): buildLines(), CMP_MODES, fmtTime(), MAP_COLORS, PAD, pickScale(), pickYStep(), STAT_CONFIGS (+2 more)

### Community 10 - "Design System: MLBB International"
Cohesion: 0.18
Nodes (11): HistoryMatchesPage(), metadata, MatchesPage(), metadata, MatchesListView(), STAGES, scheduleInStage(), findStage() (+3 more)

### Community 11 - "CurrentHeroStatsView.js"
Cohesion: 0.10
Nodes (20): 1. Overview, 2. Colors, 3. Typography, 4. Elevation, 5. Components, 6. Do's and Don't's, Buttons, Cards / Containers (+12 more)

### Community 12 - "CurrentHeroDashboard.js"
Cohesion: 0.11
Nodes (17): Architecture check, Architecture decision (SETTLED by mandatory rules), Backend: [mpl-ph-s17-backend](file:///Users/bok/Documents/GitHub/mpl-ph-s17-backend) — do this FIRST, Frontend: [mpl-intl](file:///Users/bok/Documents/GitHub/mpl-intl), Identity (follow `mpl-ph-s17/identity-rules.md` via `lib/identity.js`), Manual functional verification, [MODIFY] `app/players/[key]/page.js`, [NEW] `app/history/players/[key]/page.js` (+9 more)

### Community 13 - "Nav.js"
Cohesion: 0.10
Nodes (10): metadata, Footer(), HISTORY_LINKS, SOCIALS, STATS_LINKS, I, ICONS, Nav (+2 more)

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
Cohesion: 0.19
Nodes (12): RuneImg(), big(), computeHighlights(), cs(), fmtCC(), LOWER_BETTER, PlayerRow(), PlayerTable() (+4 more)

### Community 20 - "filters.js"
Cohesion: 0.31
Nodes (11): editionOptionLabel(), FilterBar(), GAMES, STAGES, LastUsedCell(), activeFilters(), editionTitle(), effectiveFilters() (+3 more)

### Community 21 - "Separate Current-Tournament vs History — Architecture Split"
Cohesion: 0.12
Nodes (15): dependencies, next, react, react-dom, recharts, @vercel/analytics, name, private (+7 more)

### Community 22 - "Separate Current-Tournament vs History — Architecture Split"
Cohesion: 0.14
Nodes (13): Decisions (locked in with BOK, 2026-07-04), Hard constraints (from repo rules), Phase 1 — Extract view components (NO behavior change)  ✅, Phase 2 — Add `resolveCurrent` + lock the current pages, Phase 3 — Rename /results -> /matches, Phase 4 — Build History parity, Phase 5 — Re-point cross-links + cleanup, Phases (+5 more)

### Community 23 - "TeamStatsTimeline.js"
Cohesion: 0.06
Nodes (55): HeroDetail(), metadata, HistoryPlayerDetail(), HistoryPlayers(), metadata, metadata, PlayersPage(), CurrentTeamDashboard() (+47 more)

### Community 24 - "MatchBreakdown.js"
Cohesion: 0.15
Nodes (12): metadata, HeroBanImg(), ItemImg(), PHOTO_FALLBACK, RoleImg(), fmtTime(), ItemTimings(), PlayerTimingRow() (+4 more)

### Community 25 - "MatchViewer.js"
Cohesion: 0.06
Nodes (39): EARLY_RUNNER_UPS, formatDateRange(), HistoryDashboardClient(), INTL_LOGO_OVERRIDES, intlLogo(), MONTH, parseLocal(), TeamEntity() (+31 more)

### Community 26 - "Security Rules — International Site (`mpl-intl`)"
Cohesion: 0.20
Nodes (9): How data reaches this site (the mental model), Rule 1 — The internal API key stays server-only, Rule 2 — Client components fetch through the proxy, never the backend directly, Rule 3 — The proxy is scoped, read-only, and input-validated, Rule 4 — HTTP response headers, Rule 5 — Environment variables, Rule 6 — Secret-scanning pre-commit hook, Rule 7 — Verify before calling it done (+1 more)

### Community 27 - "Security Rules — International Site (`mpl-intl`)"
Cohesion: 0.22
Nodes (8): Accessibility & Inclusion, Anti-references, Brand Personality, Design Principles, Product, Product Purpose, Register, Users

### Community 28 - "page.js"
Cohesion: 0.20
Nodes (10): big(), COMPARE_STATS, CurrentHeroDashboard(), n(), pct(), PERF_FILTERS, rankAmong(), rankAmongRole() (+2 more)

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
Cohesion: 0.36
Nodes (6): HeroPoint(), HeroScatterChart(), median(), METRICS, Tip(), winColor()

### Community 37 - "pre-commit"
Cohesion: 0.13
Nodes (14): 1. Aggregation principle: recompute from totals, 2.1 KDA, 2.2 Turtle Control %, 2.3 Lord Control %, 2.4 Kill Participation (player), 2.5 Team Kill Participation (team-level), 2.6 Per-minute stats (GPM, DPM, DTPM, Turret Dmg/min), 2.7 Turret Destroyed % (+6 more)

### Community 38 - "loading.js"
Cohesion: 0.18
Nodes (10): Breakpoint scale (the five groups), Core techniques (used everywhere), Current state (audit findings), Out of scope, Phase 0 — Foundations (globals.css + shell), Phase 1 — Current MSC 2026 pages (priority), Phase 2 — History section, Phase 3 — Long tail + polish (+2 more)

### Community 39 - "Hero Class / Specialty / Release Date — mpl-intl rollout plan"
Cohesion: 0.22
Nodes (8): Class never enters stat math, Class ≠ role. Do not conflate., Hero Class / Specialty / Release Date — mpl-intl rollout plan, Maintenance — when a new hero ships, Phase A — backend: expose on the intl routes, Phase B — frontend: mpl-intl UI, Phase C — analytics this unlocks (optional, decide later), What already exists

### Community 40 - "HistoryDashboardClient.js"
Cohesion: 0.16
Nodes (9): getTier(), getWrColor(), HeroCard(), SkeletonHeroGrid(), SkeletonTable(), CurrentHeroStatsView(), numVal(), ROLE_KEYS (+1 more)

### Community 41 - "MatchCard.js"
Cohesion: 0.21
Nodes (9): getPct(), ROLE_ORDER, HeroImg(), PlayerAvatar(), PlayerPhoto(), SynergyTable(), dash(), DraftStatsView() (+1 more)

### Community 42 - "TeamKdaDistribution.js"
Cohesion: 0.10
Nodes (23): BracketView(), computeGeometry(), elbowPath(), FallbackBracket(), LayoutBracket(), LB_ROUNDS, slotToNodeId, UB_ROUNDS (+15 more)

### Community 43 - "MatchCard.js"
Cohesion: 0.25
Nodes (5): FilterSidebar(), ROLES, selStyle, WEEKS, TeamImg()

### Community 44 - "LoadingSkeleton.js"
Cohesion: 0.14
Nodes (13): DraftPage(), metadata, HeroesPage(), metadata, metadata, NationsPage(), DashboardPage(), metadata (+5 more)

### Community 46 - "page.js"
Cohesion: 0.07
Nodes (19): DashboardMainTabs(), DashboardStatsTabs(), MatchResultsGrid(), DashboardView(), fmtHms(), fmtPct(), fmtSec(), PHOTO_FALLBACK (+11 more)

## Knowledge Gaps
- **350 isolated node(s):** `metadata`, `ROLE_KEYS`, `PERF_FILTERS`, `COMPARE_STATS`, `WL_STATS` (+345 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `img` connect `MatchViewer.js` to `MatchViewer.js`, `mpl-intl — Project Instructions`, `MatchResultsGrid.js`, `PlayerLegacy.js`, `MatchCard.js`, `HistoryDashboardClient.js`, `MatchCard.js`, `Nav.js`, `page.js`, `Current-vs-History Identity Enforcement — Audit + Plan`, `PlayerTable.js`, `TeamStatsTimeline.js`, `MatchBreakdown.js`, `page.js`?**
  _High betweenness centrality (0.066) - this node is a cross-community bridge._
- **Why does `api` connect `TeamStatsTimeline.js` to `MLBB International — UI/UX Upgrade Plan (Plan-Only)`, `PlayerLegacy.js`, `MatchCard.js`, `International Team Logos — Liquipedia Scrape Plan`, `page.js`, `Current-vs-History Identity Enforcement — Audit + Plan`, `PlayerTable.js`, `MatchBreakdown.js`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Why does `TeamLogo()` connect `MatchViewer.js` to `MatchResultsGrid.js`, `PlayerLegacy.js`, `MatchCard.js`, `MatchCard.js`, `page.js`, `Current-vs-History Identity Enforcement — Audit + Plan`, `TeamStatsTimeline.js`, `MatchBreakdown.js`, `page.js`?**
  _High betweenness centrality (0.018) - this node is a cross-community bridge._
- **What connects `metadata`, `ROLE_KEYS`, `PERF_FILTERS` to the rest of the system?**
  _350 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `featured.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `MatchViewer.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06201550387596899 - nodes in this community are weakly interconnected._
- **Should `Move Computation to the Backend — Audit + Plan` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._