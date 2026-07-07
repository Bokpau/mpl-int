'use client';
import { useState, useMemo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { img, PLACEHOLDER_HERO } from '../lib/images';

/* Win-rate → ring colour (shared thresholds with the rest of the site) */
function winColor(wr) {
  if (wr >= 60) return '#2BD49B';
  if (wr >= 50) return '#FFD700';
  if (wr >= 40) return '#8090C8';
  return '#F0506E';
}

/* Selectable Y metrics. `key` matches the merged hero row fields. */
const METRICS = [
  { key: 'presence', label: 'Presence', color: '#FFD700' },
  { key: 'bans',     label: 'Bans',     color: '#F0506E' },
  { key: 'wins',     label: 'Wins',     color: '#8090C8' },
];

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* Custom point = circular hero portrait with a win-rate ring */
function HeroPoint(props) {
  const { cx, cy, payload, hoveredId, setHoveredId } = props;
  if (cx == null || cy == null || !payload) return null;
  const dimmed = payload.active === false;     // filtered out by search
  const hovered = hoveredId === payload.heroid;
  const r = hovered ? 21 : 16;
  const ring = dimmed ? '#3A3A50' : winColor(payload.win_pct);
  const cid = `hsc-clip-${payload.heroid}`;
  return (
    <g
      style={{ cursor: 'pointer', transition: 'all .12s ease' }}
      onMouseEnter={() => setHoveredId(payload.heroid)}
      onMouseLeave={() => setHoveredId(null)}
    >
      <defs>
        <clipPath id={cid}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>
      </defs>
      {/* drop shadow / backing */}
      <circle cx={cx} cy={cy} r={r + 2} fill="#0F0F1A" opacity={hovered ? 1 : 0.85} />
      {/* portrait */}
      <image
        href={img.hero(payload.heroid) || PLACEHOLDER_HERO}
        x={cx - r}
        y={cy - r}
        width={r * 2}
        height={r * 2}
        clipPath={`url(#${cid})`}
        preserveAspectRatio="xMidYMid slice"
        style={{ filter: dimmed ? 'grayscale(1)' : 'none', opacity: dimmed ? 0.3 : 1 }}
        onError={(e) => { e.target.setAttribute('href', PLACEHOLDER_HERO); }}
      />
      {/* win-rate ring */}
      <circle
        cx={cx} cy={cy} r={r + 1}
        fill="none" stroke={ring}
        strokeWidth={hovered ? 3 : 2}
        opacity={dimmed ? 0.35 : 0.95}
      />
    </g>
  );
}

const Tip = ({ active, payload, metric }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const m = METRICS.find(x => x.key === metric);
  return (
    <div style={{
      background: 'rgba(12,12,22,0.98)',
      border: '1px solid #2A2A50',
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: 12,
      minWidth: 170,
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <img src={img.hero(d.heroid) || PLACEHOLDER_HERO} alt=""
          style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
        <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: '#fff' }}>{d.hero_name}</span>
      </div>
      <Row label="Games" value={d.games} color="#C8C8E0" />
      <Row label={m?.label || metric} value={d[metric]} color={m?.color} bold />
      <Row label="Win Rate" value={`${d.win_pct}%`} color={winColor(d.win_pct)} />
      <div style={{ borderTop: '1px solid #2A2A50', margin: '6px 0 4px' }} />
      <Row label="Bans" value={d.bans} color="#F0506E" />
      <Row label="Presence" value={d.presence} color="#FFD700" />
    </div>
  );
};

const Row = ({ label, value, color, bold }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginTop: 2 }}>
    <span style={{ color: 'var(--muted2)' }}>{label}</span>
    <span style={{ color: color || '#C8C8E0', fontWeight: bold ? 700 : 400 }}>{value}</span>
  </div>
);

