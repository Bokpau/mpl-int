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
    minWidth: N * 280   // each day col needs ~280px for a match row
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

### 7. Card-level horizontal scroll for multi-column grids inside cards

When a `display: grid` section is inside a card that has `overflow: hidden` (for border-radius clipping), you cannot scroll at the card boundary — the grid gets squeezed and content clips silently. The fix: add a scroll container INSIDE the card, wrapping the sections that need more width.

```jsx
<div className="match-card">  {/* overflow: hidden */}
  {/* flex-wrap sections above — don't need scroll */}
  
  {/* Scroll container for fixed-width grid sections */}
  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
    <div style={{ minWidth: 420 }}>  {/* tune to fit content */}
      {/* score row (1fr auto 1fr grid) */}
      {/* game rows grid */}
    </div>
  </div>
</div>
```

The `overflow: hidden` on the card clips the scroll container's LAYOUT SIZE (matches card width), not the content inside it. The inner `overflow-x: auto` scroll container handles its overflowing children independently. No conflict.

**Correction (2026-07-12):** an earlier version of this section compacted the rightmost column's button at mobile (`padding: 4px 4px; font-size: 8px`) to squeeze a 5-column desktop grid into one row. That directly contradicts the Step 8 "tap targets ≥ 40px" checklist below — don't do this. See Technique 9 for the fix that replaced it.

### 8. Stacked grid (breakpoint class) for two-panel layouts

