'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { api } from '../lib/api';

// Per-minute team stat DIFF (team − opponent) timeline. Ported from the PH site's
// TeamStatsTimeline onto the intl backend endpoint. All aggregation is server-side;
// this only draws. Data exists for rich (MSC 2026) matches only.

const W   = 800;
const H   = 240;
const PAD = { left: 72, right: 20, top: 28, bottom: 36 };
const cW  = W - PAD.left - PAD.right;
const cH  = H - PAD.top  - PAD.bottom;

function fmtK(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(Math.round(n));
}
function fmtSec(n) { return Math.round(n) + 's'; }

const STAT_CONFIGS = {
  gold:   { label: 'Gold',          field: 'gold',   fmt: fmtK,   ySteps: [1000,2000,5000,10000,20000,50000],   scaleSteps: [2000,5000,10000,20000,50000,100000] },
  damage: { label: 'Damage Dealt',  field: 'damage', fmt: fmtK,   ySteps: [5000,10000,20000,50000,100000,200000], scaleSteps: [10000,20000,50000,100000,200000,500000,1000000] },
  taken:  { label: 'Dmg Taken',     field: 'taken',  fmt: fmtK,   ySteps: [5000,10000,20000,50000,100000,200000], scaleSteps: [10000,20000,50000,100000,200000,500000,1000000] },
  cc:     { label: 'CC Time',       field: 'cc',     fmt: fmtSec, ySteps: [5,10,20,30,60,120,300],              scaleSteps: [10,20,30,60,120,300] },
};

const CMP_MODES = [
  { key: 'result',   label: 'Win / Loss'      },
  { key: 'vs_all',   label: 'vs All Teams'    },
  { key: 'side',     label: 'Side'            },
  { key: 'vs_team',  label: 'vs Team'         },
  { key: 'per_game', label: 'Per Game'        },
  { key: 'duration', label: 'Game Length'     },
  { key: 'map',      label: 'Map'             },
];

const MAP_COLORS = {
  'Broken Walls':    '#4da6ff',
  'Dangerous Grass': '#66bb6a',
  'Flying Cloud':    '#ab47bc',
  'Expanding Rivers':'#ffa726',
  'Default Map':     '#90a4ae',
};

function teamColor() { return 'rgba(255,255,255,0.55)'; }

function pickScale(steps, maxAbs) {
  return steps.find(s => s >= maxAbs) ?? steps[steps.length - 1];
}
function pickYStep(steps, scale) {
  const target = scale / 4;
  return steps.find(s => s >= target) ?? steps[steps.length - 1];
}