/**
 * HeroScatterChart — games (X) vs a togglable draft metric (Y), plotted as
 * hero portraits. Median reference lines split the field into four meta tiers.
 *
 * @param {Array}  data     Merged hero rows: { heroid, hero_name, games, picks,
 *                          bans, presence, wins, win_pct }
 * @param {number} [limit]  Max points to show (top N by the active metric)
 */
export default function HeroScatterChart({ data = [], limit = 30 }) {
  const [metric, setMetric] = useState('presence');
  const [hoveredId, setHoveredId] = useState(null);

  const points = useMemo(() => {
    // Top N by the active metric — chosen independently of search so the axes
    // and median guides stay fixed while searching.
    const top = [...data]
      .filter(d => Number(d.games) > 0)
      .sort((a, b) => (Number(b[metric]) || 0) - (Number(a[metric]) || 0))
      .slice(0, limit);
    // Paint dimmed points first so active (matching) portraits sit on top.
    return top.sort((a, b) => (a.active === false ? 0 : 1) - (b.active === false ? 0 : 1));
  }, [data, metric, limit]);

  const medGames = useMemo(() => median(points.map(p => Number(p.games) || 0)), [points]);
  const medMetric = useMemo(() => median(points.map(p => Number(p[metric]) || 0)), [points, metric]);

  const activeMeta = METRICS.find(m => m.key === metric);

  if (!points.length) return <div style={{ color: 'var(--muted2)', fontSize: 12, padding: 20 }}>// no draft data for this filter</div>;

  return (
    <>
      {/* Metric toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setMetric(m.key)}
            className={`filter-pill${metric === m.key ? ' active' : ''}`}
            style={{ width: 'auto', padding: '4px 12px', fontSize: 11 }}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div role="img" aria-label="Hero draft scatter chart plotting games played against draft presence, bans, or wins">
        <ResponsiveContainer width="100%" height={380}>
          <ScatterChart margin={{ top: 16, right: 24, left: 4, bottom: 28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(42,42,80,0.5)" />
            <XAxis
              type="number" dataKey="games" name="Games"
              tick={{ fill: '#8090C8', fontSize: 10, fontFamily: 'SF Mono, monospace' }}
              axisLine={false} tickLine={false}
              label={{ value: 'GAMES PLAYED', position: 'insideBottom', offset: -14, fill: '#6A6A8C', fontSize: 10, letterSpacing: '0.1em' }}
            />
            <YAxis
              type="number" dataKey={metric} name={activeMeta?.label}
              tick={{ fill: '#8090C8', fontSize: 10, fontFamily: 'SF Mono, monospace' }}
              axisLine={false} tickLine={false}
              label={{ value: (activeMeta?.label || '').toUpperCase(), angle: -90, position: 'insideLeft', offset: 16, fill: '#6A6A8C', fontSize: 10, letterSpacing: '0.1em' }}
            />
            <ZAxis range={[0, 0]} />
            {/* Median quadrant guides */}
            <ReferenceLine x={medGames} stroke="rgba(255,215,0,0.18)" strokeDasharray="4 4" />
            <ReferenceLine y={medMetric} stroke="rgba(255,215,0,0.18)" strokeDasharray="4 4" />
            <Tooltip
              content={<Tip metric={metric} />}
              cursor={{ stroke: 'rgba(255,215,0,0.25)', strokeDasharray: '4 4' }}
            />
            <Scatter
              data={points}
              shape={(p) => <HeroPoint {...p} hoveredId={hoveredId} setHoveredId={setHoveredId} />}
              isAnimationActive={false}
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* Legend: ring colour = win rate */}
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>
        <span>RING = WIN RATE:</span>
        <Swatch c="#2BD49B" t="≥60%" />
        <Swatch c="#FFD700" t="50–59%" />
        <Swatch c="#8090C8" t="40–49%" />
        <Swatch c="#F0506E" t="<40%" />
      </div>
    </>
  );
}

const Swatch = ({ c, t }) => (
  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
    <span style={{ width: 9, height: 9, borderRadius: '50%', border: `2px solid ${c}`, display: 'inline-block' }} />
    {t}
  </span>
);