When a side-by-side grid must stack at sm:
```css
/* globals.css — see Technique 7 above for matching CSS */
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

### 9. Restack instead of squeeze — dense multi-column grids with per-side content

A grid like `.game-row` (32px num | 156px team-A picks | 1fr time | 156px team-B picks | 90px detail) has a real desktop min-width (~500px). Shrinking every column proportionally at mobile (forcing icons to 20px, compacting buttons to 4px padding) still doesn't fit, and produces overlap or sub-40px tap targets — the actual failure mode behind the match-details popover bug (2026-07-12).

The fix: restack into rows that don't compete for the same horizontal space, using CSS Grid `grid-template-areas` (base columns/areas stay for desktop; override both at the breakpoint):

```css
@media (max-width: 767px) {
  .game-row {
    grid-template-columns: repeat(12, 1fr);
    grid-template-areas:
      "num num center center center center center center detail detail detail detail"
      "home home home home home home away away away away away away";
    row-gap: 8px;
  }
  .game-row__num { grid-area: num; }
  .game-row__center { grid-area: center; min-width: 0; }
  .game-row__detail-btn { grid-area: detail; }        /* full-size tap target, not shrunk */
  .game-row__picks-container.home { grid-area: home; justify-content: flex-end; }
  .game-row__picks-container.away { grid-area: away; justify-content: flex-start; }
}
```

Row 1 (num/time/detail) gets a full row to itself — no competition, no shrinking needed. Row 2 puts both teams' picks side by side, each getting half the row's width instead of a sixth of a 5-column grid. A per-side element (like a WIN badge) that used absolute positioning at fixed pixel offsets on desktop needs to switch to normal in-flow positioning (append/prepend it in the DOM so `justify-content: flex-end`/`flex-start` carries it to the inner seam) — absolute offsets tied to a fixed desktop width break the moment the column becomes fluid.

**Column budget still matters.** Restacking buys width, but content (5 hero icons + a badge) can still overflow its half-row if sized for desktop. Measure the actual pixel need (`icons × size + gaps + badge`) against the real available width per side before shipping — don't assume restacking alone is sufficient.

---

## Nav Bar — Dropdown Clipping Bug

**The bug:** `overflow-x: auto` on `.nav` forces the browser to also set `overflow-y: auto` (CSS spec). Absolute-positioned dropdowns inside the nav then get clipped below the bar.

**The fix:** At sm/xs, use icon-only nav so content fits without any overflow. Remove `overflow-x: auto` at those breakpoints.

```css
/* sm/xs: two-row nav — brand on own row, icon-only items + search below */
@media (max-width: 767px) {
  :root { --nav-h: 96px; }
  .nav { overflow-x: visible; height: auto; flex-wrap: wrap; padding: 8px 16px; gap: 4px 12px; }
  .nav .brand { flex: 0 0 100%; }           /* brand fills row 1 */
  .navgroup-link span, .navgroup-btn span { display: none; }  /* icon-only row 2 */
  /* pin dropdown to viewport so it can't overflow right edge on phones */
  .dropdown { position: fixed; left: 12px; right: 12px; top: calc(var(--nav-h) + 4px); min-width: 0; }
}
```

Brand shows on row 1 (full width). Icons+search fit row 2 without overflow. Dropdown uses `position: fixed` so it spans viewport width and can never clip off the right edge regardless of which button opened it.

**At md/lg+:** `overflow-x: auto` stays. Dropdowns rarely overflow at 768px+ since the nav has room for all items with text labels.

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
- **Correction (2026-07-12):** this covered the Matches *list* page only. The match-details popover (`MatchCard.js`) and the match-detail sub-route (`MatchViewer.js`, `ItemTimings.js`, `MatchAnalysis.js`, `MatchBreakdown.js`) were never audited here and had real breaks — see Phase 4.

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
- GenericMatchesView day-column grid → `overflowX: auto` + `minWidth: days.length * 280`
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

### Phase 4 — Match Detail Rescue (2026-07-12)
The match-detail sub-route and match-details popover were never covered by Phases 0–3 (see correction under Phase 1) and had real overlap/clipping bugs, not just tightness.

**`MatchViewer.js`**
- Outer 3-col grid (map | events | stats) → `.match-viewer-grid` class, stacks to 1 col at ≤1023px; side panels get `max-height` instead of the JS-synced fixed height once stacked
- `TeamStatsView`'s `TS_COLS` scoreboard → `overflowX: auto` + `minWidth: 420` wrapper

**`ItemTimings.js`**
- Two-team grid → `.item-timings-grid` class, stacks to 1 col at ≤767px

**`MatchAnalysis.js`**
- `TeamVsTeam` header (`1fr 160px 1fr`) → `.team-vs-team-header` class, stacks at ≤479px

**`MatchBreakdown.js`**
- Draft picks/bans grid (`1fr 1fr`) → `.draft-teams-grid` class, stacks at ≤479px
- Masthead team rows (`display:flex, justify-content:center`, no wrap) → `.masthead-teams`/`.masthead-side` classes; this was silently clipping the home team's code off the left edge at mobile (unsafe-centering overflow, not caught by any prior audit pass) — stacks to 3 rows at ≤479px
- **Team codes are never truncated with ellipsis, even under pressure.** A first pass added `min-width: 0` + `text-overflow: ellipsis` to the team-code text, which "fixed" the overflow by silently rendering `MGLZ` as `M...` — a truncated code isn't a shorter code, it's a wrong one. Reverted: the code keeps `white-space: nowrap` and its natural width; `.masthead-teams` stacking (≤479px) and the popover's own scroll wrapper (see below) absorb the tight cases instead. If a fixed-width team-code display is ever this tight again, shrink something else (logo size, score digit size) or let the row scroll — never truncate the code itself.

**`MatchResultsGrid.js` + `MatchCard.js` (match-details popover)**
- Root cause of the popover overlap bug: the desktop `.game-row` grid (32px | 156px picks | 1fr | 156px picks | 90px detail, ~500px real minimum) had a mobile override that shrunk icons and pushed the WIN badge to negative pixel offsets, but never actually fit — badges overlapped icons, "DETAIL →" clipped to "DET"
- Fixed with Technique 9 (restack, see above): `.game-row` now uses `grid-template-areas` at ≤767px — num/time/detail on row 1, both teams' picks together on row 2, badge back in normal flow instead of absolute-positioned
- `.match-card-scroll`/`.match-card-inner` replaced the old inline `overflowX`/`minWidth: 420` (was undersized against the real desktop minimum; now `480` and `0` at ≤767 since the row no longer needs horizontal scroll once restacked)
- Modal chrome: `.match-modal-backdrop`/`.match-modal-box`/`.match-modal-body` classes, `90dvh` instead of `90vh` (iOS URL bar), tighter padding at ≤479px
- Same team-code rule applies to the score row here (`MatchCard.js`): no ellipsis on `aEra`/`bEra` — natural width + `white-space: nowrap`, with `.match-card-scroll`'s horizontal scroll as the pressure valve if it's ever genuinely too tight

### Phase 5 — Hero Dashboard (2026-07-12)
**`CurrentHeroDashboard.js`**
- Draft Synergy 3-table grid (`1fr 1fr 1fr`) → `repeat(auto-fit, minmax(260px, 1fr))`
- 4-stat headline strip (`repeat(4, 1fr)`, JS-index border logic) → `.hero-headline-stats` class; border dividers driven by `nth-child` so the 2×2 wrap at ≤479px doesn't leave an orphaned border on column 2
- Game Log table: already had correct custom 2-column sticky (Match + Player, matching `th`/`td` classes) — a prior audit pass flagged this as missing `tbl-sticky`; that was a false positive, no fix needed
- Filter sidebar → new `layout="bar"` prop on `FilterSidebar.js` (default `"sidebar"` unchanged for `CurrentPlayerDashboard`/`CurrentHeroStatsView`), reusing the `.filterbar`/`.filter-group` shell already established by `FilterBar.js`. Not a responsive bug fix — the 200px sticky rail wasn't broken, just vertically wasteful for 4–5 short filter groups; converting to a wrapping horizontal row reclaimed the whole column on desktop and read cleaner on mobile too

### Phase 6 — Compare tabs + stragglers (2026-07-12)
**`CurrentPlayerDashboard.js`**
- "Unique & Shared Heroes" 3-col grid → `overflowX: auto` + `minWidth: 420` wrapper (same technique as the sibling comparison panel above it, which already had this)
- Win vs Loss stat row (`1fr 140px 1fr`) → `.wl-stat-row` class, narrows center column at ≤479px. Narrowing the grid track alone wasn't enough — the value cells also needed `min-width: 0` + ellipsis, otherwise a long percentage (`85.91%`) still overflowed its shrunk track even though the track itself measured correctly
- Compare-role `<select>` → `min-width: 0`. Native selects default to `min-width: auto` inside a flex row, sizing to their widest `<option>` text (a long player name) regardless of `flex: 1` — this forced the whole page 19px wider until fixed
- Side-stripe cleanup (banned per DESIGN.md): masthead `borderLeft: 4px`, WIN/LOSS cards' `borderLeft`/`borderRight: 3px` → `borderTop: 2px` instead, and the Game Log row's per-row `borderLeft: 3px` win/loss indicator removed outright (redundant with the existing text "Result" column)

**`RegionsView.js`** — H2H matrix → added `tbl-sticky`
**`history/records/page.js`** — records table → added `tbl-sticky`
**`ObjectiveTimingChart.js`** — event-detail grid (Lord/Turtle/Turret sequence rows inside each summary card) → `overflowX: auto` + `minWidth: 340` wrapper

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

- [ ] Any day-column grid with `repeat(N, 1fr)`: add scroll wrapper + `minWidth: N * 280`

### Step 6b: Match Detail Page + Popover

mpl-intl's match-detail sub-route and match-details popover shipped un-audited through Phases 0–3 and had the worst bugs of the whole pass (overlap, clipped text, off-screen masthead text) — see Phase 4 in the log above before assuming these are fine on the PH side just because Phase 0–3 didn't flag them there either. The PH site has the equivalent components (map viewer, item timings, team-vs-team analysis, draft breakdown, match card / popover) — check each by name if they share the port, or by shape if renamed:

- [ ] Map/events/stats 3-col layout: stacks to 1 col by ~1024px, not just shrinks
- [ ] Any fixed-column scoreboard grid inside it: scroll wrapper, not squeeze
- [ ] Item timings / two-team side-by-side grids: stack at ≤767px
- [ ] Team-vs-team comparison headers (`1fr Npx 1fr`): stack at ≤479px, not just scroll
- [ ] Draft picks/bans grid: stack at ≤479px
- [ ] Match masthead (team code + flag + logo row): check for `justify-content: center` with no `flex-wrap` and no `min-width: 0` on the flex children — this is the exact bug that clipped the home team's name off-screen in mpl-intl; add `min-width: 0` + ellipsis and a stacked mobile fallback
- [ ] Match card / popover game rows: if there's a fixed multi-column grid with per-side content (picks + a win indicator), don't shrink-and-squeeze it at mobile — restack per Technique 9. Measure the actual content width need (icon size × count + gaps + badge) against the real available width before shipping a fix, not just after

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
| Day-column match grid overflows | `overflowX: auto` + `minWidth: N * 280` |
| SVG chart overflows | `viewBox` on svg + `width: 100%` style |
| Dense multi-column grid still overflows after shrinking | Restack with `grid-template-areas` (Technique 9), don't keep squeezing |
| Side-stripe accent border on a card | Replace with `borderTop` (2px) — side-stripes are banned per DESIGN.md |
| `<select>` or flex child forces its row wider than the viewport | Add `min-width: 0` — flex/grid items default to `min-width: auto` (content-based), not 0 |
| Grid track sized correctly but its content still overflows | The track itself isn't enough — add `min-width: 0` + `overflow: hidden`/ellipsis to the cell's inner content too — **but not on identity codes** (see next row) |
| Team code / short identity string is tight | **Never ellipsis it** — `M...` for `MGLZ` is a wrong code, not a shorter one. Use `white-space: nowrap` + natural width, and let a stack breakpoint or scroll wrapper absorb the pressure instead |
