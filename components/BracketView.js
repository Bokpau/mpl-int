'use client';

import { useMemo } from 'react';
import { getMatchMeta } from '../lib/matchRoundMap';
import { getKnockoutLayout } from '../lib/knockoutBracketLayout';
import { SeriesBox, BracketCol } from './BracketBits';

// Double-elimination bracket view.
//
// Seasons with a static layout in knockoutBracketLayout.js (M1–M7) render as a
// real bracket: Liquipedia column grid, correct slot order, correct top/bottom
// team placement, and SVG connector lines between feeder matches. Series not in
// the layout (data artifacts) are not rendered.
//
// Seasons without a layout fall back to simple stacked round columns.

const BOX_W = 168;   // match box width
const BOX_H = 97;    // nominal match box height (used for line/center math; measured)
const H_GAP = 48;    // horizontal gap between columns (connector channel)
const V_GAP = 16;    // vertical gap between stacked boxes in a round
const HEADER_H = 26; // reserved space for a column's round header
const SECTION_GAP = 30; // gap between UB band and LB band
const PITCH = BOX_H + V_GAP;

// Compute per-slot { x, yCenter } plus canvas size for a season layout.
function computeGeometry(layout) {
  const { shape } = layout;

  // Column index per round id.
  const colOf = {};
  shape.columns.forEach((c, i) => {
    if (c.ub) colOf[c.ub] = i;
    if (c.lb) colOf[c.lb] = i;
    if (c.gf) colOf.gf = i;
  });

  // Vertical center (in row units) per slot, within its section.
  // No feeds → even distribution by slot index; feeds → midpoint of feeders.
  const unit = {};
  const roundIds = Object.keys(shape.rounds);
  for (const rid of roundIds) {
    const r = shape.rounds[rid];
    if (r.section === 'gf') continue;
    for (let i = 0; i < r.size; i++) {
      const feeders = (r.feeds?.[i] || []).filter(Boolean);
      unit[rid + i] = feeders.length
        ? feeders.reduce((sum, f) => sum + unit[f], 0) / feeders.length
        : i;
    }
  }

  const rows = (section) => Math.max(
    ...roundIds.filter(rid => shape.rounds[rid].section === section)
      .map(rid => shape.rounds[rid].size)
  );
  const bandH = (nRows) => HEADER_H + (nRows - 1) * PITCH + BOX_H;
  const ubRows = rows('ub');
  const lbTop = bandH(ubRows) + SECTION_GAP;
  const height = lbTop + bandH(rows('lb')) + 8;

  const pos = {};
  for (const rid of roundIds) {
    const r = shape.rounds[rid];
    if (r.section === 'gf') continue;
    const x = colOf[rid] * (BOX_W + H_GAP);
    const offY = r.section === 'lb' ? lbTop : 0;
    for (let i = 0; i < r.size; i++) {
      pos[rid + i] = { x, yCenter: offY + HEADER_H + unit[rid + i] * PITCH + BOX_H / 2 };
    }
  }
  // Grand Final sits between the two finals, in the last column.
  const [ubFeed, lbFeed] = shape.rounds.gf.feeds[0];
  pos.gf0 = {
    x: colOf.gf * (BOX_W + H_GAP),
    yCenter: (pos[ubFeed].yCenter + pos[lbFeed].yCenter) / 2,
  };

  const width = (colOf.gf + 1) * BOX_W + colOf.gf * H_GAP;
  return { pos, colOf, lbTop, width, height };
}

// L-shaped connector: feeder right edge → mid-channel → target left edge.
function elbowPath(from, to) {
  const x1 = from.x + BOX_W, y1 = from.yCenter;
  const x2 = to.x, y2 = to.yCenter;
  const midX = x1 + (x2 - x1) / 2;
  return `M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`;
}