function buildLines(data, cmpMode, selTeam) {
  if (!data) return [];

  const accent = '#4da6ff';
  const win    = '#4caf50';
  const loss   = '#ef5350';
  const muted  = 'rgba(255,255,255,0.45)';

  switch (cmpMode) {
    case 'result':
      return [
        { key: 'all',    label: 'Average', series: data.by_result?.all    || [], color: accent, dash: '' },
        { key: 'wins',   label: 'Wins',    series: data.by_result?.wins   || [], color: win,    dash: '' },
        { key: 'losses', label: 'Losses',  series: data.by_result?.losses || [], color: loss,   dash: '5 3' },
      ];

    case 'side':
      return [
        { key: 'all',  label: 'Average',   series: data.by_side?.all  || [], color: accent,  dash: '' },
        { key: 'blue', label: 'Blue Side',  series: data.by_side?.blue || [], color: '#4da6ff', dash: '' },
        { key: 'red',  label: 'Red Side',   series: data.by_side?.red  || [], color: '#ff4757', dash: '' },
      ];

    case 'duration':
      return [
        { key: 'short',  label: '< 12 min',    series: data.by_duration?.short  || [], color: '#66bb6a', dash: '' },
        { key: 'medium', label: '12 – 18 min',  series: data.by_duration?.medium || [], color: '#ffa726', dash: '' },
        { key: 'long',   label: '> 18 min',     series: data.by_duration?.long   || [], color: '#ef5350', dash: '' },
      ];

    case 'map':
      return Object.entries(data.by_map || {}).map(([mapName, series]) => ({
        key:    mapName,
        label:  mapName,
        series: series || [],
        color:  MAP_COLORS[mapName] || muted,
        dash:   '',
      }));

    case 'vs_all':
      return Object.entries(data.by_opponent || {}).map(([oppCode, seriesObj]) => ({
        key:    oppCode,
        label:  oppCode,
        series: seriesObj?.all || [],
        color:  teamColor(oppCode),
        dash:   '',
      }));

    case 'vs_team': {
      const oppData = data.by_opponent?.[selTeam];
      if (!oppData) return [];
      return [
        { key: 'all',    label: 'Average', series: oppData.all    || [], color: accent, dash: '' },
        { key: 'wins',   label: 'Wins',    series: oppData.wins   || [], color: win,    dash: '' },
        { key: 'losses', label: 'Losses',  series: oppData.losses || [], color: loss,   dash: '5 3' },
      ];
    }

    case 'per_game': {
      const games = data.by_game?.[selTeam];
      if (!games || !games.length) return [];
      const WIN_SHADES  = ['#4caf50','#66bb6a','#81c784','#a5d6a7'];
      const LOSS_SHADES = ['#ef5350','#e57373','#ef9a9a','#ffcdd2'];
      const winIdx = { n: 0 }, lossIdx = { n: 0 };
      return games.map(game => {
        const isWin   = game.is_winner;
        const palette = isWin ? WIN_SHADES : LOSS_SHADES;
        const idx     = isWin ? winIdx : lossIdx;
        const color   = palette[idx.n % palette.length];
        idx.n++;
        const parts = [];
        if (game.week_number) parts.push(`W${game.week_number}`);
        if (game.day_number)  parts.push(`D${game.day_number}`);
        if (game.game_number) parts.push(`G${game.game_number}`);
        parts.push(isWin ? '(W)' : '(L)');
        return { key: game.battle_id, label: parts.join(' '), series: game.series, color, dash: isWin ? '' : '5 3' };
      });
    }

    default: return [];
  }
}

