# Responsive Playbook — MLBB Stats Sites

Reference for making `mpl-intl` and `mpl-ph-s17` responsive across all screen sizes.
Written after completing the full `mpl-intl` responsive pass (2026-07-12).

---

## Breakpoint Scale (use everywhere)

| Token | Range | Devices |
|---|---|---|
| `xs` | 360–479 px | small phones (portrait) |
| `sm` | 480–767 px | large phones / phone landscape |
| `md` | 768–1023 px | tablets |
| `lg` | 1024–1439 px | laptops / desktop — **design baseline** |
| `xl` | ≥1440 px | large monitors |

**Convention — desktop-first:**
```css
@media (max-width: 1023px) { /* md and below */ }
@media (max-width:  767px) { /* sm and below */ }
@media (max-width:  479px) { /* xs only      */ }
@media (min-width: 1440px) { /* xl only       */ }
```

**Minimum supported width: 360 px.**
Usable width at xs = 360 − 2 × 12 px padding = **336 px**.
Any `min-width` or fixed width above 336 px breaks xs layout.

---

## Two-Tier Inline Style Rule

~2000 inline `style={{}}` exist across both sites. **Don't mass-migrate them.**

| Situation | What to do |
|---|---|
| Style can be made intrinsically fluid (`flex-wrap`, `%`, `minmax`, `clamp`, `auto`) | Fix it in place — keep it inline |
| Style **must change at a breakpoint** (stack vs row, resize, hide) | Move to a named class in `globals.css` with media queries |

---

## Technique Catalogue

### 1. Wide tables — horizontal scroll + sticky first column

Every table wider than ~5 columns needs two things:

**a) Scroll wrapper** — add `className="table-wrap"` (or `tbl-wrap`) which already has `overflow: auto`.

**b) Sticky first column** — add `className="tbl-sticky"` alongside the wrapper.

```css
/* globals.css — add once */
.tbl-sticky table > thead > tr > th:first-child,
.tbl-sticky table > tbody > tr > td:first-child {
  position: sticky; left: 0; z-index: 1;
  background: var(--surface2);
  box-shadow: 2px 0 4px rgba(0, 0, 0, 0.3);
}
.tbl-sticky table > thead > tr > th:first-child { z-index: 3; }
.tbl-sticky table > tbody > tr:hover > td:first-child { background: var(--surface); }
```

Usage in JSX:
```jsx
<div className="table-wrap tbl-sticky">
  <table>…</table>
</div>
```

**Column alignment rule (mandatory):** numbers right-align, identity (name/team/hero) left-align — header and cells must match.

### 2. Comparison grids — scroll wrapper + minWidth inner div

Pattern for `gridTemplateColumns: '1fr Npx 1fr'` bars/comparison panels:

```jsx
<div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
  <div style={{ minWidth: 480 }}>  {/* tune to fit content */}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 150px 1fr', … }}>
      …
    </div>
  </div>
</div>
```

### 3. Card grids — use auto-fit/auto-fill

Replace fixed column counts with fluid grids:
```jsx
// Fixed — breaks at xs:
gridTemplateColumns: 'repeat(3, 1fr)'

// Fluid — wraps automatically:
gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))'
```

Pick `minmax(Npx, 1fr)` where N ≤ 336 (xs usable width). If cards need more space, use `minmax(260px, 1fr)` — they stack to 1 col at xs/sm.

### 4. Day-column grids (match schedule) — scroll wrapper

```jsx
// Wrap dynamic column count grids:
<div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
  <div style={{
    display: 'grid',
    gridTemplateColumns: `repeat(${N}, minmax(0, 1fr))`,
    minWidth: N * 220   // each day col needs ~220px for a match row
  }}>
    …
  </div>
</div>
```

### 5. Flex rows that wrap

For any horizontal flex row that might overflow on narrow screens:
```jsx
style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}
```

### 6. SVG charts — use viewBox + width: 100%

```jsx
<svg viewBox="0 0 800 260" style={{ width: '100%', display: 'block' }}>
```

Canvas-based charts: set canvas width from `parentElement.clientWidth` at draw time — already fluid.

Recharts `ResponsiveContainer`: `<ResponsiveContainer width="100%" height={380}>` — already fluid.

### 7. Stacked grid (breakpoint class) for two-panel layouts

When a side-by-side grid must stack at sm:
```css
/* globals.css */
.kda-dist-grid {
  display: grid;
  grid-template-columns: minmax(200px, 240px) 1fr;
  gap: 24px;
  align-items: start;
}
@media (max-width: 767px) {
  .kda-dist-grid { grid-template-columns: 1fr; }
}
```

