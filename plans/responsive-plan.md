# Responsive Plan — mpl-intl

Goal: site works cleanly from 360px phones to large desktops. No overlapping
content, no body-level horizontal scroll, hero cards / stat tables / dashboards
scale properly at every width.

Decisions (confirmed with BOK, 2026-07-12):
- Wide tables: **horizontal scroll inside their card + sticky first column**
  (identity column stays pinned). No column hiding.
- Minimum supported width: **360px**.
- Rollout: **current MSC 2026 pages first**, then history, then the rest.
  Plan covers all pages.

---

## Breakpoint scale (the five groups)

| Token | Range | Devices |
|---|---|---|
| `xs` | 360–479px | small phones (portrait) |
| `sm` | 480–767px | large phones / phone landscape |
| `md` | 768–1023px | tablets |
| `lg` | 1024–1439px | laptops / desktop — **current design baseline** |
| `xl` | ≥1440px | large desktop |

Convention: desktop-first overrides — `@media (max-width: 1023px)`,
`(max-width: 767px)`, `(max-width: 479px)`, plus one `(min-width: 1440px)`
for xl. Existing stray breakpoints (860, 680, 640/641) get migrated onto this
scale so the whole site snaps at the same widths.

## Current state (audit findings)

- `app/globals.css` (1711 lines) has only **7 media queries**, at inconsistent
  widths: 860, 680, 640, 641, 1024.
- **~1,956 inline `style={{}}`** across pages/components. Inline styles cannot
  respond to media queries. Heaviest: `CurrentTeamDashboard.js` (245),
  `CurrentPlayerDashboard.js` (170), `CurrentHeroDashboard.js` (148),
  `DraftStatsView.js` (134), `CurrentHeroStatsView.js` (113),
  `MatchViewer.js` (106).
- Many fixed px values inside those inline styles
  (`gridTemplateColumns: '1fr 150px 1fr'`, `width: 90`, `minWidth: 200`) —
  these are what overlap/overflow on phones.
- Card grids in CSS are already fluid (`repeat(auto-fill, minmax(...))`) —
  mostly fine, just need min sizes checked at 360px.
- `.tbl-scroll` (overflow-x wrapper) already exists in globals.css but is only
  used on the match-detail page. Many wide tables are unwrapped.
- `.container` is `max-width: 1180px; padding: 0 20px` at every width.

## Core techniques (used everywhere)

1. **Don't mass-migrate all 1,956 inline styles.** Two-tier rule:
   - Inline style that can be made *intrinsically fluid* (flex-wrap, `%`,
     `minmax`, `clamp()`, `aspect-ratio`) → fix it in place, stays inline.
   - Inline style that must *change at a breakpoint* (stack vs row, hide,
     resize) → move to a class in globals.css with media queries.
   Keeps the diff reviewable.
2. **Table primitive**: one shared pattern —
   `.tbl-scroll` wrapper + new `.tbl-sticky` (first `th`/`td` gets
   `position: sticky; left: 0; background: var(--card)` + right edge shadow).
   Apply to every table wider than ~5 columns. Column alignment rules stay
   untouched (numbers right, identity left — mandatory).
3. **Fluid type/spacing on headers**: page titles and hero-banner numbers use
   `clamp()` so they shrink instead of wrapping badly.
4. **Charts** (`HeroScatterChart`, `ObjectiveTimingChart`,
   `StatsAdvantageChart`, `TeamKdaDistribution`, `RoleDiffChart`,
   `TeamStatsTimeline`): SVG gets `viewBox` + `width: 100%`, container
   measures itself (already client components). No fixed pixel widths.
5. **Verification per page**: preview at 360 / 414 / 768 / 1280 / 1600.
   Checklist: no body horizontal scroll, no overlapping text/images, tap
   targets ≥ 40px, tables scroll with pinned first column, filters usable.

---

## Phase 0 — Foundations (globals.css + shell)

Everything here is site-wide; later phases depend on it.

1. Document the breakpoint scale at the top of globals.css.
2. Migrate the 7 existing media queries (860/680/640/641) onto the scale.
3. `.container`: `padding: 0 20px` → 16px at `md`, 12px at `xs`;
   raise `max-width` to ~1320px at `xl` (review look before keeping).
