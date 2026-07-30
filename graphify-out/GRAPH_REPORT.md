# Graph Report - mpl-intl  (2026-07-30)

## Corpus Check
- 112 files · ~130,129 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 831 nodes · 1527 edges · 47 communities (43 shown, 4 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 15 edges (avg confidence: 0.58)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `175d210e`
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
- HistoryDashboardClient.js
- MatchCard.js
- TeamKdaDistribution.js
- MatchCard.js
- LoadingSkeleton.js
- page.js
- route.js
- MatchCard.js
- ItemTimings.js
- msc2026MainBracket.js

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
- `HistoryHeroes()` --calls--> `resolveSelection()`  [EXTRACTED]
  app/history/heroes/page.js → lib/featured.js
- `HistoryMatchesPage()` --calls--> `resolveSelection()`  [EXTRACTED]
  app/history/matches/page.js → lib/featured.js
- `HistoryTeams()` --calls--> `resolveSelection()`  [EXTRACTED]
  app/history/teams/page.js → lib/featured.js
- `MatchesPage()` --calls--> `resolveCurrent()`  [EXTRACTED]
  app/matches/page.js → lib/featured.js
- `TeamsPage()` --calls--> `resolveCurrent()`  [EXTRACTED]
  app/teams/page.js → lib/featured.js

## Import Cycles
- None detected.

## Communities (47 total, 4 thin omitted)

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
Nodes (31): apiToMap(), C1_SHADES, C2_SHADES, CAMP_ABBR, campStateAt(), fmtTime(), GOLD_SOURCES, MapReview() (+23 more)

### Community 4 - "Move Computation to the Backend — Audit + Plan"
Cohesion: 0.05
Nodes (35): Architecture Rules — International Site (`mpl-intl`), Enforcement, Known accepted exceptions (as of 2026-07-06), Reference: `eraTeams` vs `teams`, Reference: featured edition & filter resolution, Reference: key `lib/` files, Reference: `tournament_stage`, Reference: two data tiers (+27 more)

### Community 5 - "MatchResultsGrid.js"
Cohesion: 0.60
Nodes (4): getTier(), getWrColor(), HeroCard(), RoleImg()

### Community 6 - "MLBB International — UI/UX Upgrade Plan (Plan-Only)"
Cohesion: 0.11
Nodes (22): avg(), dotRadius(), fmtK(), fmtPct(), fmtTime(), icon(), normSeq(), OBJ_TYPES (+14 more)

### Community 8 - "PlayerLegacy.js"
Cohesion: 0.20
Nodes (10): BracketCol(), QualifiedCol(), SeriesBox(), SubHead(), LAYOUT_LABELS, MatchResultsGrid(), buildSeries(), computeDecider() (+2 more)

### Community 9 - "International Team Logos — Liquipedia Scrape Plan"
Cohesion: 0.22
Nodes (10): buildLines(), CMP_MODES, fmtTime(), MAP_COLORS, PAD, pickScale(), pickYStep(), STAT_CONFIGS (+2 more)

### Community 10 - "Design System: MLBB International"
Cohesion: 0.16
Nodes (14): HistoryMatchesPage(), metadata, MatchesPage(), metadata, FallbackBracket(), GenericMatchesView(), MatchesListView(), STAGES (+6 more)

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

### Community 21 - "Separate Current-Tournament vs History — Architecture Split"
Cohesion: 0.12
Nodes (15): dependencies, next, react, react-dom, recharts, @vercel/analytics, name, private (+7 more)

### Community 22 - "Separate Current-Tournament vs History — Architecture Split"
Cohesion: 0.14
Nodes (13): Decisions (locked in with BOK, 2026-07-04), Hard constraints (from repo rules), Phase 1 — Extract view components (NO behavior change)  ✅, Phase 2 — Add `resolveCurrent` + lock the current pages, Phase 3 — Rename /results -> /matches, Phase 4 — Build History parity, Phase 5 — Re-point cross-links + cleanup, Phases (+5 more)

### Community 23 - "TeamStatsTimeline.js"
Cohesion: 0.07
Nodes (31): HistoryHeroes(), metadata, HistoryPlayerDetail(), HistoryTeams(), metadata, metadata, TeamsPage(), DEFS (+23 more)

### Community 24 - "MatchBreakdown.js"
Cohesion: 0.18
Nodes (11): metadata, BoxScore(), fmtCC(), fmtTime(), MatchBreakdown(), TeamLogo(), big(), n() (+3 more)

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
Cohesion: 0.12
Nodes (14): big(), COMPARE_STATS, CurrentHeroDashboard(), n(), pct(), PERF_FILTERS, rankAmong(), rankAmongRole() (+6 more)

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
Cohesion: 0.23
Nodes (11): EARLY_RUNNER_UPS, formatDateRange(), HistoryDashboardClient(), INTL_LOGO_OVERRIDES, intlLogo(), MONTH, parseLocal(), TeamEntity() (+3 more)

### Community 37 - "pre-commit"
Cohesion: 0.13
Nodes (14): 1. Aggregation principle: recompute from totals, 2.1 KDA, 2.2 Turtle Control %, 2.3 Lord Control %, 2.4 Kill Participation (player), 2.5 Team Kill Participation (team-level), 2.6 Per-minute stats (GPM, DPM, DTPM, Turret Dmg/min), 2.7 Turret Destroyed % (+6 more)

### Community 38 - "loading.js"
Cohesion: 0.18
Nodes (10): Breakpoint scale (the five groups), Core techniques (used everywhere), Current state (audit findings), Out of scope, Phase 0 — Foundations (globals.css + shell), Phase 1 — Current MSC 2026 pages (priority), Phase 2 — History section, Phase 3 — Long tail + polish (+2 more)

### Community 40 - "HistoryDashboardClient.js"
Cohesion: 0.13
Nodes (12): HeroPoint(), HeroScatterChart(), median(), METRICS, Tip(), winColor(), SkeletonHeroGrid(), SkeletonTable() (+4 more)

### Community 41 - "MatchCard.js"
Cohesion: 0.19
Nodes (10): ROLE_ORDER, HeroBanImg(), HeroImg(), PHOTO_FALLBACK, PlayerAvatar(), TeamImg(), SynergyTable(), dash() (+2 more)

### Community 42 - "TeamKdaDistribution.js"
Cohesion: 0.21
Nodes (11): BracketView(), computeGeometry(), elbowPath(), LayoutBracket(), LB_ROUNDS, UB_ROUNDS, getKnockoutLayout(), LAYOUTS (+3 more)

### Community 43 - "MatchCard.js"
Cohesion: 0.22
Nodes (8): M1, M2, M3, M4, M5, M6, M7, MAPS

### Community 44 - "LoadingSkeleton.js"
Cohesion: 0.05
Nodes (56): DraftPage(), metadata, HeroDetail(), HeroesPage(), metadata, HistoryDashboardPage(), metadata, metadata (+48 more)

### Community 46 - "page.js"
Cohesion: 0.06
Nodes (49): big(), card, CareerSection(), COMPARE_ROWS, CompareSection(), d2(), duration(), HeroesSection() (+41 more)

### Community 50 - "ItemTimings.js"
Cohesion: 0.33
Nodes (5): ItemImg(), fmtTime(), ItemTimings(), PlayerTimingRow(), ROLE_ORDER

### Community 51 - "msc2026MainBracket.js"
Cohesion: 0.33
Nodes (5): MAIN_GROUPS, MAIN_QUALIFIER_REFS, MAIN_TREE, refLabel(), resolveMainGroup()

## Knowledge Gaps
- **337 isolated node(s):** `metadata`, `ROLE_KEYS`, `PERF_FILTERS`, `COMPARE_STATS`, `WL_STATS` (+332 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `img` connect `MatchBreakdown.js` to `MatchViewer.js`, `mpl-intl — Project Instructions`, `MatchResultsGrid.js`, `PlayerLegacy.js`, `MatchCard.js`, `HistoryDashboardClient.js`, `LoadingSkeleton.js`, `Nav.js`, `page.js`, `Current-vs-History Identity Enforcement — Audit + Plan`, `MatchCard.js`, `PlayerTable.js`, `TeamStatsTimeline.js`, `MatchViewer.js`, `page.js`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `api` connect `LoadingSkeleton.js` to `MLBB International — UI/UX Upgrade Plan (Plan-Only)`, `MatchCard.js`, `International Team Logos — Liquipedia Scrape Plan`, `page.js`, `Current-vs-History Identity Enforcement — Audit + Plan`, `PlayerTable.js`, `TeamStatsTimeline.js`, `MatchBreakdown.js`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `TeamLogo()` connect `MatchBreakdown.js` to `mpl-intl — Project Instructions`, `PlayerLegacy.js`, `MatchCard.js`, `LoadingSkeleton.js`, `page.js`, `Current-vs-History Identity Enforcement — Audit + Plan`, `MatchCard.js`, `MatchViewer.js`, `page.js`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **What connects `metadata`, `ROLE_KEYS`, `PERF_FILTERS` to the rest of the system?**
  _337 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `featured.js` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._
- **Should `MatchViewer.js` be split into smaller, more focused modules?**
  _Cohesion score 0.06201550387596899 - nodes in this community are weakly interconnected._
- **Should `Move Computation to the Backend — Audit + Plan` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._