```jsx
<div className="kda-dist-grid"> … </div>
```

---

## Nav Bar — Dropdown Clipping Bug

**The bug:** `overflow-x: auto` on `.nav` forces the browser to also set `overflow-y: auto` (CSS spec). Absolute-positioned dropdowns inside the nav then get clipped below the bar.

**The fix:** At sm/xs, use icon-only nav so content fits without any overflow. Remove `overflow-x: auto` at those breakpoints.

```css
/* sm/xs: icon-only — content fits, no overflow, dropdowns work */
@media (max-width: 767px) {
  .nav { overflow-x: visible; }
  .nav .brand { display: none; }          /* brand text too wide on phones */
  .navgroup-link span, .navgroup-btn span { display: none; }  /* text labels hidden */
}
```

The nav icons (Home, Swords, BarChart, Clock) + chevrons fit in ~330 px at xs — no scroll needed.

**At md/lg+:** `overflow-x: auto` stays as a safety net. Dropdowns are less of a problem there since the nav rarely overflows at 768 px+.

---

## Container (xl pass)

```css
.container { max-width: 1180px; margin: 0 auto; padding: 0 20px; }
@media (max-width: 767px) { .container { padding: 0 16px; } }
@media (max-width: 479px) { .container { padding: 0 12px; } }
@media (min-width: 1440px) { .container { max-width: 1320px; } }
```

---

## What We Did in mpl-intl (Phase Log)

### Phase 0 — Foundations (globals.css)
- Documented breakpoint scale at top of globals.css
- Migrated stray media queries (860/680/641) onto the 5-breakpoint scale
- `.container`: responsive padding + xl max-width 1320px
- Nav: retune at 767/479 — corrected later with dropdown fix (see above)
- Added `.tbl-sticky` primitive
- `FilterSidebar`: collapses to top strip at ≤767px

### Phase 1 — Current MSC 2026 Pages
**`CurrentTeamDashboard.js`**
- `vs-Opponents` table → `table-wrap tbl-sticky`
- `Draft pool` table → `table-wrap tbl-sticky`
- Comparison panel (1fr 150px 1fr grid + 90px bars) → `overflowX: auto` + `minWidth: 480` wrapper

**`CurrentPlayerDashboard.js`**
- `Hero pool` table → `tbl-wrap tbl-sticky`
- Comparison panel (1fr 160px 1fr grid + player photos) → `overflowX: auto` + `minWidth: 400` wrapper

Other pages (Home/Dashboard, Heroes, Matches, Bracket, Draft):
- Already used fluid grids, ResponsiveContainer, overflowX auto wrappers — no changes needed.

### Phase 2 — History Section
**`globals.css`**
- `.detail-head { flex-wrap: wrap }` — player/team detail header wraps at xs

**`HistoryDashboardClient.js`**
- Tournaments, Teams, Players tables → `table-wrap tbl-sticky`

**`PlayerLegacy.js`**
- By Team, Per Season, Hero Pool, vs Teams, vs Nation tables → `tbl-sticky` class on each scroll wrapper
- Compare section: skipped (no meaningful identity first column for sticky)

### Phase 3 — Long Tail Components
**`TeamKdaDistribution.js`**
- Outer grid (controls | map) → `.kda-dist-grid` CSS class (stacks at sm)
- Inner map+donut grid (`minmax(260px) minmax(200px)`) → `overflowX: auto` + `minWidth: 480` wrapper

**`ObjectiveTimingChart.js`**
- Summary cards: `repeat(3, 1fr)` → `repeat(auto-fit, minmax(220px, 1fr))`
- SVG scatter: already `viewBox` + `width: 100%`
- Filter/legend bars: already `flex-wrap: wrap`

**`MatchResultsGrid.js`**
- GenericMatchesView day-column grid → `overflowX: auto` + `minWidth: days.length * 220`
- WC Group Stage day-column grid → same pattern

**Already responsive (no changes needed):**
`VsTeamsTable` (uses `.tbl-wrap` + `sticky-col-player`),
`BracketBits` (fluid flex columns),
`StatLegend` (`repeat(auto-fill, minmax(240px, 1fr))`),
`BracketView` (`overflowX: auto` already),
`HeroScatterChart` (`ResponsiveContainer`),
`MatchesListView` (`flex-wrap: wrap` filter bar),
`DraftStatsView` (`.filterbar` has `flex-wrap: wrap`).

### Nav Dropdown Fix (hotfix after Phase 3)
- At ≤767px: `overflow-x: visible` + hide brand + hide nav text labels
- Fixes dropdown clipping caused by overflow-x creating a stacking context

