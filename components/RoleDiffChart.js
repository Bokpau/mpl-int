'use client';
import { useEffect, useState, useRef } from 'react';

const BLUE = '#4da6ff';
const RED  = '#ff4757';

const W   = 800;
const H   = 220;
const PAD = { left: 64, right: 16, top: 24, bottom: 32 };
const cW  = W - PAD.left - PAD.right;
const cH  = H - PAD.top  - PAD.bottom;

const SCOPES = [
  { key: 'TEAM',      label: 'TEAM' },
  { key: 'GOLD LANE', label: 'GOLD' },
  { key: 'EXP LANE',  label: 'EXP'  },
  { key: 'JUNGLE',    label: 'JGL'  },
  { key: 'MID LANE',  label: 'MID'  },
  { key: 'ROAM',      label: 'ROAM' },
];

const STATS = [
  {
    key:   'gold',
    label: 'GOLD',
    fmt:   n => { const a = Math.abs(n); return a >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(Math.round(n)); },
    scale: m => { const steps = [1000, 2000, 5000, 10000]; return steps.find(s => s >= m) ?? 10000; },
    yStep: s => s > 8000 ? 5000 : s > 4000 ? 2000 : 1000,
  },
  {
    key:   'exp',
    label: 'EXP',
    fmt:   n => { const a = Math.abs(n); return a >= 1000 ? (n / 1000).toFixed(1) + 'K' : String(Math.round(n)); },
    scale: m => { const steps = [1000, 2000, 5000, 10000, 20000, 50000]; return steps.find(s => s >= m) ?? 50000; },
    yStep: s => { const steps = [500, 1000, 2000, 5000, 10000, 20000]; return steps.find(s2 => s / s2 <= 4) ?? 20000; },
  },
  {
    key:   'total_damage',
    label: 'DMG',
    fmt:   n => { const a = Math.abs(n); if (a >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'; if (a >= 1000) return (n / 1000).toFixed(1) + 'K'; return String(Math.round(n)); },
    scale: m => { const steps = [5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000]; return steps.find(s => s >= m) ?? 1000000; },
    yStep: s => { const steps = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000]; return steps.find(s2 => s / s2 <= 4) ?? 200000; },
  },
  {
    key:   'total_hurt',
    label: 'TAKEN',
    fmt:   n => { const a = Math.abs(n); if (a >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'; if (a >= 1000) return (n / 1000).toFixed(1) + 'K'; return String(Math.round(n)); },
    scale: m => { const steps = [5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000]; return steps.find(s => s >= m) ?? 1000000; },
    yStep: s => { const steps = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000]; return steps.find(s2 => s / s2 <= 4) ?? 200000; },
  },
  {
    key:   'control_time_ms',
    label: 'CC',
    fmt:   n => Math.round(Math.abs(n) / 1000) + 's',
    scale: m => { const steps = [5000, 10000, 20000, 30000, 60000, 120000, 300000]; return steps.find(s => s >= m) ?? 300000; },
    yStep: s => s > 120000 ? 60000 : s > 60000 ? 30000 : s > 20000 ? 10000 : 5000,
    fmtAxis: n => Math.round(Math.abs(n) / 1000) + 's',
  },
];

function fmtTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function RoleDiffChart({ battleId, matchEvents = [], mapTime = 0, camp1Code, camp2Code }) {
  const [series, setSeries]     = useState(null);
  const [scope,  setScope]      = useState('TEAM');
  const [statKey, setStatKey]   = useState('gold');
  const [hover,  setHover]      = useState(null);
  const svgRef                  = useRef(null);

  useEffect(() => {
    // Series is pre-aggregated server-side (/role-diff); the chart only renders it.
    fetch(`/api/intl/matches/${battleId}/role-diff`)
      .then(r => r.json())
      .then(d => setSeries(d.series || []))
      .catch(() => setSeries([]));
  }, [battleId]);

  const stat = STATS.find(s => s.key === statKey);

  if (series === null) return (
    <div style={{ padding: '32px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
      Loading…
    </div>
  );
  if (!series.length) return (
    <div style={{ padding: '32px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
      No snapshot data available.
    </div>
  );

  const diffKey  = `${scope}_diff_${statKey}`;
  const blueKey  = `${scope}_blue_${statKey}`;
  const redKey   = `${scope}_red_${statKey}`;

  // Filter to points that have valid data for this scope
  const pts_raw = series.filter(d => d[diffKey] != null);
  if (!pts_raw.length) return (
    <div style={{ padding: '32px 12px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
      No data for this role.
    </div>
  );

  const maxTime = pts_raw[pts_raw.length - 1].game_time;
  const maxAbs  = Math.max(...pts_raw.map(d => Math.abs(d[diffKey])), 1);
  const scale   = stat.scale(maxAbs);

  const xOf   = t => PAD.left + (t / maxTime) * cW;
  const yOf   = d => PAD.top  + cH / 2 - (d / scale) * (cH / 2);
  const zeroY = yOf(0);

  const pts = pts_raw.map(d => ({ x: xOf(d.game_time), y: yOf(d[diffKey]), ...d }));

  const linePath = pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  ).join(' ');

  const areaPath = [
    `M ${xOf(0).toFixed(1)} ${zeroY.toFixed(1)}`,
    ...pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${xOf(maxTime).toFixed(1)} ${zeroY.toFixed(1)}`,
    'Z',
  ].join(' ');

  const maxMin   = Math.floor(maxTime / 60);
  const step     = maxMin > 25 ? 5 : maxMin > 12 ? 2 : 1;
  const minTicks = [];
  for (let m = 0; m <= maxMin; m += step) minTicks.push(m);

  const yTickStep = stat.yStep(scale);
  const yTicks = [];
  for (let g = yTickStep; g <= scale; g += yTickStep) { yTicks.push(g); yTicks.push(-g); }

  const clipAbove = `rdc-above-${battleId}-${scope}-${statKey}`;
  const clipBelow = `rdc-below-${battleId}-${scope}-${statKey}`;

  const handleMouseMove = e => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    if (svgX < PAD.left || svgX > W - PAD.right) { setHover(null); return; }
    const t = ((svgX - PAD.left) / cW) * maxTime;
    const closest = pts.reduce((a, b) =>
      Math.abs(b.game_time - t) < Math.abs(a.game_time - t) ? b : a
    );
    setHover(closest);
  };

  // mapTime indicator x position
  const scrubX = mapTime > 0 && mapTime <= maxTime ? xOf(mapTime) : null;

  return (
    <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* Stat toggle */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {STATS.map(s => (
          <button
            key={s.key}
            onClick={() => { setStatKey(s.key); setHover(null); }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.07em',
              padding: '3px 8px',
              background: statKey === s.key ? 'var(--accent)' : 'var(--surface2)',
              color:      statKey === s.key ? '#000'          : 'var(--muted)',
              border: `1px solid ${statKey === s.key ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer', borderRadius: 2,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Scope toggle */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {SCOPES.map(sc => (
          <button
            key={sc.key}
            onClick={() => { setScope(sc.key); setHover(null); }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.07em',
              padding: '3px 8px',
              background: scope === sc.key ? 'rgba(0,229,255,.15)' : 'var(--surface2)',
              color:      scope === sc.key ? 'var(--accent)'       : 'var(--muted)',
              border: `1px solid ${scope === sc.key ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer', borderRadius: 2,
            }}
          >
            {sc.label}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', alignItems: 'center' }}>
        <span style={{ color: BLUE }}>■ {camp1Code || 'Blue'}</span>
        <span style={{ color: RED  }}>■ {camp2Code || 'Red'}</span>
        {scrubX && <span style={{ color: 'var(--accent)', marginLeft: 'auto' }}>@ {fmtTime(mapTime)}</span>}
      </div>

      {/* Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Role-by-role statistics comparison chart"
      >
        <defs>
          <clipPath id={clipAbove}>
            <rect x={PAD.left} y={PAD.top} width={cW} height={cH / 2} />
          </clipPath>
          <clipPath id={clipBelow}>
            <rect x={PAD.left} y={zeroY} width={cW} height={cH / 2} />
          </clipPath>
        </defs>

        {/* Y grid */}
        {yTicks.map(g => (
          <line key={g} x1={PAD.left} y1={yOf(g).toFixed(1)} x2={W - PAD.right} y2={yOf(g).toFixed(1)}
            stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
        ))}

        {/* Area fills */}
        <path d={areaPath} fill={BLUE} fillOpacity={0.22} clipPath={`url(#${clipAbove})`} />
        <path d={areaPath} fill={RED}  fillOpacity={0.22} clipPath={`url(#${clipBelow})`} />

        {/* Zero line */}
        <line x1={PAD.left} y1={zeroY.toFixed(1)} x2={W - PAD.right} y2={zeroY.toFixed(1)}
          stroke="var(--muted)" strokeWidth={1} />

        {/* Data line */}
        <path d={linePath} stroke="var(--text)" strokeWidth={1.5} fill="none" opacity={0.85} />

        {/* mapTime scrubber */}
        {scrubX != null && (
          <g>
            <line x1={scrubX.toFixed(1)} y1={PAD.top} x2={scrubX.toFixed(1)} y2={H - PAD.bottom}
              stroke="var(--accent)" strokeWidth={1} opacity={0.7} />
          </g>
        )}

        {/* X axis ticks */}
        {minTicks.map(m => {
          const x = xOf(m * 60).toFixed(1);
          return (
            <g key={m}>
              <line x1={x} y1={H - PAD.bottom} x2={x} y2={H - PAD.bottom + 4}
                stroke="var(--muted)" strokeWidth={1} />
              <text x={x} y={H - PAD.bottom + 14}
                textAnchor="middle" fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">
                {m}m
              </text>
            </g>
          );
        })}

        {/* Y axis labels */}
        {yTicks.map(g => (
          <text key={g} x={PAD.left - 6} y={(yOf(g) + 3).toFixed(1)}
            textAnchor="end" fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">
            {g > 0 ? `+${stat.fmt(g)}` : `-${stat.fmt(-g)}`}
          </text>
        ))}
        <text x={PAD.left - 6} y={(zeroY + 3).toFixed(1)}
          textAnchor="end" fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">0</text>

        {/* Hover */}
        {hover && (() => {
          const bv      = hover[blueKey] ?? 0;
          const rv      = hover[redKey]  ?? 0;
          const diff    = hover[diffKey] ?? 0;
          const leading = diff >= 0 ? camp1Code : camp2Code;
          const leadClr = diff >= 0 ? BLUE : RED;
          const abs     = Math.abs(diff);
          const tx = hover.x + 12 > W - 160 ? hover.x - 168 : hover.x + 12;
          const ty = Math.max(PAD.top, Math.min(hover.y - 28, H - PAD.bottom - 58));
          return (
            <g>
              <line x1={hover.x.toFixed(1)} y1={PAD.top} x2={hover.x.toFixed(1)} y2={H - PAD.bottom}
                stroke="var(--text)" strokeWidth={1} strokeDasharray="4 3" opacity={0.45} />
              <circle cx={hover.x.toFixed(1)} cy={hover.y.toFixed(1)} r={4}
                fill={leadClr} stroke="var(--text)" strokeWidth={1.5} />
              <rect x={tx} y={ty} width={156} height={58}
                fill="var(--surface)" stroke="var(--border)" strokeWidth={1} rx={2} />
              <text x={tx + 8} y={ty + 14}
                fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">{fmtTime(hover.game_time)}</text>
              <text x={tx + 8} y={ty + 30}
                fill={leadClr} fontSize={11} fontFamily="var(--font-mono)" fontWeight="700">
                {abs === 0 ? 'Even' : `${leading} +${stat.fmt(abs)}`}
              </text>
              <text x={tx + 8} y={ty + 46}
                fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">
                {stat.fmt(bv)} vs {stat.fmt(rv)}
              </text>
            </g>
          );
        })()}

        {/* Hover capture rect */}
        <rect x={PAD.left} y={PAD.top} width={cW} height={cH} fill="transparent" />
      </svg>
    </div>
  );
}