function LayoutBracket({ layout, series, teamByKey, toggle, active }) {
  const { shape, bo, slots } = layout;
  const { pos, colOf, lbTop, width, height } = useMemo(() => computeGeometry(layout), [layout]);

  const byMc = useMemo(() => {
    const m = {};
    for (const s of series) m[s.match_code] = s;
    return m;
  }, [series]);

  // era-code → team metadata (logo/flag) for SeriesBox.
  const metaByEra = useMemo(() => {
    const m = {};
    for (const s of series) {
      if (s.team_a && s.team_a_key && teamByKey[s.team_a_key]) m[s.team_a] = teamByKey[s.team_a_key];
      if (s.team_b && s.team_b_key && teamByKey[s.team_b_key]) m[s.team_b] = teamByKey[s.team_b_key];
    }
    return m;
  }, [series, teamByKey]);

  // Connector lines from each slot's feeders.
  const paths = [];
  for (const rid of Object.keys(shape.rounds)) {
    const r = shape.rounds[rid];
    if (!r.feeds) continue;
    for (let i = 0; i < r.size; i++) {
      for (const f of r.feeds[i] || []) {
        if (f) paths.push(elbowPath(pos[f], pos[rid + i]));
      }
    }
  }

  const header = (text, x, y) => (
    <div key={`h-${x}-${y}`} style={{
      position: 'absolute', left: x, top: y, width: BOX_W,
      fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted)',
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em',
      textAlign: 'center', whiteSpace: 'nowrap',
    }}>
      {text}
    </div>
  );

  const headers = [];
  shape.columns.forEach((c, i) => {
    const x = i * (BOX_W + H_GAP);
    const label = (rid) => bo?.[rid] ? `${shape.rounds[rid].label} (${bo[rid]})` : shape.rounds[rid].label;
    if (c.ub) headers.push(header(label(c.ub), x, 0));
    if (c.gf) headers.push(header(label('gf'), x, 0));
    if (c.lb) headers.push(header(label(c.lb), x, lbTop));
  });

  const boxes = Object.entries(slots).map(([slotId, slot]) => {
    const s = byMc[slot.mc];
    const p = pos[slotId];
    if (!p) return null;
    // Map DB scores onto the Liquipedia top/bottom display order.
    const topScore = s ? (s.team_a === slot.top ? s.a_wins : s.b_wins) : null;
    const bottomScore = s ? (s.team_a === slot.top ? s.b_wins : s.a_wins) : null;
    const isGf = slotId === 'gf0';
    return (
      <div key={slotId} style={{
        position: 'absolute', left: p.x, top: p.yCenter - BOX_H / 2, width: BOX_W,
        ...(isGf ? { boxShadow: '0 0 0 1px var(--accent)' } : null),
      }}>
        <SeriesBox
          teamMeta={metaByEra}
          aCode={slot.top}    bCode={slot.bottom}
          aScore={topScore}   bScore={bottomScore}
          winner={s?.winner_code}
          scaffold={!s}
          matchCode={s?.match_code}
          open={s ? active === s.match_code : false}
          onToggle={s ? () => toggle(s.match_code) : undefined}
        />
      </div>
    );
  });

  return (
    <div style={{ overflowX: 'auto', padding: '8px 12px 16px' }}>
      <div style={{ position: 'relative', width, height }}>
        <svg width={width} height={height} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} aria-hidden="true">
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="var(--border)" strokeWidth="1.5" />
          ))}
        </svg>
        {headers}
        {boxes}
      </div>
    </div>
  );
}

// ── Fallback: stacked round columns (seasons without a static layout) ───────
const UB_ROUNDS = ['UB Quarter-Final', 'UB Semi-Final', 'UB Final'];
const LB_ROUNDS = ['LB Round 1', 'LB Round 2', 'LB Round 3', 'LB Quarter-Final', 'LB Semi-Final', 'LB Final'];

function FallbackBracket({ series, season, teamByKey, toggle, active }) {
  const metaByEra = useMemo(() => {
    const m = {};
    for (const s of series) {
      if (s.team_a && s.team_a_key && teamByKey[s.team_a_key]) m[s.team_a] = teamByKey[s.team_a_key];
      if (s.team_b && s.team_b_key && teamByKey[s.team_b_key]) m[s.team_b] = teamByKey[s.team_b_key];
    }
    return m;
  }, [series, teamByKey]);

  const byRound = useMemo(() => {
    const map = {};
    for (const s of series) {
      const round = getMatchMeta(season, s.match_code)?.round;
      if (!round) continue;
      (map[round] = map[round] || []).push(s);
    }
    for (const r of Object.keys(map)) {
      map[r].sort((a, b) => String(a.match_code).localeCompare(String(b.match_code)));
    }
    return map;
  }, [series, season]);

  const ubRounds = UB_ROUNDS.filter(r => byRound[r]?.length);
  const lbRounds = LB_ROUNDS.filter(r => byRound[r]?.length);
  const gfSeries = byRound['Grand Final'] || [];

  const boxFor = (s) => (
    <SeriesBox
      key={s.match_code}
      teamMeta={metaByEra}
      aCode={s.team_a}   bCode={s.team_b}
      aScore={s.a_wins}  bScore={s.b_wins}
      winner={s.winner_code}
      matchCode={s.match_code}
      open={active === s.match_code}
      onToggle={() => toggle(s.match_code)}
    />
  );

  const sectionLabel = (text) => (
    <div style={{
      fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--accent)',
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em',
      marginBottom: 10,
    }}>
      {text}
    </div>
  );

  return (
    <div style={{ overflowX: 'auto', padding: '4px 12px 16px' }}>
      <div style={{ minWidth: 'max-content', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {ubRounds.length > 0 && (
          <div>
            {sectionLabel('Upper Bracket')}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {ubRounds.map(round => (
                <div key={round} style={{ width: 168 }}>
                  <BracketCol title={round} series={byRound[round]} renderBox={boxFor} />
                </div>
              ))}
            </div>
          </div>
        )}
        {(lbRounds.length > 0 || gfSeries.length > 0) && (
          <div>
            {sectionLabel('Lower Bracket')}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {lbRounds.map(round => (
                <div key={round} style={{ width: 168 }}>
                  <BracketCol title={round} series={byRound[round]} renderBox={boxFor} />
                </div>
              ))}
              {gfSeries.length > 0 && (
                <div key="gf" style={{ width: 168, marginLeft: 12, borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
                  <BracketCol title="Grand Final" series={gfSeries} renderBox={boxFor} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BracketView({ series, season, teamByKey = {}, toggle, active }) {
  const layout = getKnockoutLayout(season);
  if (layout) {
    return <LayoutBracket layout={layout} series={series} teamByKey={teamByKey} toggle={toggle} active={active} />;
  }
  return <FallbackBracket series={series} season={season} teamByKey={teamByKey} toggle={toggle} active={active} />;
}