4. Nav (`components/Nav.js` + `.nav` CSS): keep scrollable-strip approach,
   retune at 767/479 — bigger tap targets, search input shrink, no wrap
   overlap with logo.
5. Add `.tbl-sticky` primitive next to `.tbl-scroll`.
6. Card-grid audit: every `minmax(Npx, 1fr)` checked against 360px viewport
   (360 − 2×12 padding = 336px usable; any min > 336 breaks).
7. `FilterBar` / `FilterSidebar`: sidebar becomes top strip (collapsible)
   under `md`; filter chips wrap.

## Phase 1 — Current MSC 2026 pages (priority)

Per page: apply primitives, convert breakpoint-dependent inline styles to
classes, verify at all 5 widths.

1. **Home** (`app/page.js` + `DashboardView.js`, 94 inline styles):
   stat strips wrap, featured cards stack under `sm`.
2. **Teams list + team dashboard** (`CurrentTeamDashboard.js`, 245 — biggest
   job): header row (logo 64px + name + record chips) stacks under `sm`;
   stat-chip rows `flex-wrap`; comparison grid `'1fr 150px 1fr'` →
   `minmax(0,1fr) auto minmax(0,1fr)` with bar widths in `%`; roster player
   cards already `flex: 1 1 200px` — verify at 360; all wide tables →
   `.tbl-scroll.tbl-sticky`; the 5 Team Data Analysis panels stack to 1
   column under `md`.
3. **Players list + player dashboard** (`CurrentPlayerDashboard.js`, 170 +
   `PlayerTable.js`): same treatment; sidebar-filter layout (ported from PH)
   collapses under `md`; sticky scroll tables verified.
4. **Heroes list + hero dashboard** (`CurrentHeroDashboard.js`, 148 +
   `HeroCard.js`, `CurrentHeroStatsView.js`, 113): hero card grid min size at
   360; scatter chart responsive; pick/ban tables sticky-scroll.
5. **Matches + bracket** (`MatchesListView.js`, `MatchCard.js`, `BracketView.js`,
   `lib/msc2026MainBracket.js` layout): brackets are inherently wide —
   dedicated horizontal-scroll viewport with touch scrolling under `lg`;
   match cards grid already fluid, verify; match viewer/box score
   (`MatchViewer.js`, 106; `BoxScore.js`, `MatchBreakdown.js`,
   `MatchAnalysis.js`, `MapReview.js`, `ItemTimings.js`) — two-column
   summary grid already stacks at 1024, extend same pattern to inner panels.
6. **Draft** (`app/draft/page.js` + `DraftStatsView.js`, 134): draft grids
   stack; pick/ban sequence rows wrap or scroll.

## Phase 2 — History section

1. `HistoryDashboardClient.js` (60) — same dashboard treatment.
2. History players (WC/Main columns w/ per-tournament logos): sticky-scroll;
   footnote wraps.
3. History matches (Phase→Day structure): day headers + match rows stack
   under `sm`.
4. Records (`records/page.js`, 90): record cards grid fluid; category select
   full-width under `sm`.
5. History teams / nations / regions / heroes: list-table pages — mostly
   just `.tbl-scroll.tbl-sticky` + grid audit.
6. Player legacy page (`PlayerLegacy.js`, 94).

## Phase 3 — Long tail + polish

1. Remaining components: `VsTeamsTable`, `TeamKdaDistribution`,
   `ObjectiveTimingChart`, `StatLegend`, `Search` popover (already
   `max-width: 80vw` — verify), `BracketBits`, `MatchResultsGrid`.
2. `xl` pass: decide whether wide screens get wider container or same 1180
   centered.
3. Full-site sweep at the 5 widths; fix stragglers.
4. `graphify update .` + commit per phase (remind BOK to push).

## Out of scope

- No visual redesign — same look, just scales.
- No column hiding / mobile-only table variants (per decision).
- No touch-specific features beyond scroll (no swipe gestures).

## Verification

Each phase ends with a browser pass (dev server :3100, real backend or
local :3001) at 360 / 414 / 768 / 1280 / 1600 on every touched page,
against the checklist in "Core techniques" §5. Identity-checker agent run
is NOT needed unless a change touches player/team names or images (pure
layout changes don't).