---

## Porting to mpl-ph-s17 — Checklist

### Step 1: Foundations (globals.css)

- [ ] Copy the 5-breakpoint scale comment to top of globals.css
- [ ] Audit existing media queries — migrate to the 5-breakpoint values
- [ ] `.container`: add padding overrides at 767/479 and max-width 1320px at 1440
- [ ] Add `.tbl-sticky` primitive (copy from mpl-intl globals.css)
- [ ] Add `.kda-dist-grid` if the PH site has a similar two-panel analytics component
- [ ] Fix nav: add `@media (max-width: 767px) { .nav { overflow-x: visible; } .nav .brand { display: none; } .navgroup-link span, .navgroup-btn span { display: none; } }`
- [ ] FilterSidebar / FilterBar: ensure `flex-wrap: wrap` at ≤767px

### Step 2: Wide Tables

For every table in the PH site, verify it has:
```jsx
<div className="table-wrap tbl-sticky">  {/* or tbl-wrap tbl-sticky */}
  <table>…</table>
</div>
```

Key tables to check:
- [ ] PlayerTable (player stats list)
- [ ] TeamStatsView
- [ ] HeroStatsView
- [ ] DraftStatsView pick/ban table
- [ ] VsTeamsTable
- [ ] Player dashboard: hero pool, vs-teams, per-season
- [ ] Team dashboard: vs-opponents, draft pool

### Step 3: Comparison Panels

Any `gridTemplateColumns: '1fr Npx 1fr'` with bars:
- [ ] Player comparison panel → `overflowX: auto` + `minWidth: 400`
- [ ] Team comparison panel → `overflowX: auto` + `minWidth: 480`

### Step 4: Card Grids

Check every `repeat(N, 1fr)` or `repeat(N, Xpx)` grid:
- [ ] Replace with `repeat(auto-fit, minmax(Mpx, 1fr))` where M ≤ 336
- [ ] Home/dashboard stat strips: add `flex-wrap: wrap`

### Step 5: Charts

- [ ] Every `<svg>`: add `viewBox` and `width: 100%; display: block`
- [ ] Every `<canvas>`: measure parent width on draw, not hardcoded px
- [ ] Every Recharts chart: use `<ResponsiveContainer width="100%">`
- [ ] KDA Distribution: apply `.kda-dist-grid` outer + `overflowX: auto` inner
- [ ] Objective Timing summary cards: `repeat(auto-fit, minmax(220px, 1fr))`

### Step 6: Match / Schedule Grids

- [ ] Any day-column grid with `repeat(N, 1fr)`: add scroll wrapper + `minWidth: N * 220`

### Step 7: Detail-head (player/team hero pages)

```css
/* globals.css */
.detail-head { display: flex; align-items: center; gap: 18px; padding: 28px 0 10px; flex-wrap: wrap; }
```

### Step 8: Verify at All 5 Widths

Open dev server at `:3000` (or whatever port). Check each page at:
- [ ] 360 px — minimum supported
- [ ] 414 px — typical small phone
- [ ] 768 px — tablet
- [ ] 1280 px — laptop
- [ ] 1600 px — large desktop

Checklist per page:
- [ ] No body-level horizontal scroll
- [ ] No overlapping text or images
- [ ] Tables scroll horizontally inside their card (not the whole page)
- [ ] First column of tables stays pinned while scrolling
- [ ] Tap targets ≥ 40 px
- [ ] Dropdowns (nav, filters) fully visible when open

---

## Quick Reference — Most Common Fixes

| Problem | Fix |
|---|---|
| Table overflows on phone | `className="table-wrap tbl-sticky"` on wrapper div |
| Comparison bar grid squishes | Wrap in `overflowX: auto` + inner `minWidth: 480` |
| Card grid only 1 col at lg | `repeat(auto-fit, minmax(260px, 1fr))` |
| Card grid too narrow at xs | Reduce minmax to ≤336px |
| Summary cards overflow at xs | `repeat(auto-fit, minmax(220px, 1fr))` |
| Nav dropdown clipped | Remove `overflow-x: auto` from `.nav`; use icon-only at sm/xs |
| Header row (logo+name+chips) breaks | `flex-wrap: wrap` on the container |
| Two-panel side-by-side crushes on phone | CSS class with `grid-template-columns: 1fr` at ≤767px |
| Day-column match grid overflows | `overflowX: auto` + `minWidth: N * 220` |
| SVG chart overflows | `viewBox` on svg + `width: 100%` style |