function fmtTime(m) {
  const min = Math.floor(m);
  const sec = Math.round((m - min) * 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
}

export function TeamStatsTimeline({ teamKey, teamCode, buildQ }) {
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [statKey,    setStatKey]    = useState('gold');
  const [cmpMode,    setCmpMode]    = useState('result');
  const [selTeam,    setSelTeam]    = useState('');
  const [hover,      setHover]      = useState(null);
  const svgRef                      = useRef(null);

  useEffect(() => {
    setLoading(true);
    setData(null);
    api.teamStatsTimeline(teamKey, buildQ())
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [teamKey, buildQ]);

  useEffect(() => {
    if ((cmpMode === 'vs_team' || cmpMode === 'per_game') && data && !selTeam) {
      const opps = Object.keys(data.by_opponent || {});
      if (opps.length) setSelTeam(opps[0]);
    }
  }, [cmpMode, data]);

  const stat  = STAT_CONFIGS[statKey];
  const field = stat.field;

  const lines = useMemo(
    () => buildLines(data, cmpMode, selTeam),
    [data, cmpMode, selTeam]
  );

  const { maxMin, scale, yStep, zeroY, xOf, yOf } = useMemo(() => {
    if (!lines.length) return {};
    const allPts = lines.flatMap(l => l.series.map(d => Math.abs(d[field] ?? 0)));
    const maxAbs = Math.max(...allPts, 1);
    const scale  = pickScale(stat.scaleSteps, maxAbs);
    const yStep  = pickYStep(stat.ySteps, scale);

    const allMins = lines.flatMap(l => l.series.map(d => d.minute));
    const maxMin  = allMins.length ? Math.max(...allMins) : 30;

    const xOf   = m => PAD.left + (m / maxMin) * cW;
    const yOf   = v => PAD.top  + cH / 2 - (v / scale) * (cH / 2);
    const zeroY = yOf(0);

    return { maxMin, scale, yStep, zeroY, xOf, yOf };
  }, [lines, field, stat]);

  const handleMouseMove = e => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !lines.length || !xOf) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    if (svgX < PAD.left || svgX > W - PAD.right) { setHover(null); return; }
    const m = ((svgX - PAD.left) / cW) * maxMin;

    const allPts = lines.flatMap(l => l.series.map(d => d.minute));
    if (!allPts.length) return;
    const closest = allPts.reduce((a, b) => Math.abs(b - m) < Math.abs(a - m) ? b : a);
    setHover(closest);
  };

  if (loading) return (
    <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
      Loading…
    </div>
  );

  const hasData = lines.some(l => l.series.length > 0);

  if (!hasData) return (
    <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
      No realtime snapshot data available.
    </div>
  );

  const minTicks = [];
  const tickStep = maxMin > 25 ? 5 : maxMin > 12 ? 2 : 1;
  for (let m = 0; m <= Math.ceil(maxMin); m += tickStep) minTicks.push(m);

  const yTicks = [];
  for (let g = yStep; g <= scale; g += yStep) { yTicks.push(g); yTicks.push(-g); }

  const opponentKeys = Object.keys(data?.by_opponent || {}).sort();

  return (
    <div>
      {/* Stat filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
        {Object.entries(STAT_CONFIGS).map(([k, cfg]) => (
          <button key={k} onClick={() => { setStatKey(k); setHover(null); }} style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.08em',
            padding: '4px 12px',
            background: statKey === k ? 'var(--accent)' : 'var(--surface2)',
            color:      statKey === k ? '#000'          : 'var(--muted)',
            border: `1px solid ${statKey === k ? 'var(--accent)' : 'var(--border)'}`,
            cursor: 'pointer', borderRadius: 2,
          }}>
            {cfg.label.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Comparison mode filter */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {CMP_MODES.map(m => (
          <button key={m.key} onClick={() => { setCmpMode(m.key); setHover(null); }} style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.08em',
            padding: '4px 10px',
            background: cmpMode === m.key ? 'rgba(255,255,255,0.12)' : 'var(--surface2)',
            color:      cmpMode === m.key ? 'var(--text)'            : 'var(--muted)',
            border: `1px solid ${cmpMode === m.key ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
            cursor: 'pointer', borderRadius: 2,
          }}>
            {m.label.toUpperCase()}
          </button>
        ))}
        {(cmpMode === 'vs_team' || cmpMode === 'per_game') && (
          <select
            value={selTeam}
            onChange={e => { setSelTeam(e.target.value); setHover(null); }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.06em',
              padding: '4px 8px',
              background: 'var(--surface2)', color: 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 2, cursor: 'pointer',
            }}
          >
            {opponentKeys.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {lines.filter(l => l.series.length > 0).map(l => {
          const peakCount = cmpMode === 'per_game'
            ? null
            : Math.max(...l.series.map(d => d.count ?? 0), 0) || null;

          return (
            <span key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 9 }}>
              <svg width={20} height={8}>
                <line x1={0} y1={4} x2={20} y2={4} stroke={l.color} strokeWidth={2} strokeDasharray={l.dash || undefined} />
              </svg>
              <span style={{ color: l.color }}>{l.label}</span>
              {peakCount && (
                <span style={{ color: 'var(--muted)', fontSize: 8 }}>
                  ({peakCount} games)
                </span>
              )}
            </span>
          );
        })}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>
          sampled every 60s · diff = {teamCode} − opp
        </span>
      </div>

      {/* SVG Chart */}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Team statistics timeline line chart"
      >
        {yTicks.map(g => (
          <line key={g}
            x1={PAD.left} y1={yOf(g).toFixed(1)} x2={W - PAD.right} y2={yOf(g).toFixed(1)}
            stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
        ))}

        <line x1={PAD.left} y1={zeroY.toFixed(1)} x2={W - PAD.right} y2={zeroY.toFixed(1)}
          stroke="var(--muted)" strokeWidth={1} />

        {lines.map(l => {
          if (!l.series.length) return null;
          const pts = l.series.map(d => ({ x: xOf(d.minute), y: yOf(d[field] ?? 0), val: d[field] ?? 0, minute: d.minute }));
          const path = pts.map((p, i) => {
            if (i === 0) return `M ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
            const gap = p.minute - pts[i - 1].minute > 1.5;
            return `${gap ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
          }).join(' ');
          return (
            <path key={l.key} d={path} stroke={l.color} strokeWidth={1.5} fill="none"
              strokeDasharray={l.dash || undefined} opacity={l.opacity ?? 0.9} />
          );
        })}

        {minTicks.map(m => {
          const x = xOf(m).toFixed(1);
          return (
            <g key={m}>
              <line x1={x} y1={H - PAD.bottom} x2={x} y2={H - PAD.bottom + 4} stroke="var(--muted)" strokeWidth={1} />
              <text x={x} y={H - PAD.bottom + 14} textAnchor="middle" fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">{m}m</text>
            </g>
          );
        })}

        {yTicks.map(g => (
          <text key={g} x={PAD.left - 6} y={(yOf(g) + 3).toFixed(1)}
            textAnchor="end" fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">
            {g > 0 ? `+${stat.fmt(g)}` : stat.fmt(g)}
          </text>
        ))}
        <text x={PAD.left - 6} y={(zeroY + 3).toFixed(1)}
          textAnchor="end" fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">0</text>

        <text x={10} y={PAD.top + cH / 2} textAnchor="middle" fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)"
          transform={`rotate(-90, 10, ${PAD.top + cH / 2})`}>
          DIFF
        </text>

        {hover !== null && (() => {
          const hx = xOf(hover);
          const linesAtHover = lines
            .map(l => {
              const pt = l.series.find(d => d.minute === hover);
              return pt ? { ...l, val: pt[field] ?? 0, count: pt.count ?? null, y: yOf(pt[field] ?? 0) } : null;
            })
            .filter(Boolean)
            .sort((a, b) => b.val - a.val);

          if (!linesAtHover.length) return null;

          const showCount  = cmpMode !== 'per_game';
          const tooltipW   = showCount ? 180 : 160;
          const tooltipH   = 18 + linesAtHover.length * 16;
          const tx = hx + 12 > W - tooltipW - PAD.right ? hx - tooltipW - 14 : hx + 12;
          const ty = Math.max(PAD.top, Math.min(PAD.top + 8, H - PAD.bottom - tooltipH - 4));

          return (
            <g>
              <line x1={hx.toFixed(1)} y1={PAD.top} x2={hx.toFixed(1)} y2={H - PAD.bottom}
                stroke="var(--text)" strokeWidth={1} strokeDasharray="4 3" opacity={0.35} />
              {linesAtHover.map(l => (
                <circle key={l.key} cx={hx.toFixed(1)} cy={l.y.toFixed(1)} r={3.5}
                  fill={l.color} stroke="var(--surface)" strokeWidth={1.5} />
              ))}
              <rect x={tx} y={ty} width={tooltipW} height={tooltipH}
                fill="var(--surface)" stroke="var(--border)" strokeWidth={1} rx={2} />
              <text x={tx + 8} y={ty + 13} fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">
                {fmtTime(hover)}
              </text>
              {linesAtHover.map((l, i) => (
                <text key={l.key} x={tx + 8} y={ty + 13 + (i + 1) * 16}
                  fill={l.color} fontSize={10} fontFamily="var(--font-mono)" fontWeight="600">
                  {l.label}: {l.val > 0 ? '+' : ''}{stat.fmt(l.val)}
                  {showCount && l.count ? ` (${l.count} games)` : ''}
                </text>
              ))}
            </g>
          );
        })()}

        <rect x={PAD.left} y={PAD.top} width={cW} height={cH} fill="transparent" />
      </svg>
    </div>
  );
}
