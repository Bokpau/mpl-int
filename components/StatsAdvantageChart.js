'use client';
import { useEffect, useState, useRef } from 'react';

const BLUE = '#4da6ff';
const RED  = '#ff4757';
const API  = '';

const ICONS = 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/icons';
const iconUrl = name => `${ICONS}/${name}.png`;

const W   = 800;
const H   = 220;
const PAD = { left: 64, right: 16, top: 24, bottom: 32 };
const cW  = W - PAD.left - PAD.right;
const cH  = H - PAD.top  - PAD.bottom;

// Event strip
const H_EVT   = 112;
const H_TOTAL = H + H_EVT;
const EVT_Y   = { obj: H + 20, tower: H + 44, blueKill: H + 68, redKill: H + 92 };

// ── Stat configs ─────────────────────────────────────────────
function fmtK(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1000)      return (n / 1000).toFixed(1) + 'K';
  return String(Math.round(n));
}
function fmtSec(n) { return Math.round(n) + 's'; }

const STATS = [
  {
    key:     'gold',
    label:   'Gold Diff',
    diffKey: 'gold_diff',
    blueKey: 'blue_gold',
    redKey:  'red_gold',
    fmt:     fmtK,
    yStep:   scale => scale > 8000 ? 5000 : scale > 4000 ? 2000 : 1000,
    scale:   maxAbs => Math.ceil(maxAbs / 1000) * 1000 || 1000,
  },
  {
    key:     'exp',
    label:   'EXP Diff',
    diffKey: 'exp_diff',
    blueKey: 'blue_exp',
    redKey:  'red_exp',
    fmt:     fmtK,
    yStep:   scale => scale > 8000 ? 5000 : scale > 4000 ? 2000 : 1000,
    scale:   maxAbs => Math.ceil(maxAbs / 1000) * 1000 || 1000,
  },
  {
    key:     'damage',
    label:   'Damage Dealt',
    diffKey: 'damage_diff',
    blueKey: 'blue_damage',
    redKey:  'red_damage',
    fmt:     fmtK,
    yStep:   scale => {
      const steps = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
      return steps.find(s => scale / s <= 4) ?? 500000;
    },
    scale:   maxAbs => {
      const steps = [5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
      return steps.find(s => s >= maxAbs) ?? 1000000;
    },
  },
  {
    key:     'taken',
    label:   'Dmg Taken Diff',
    diffKey: 'taken_diff',
    blueKey: 'blue_taken',
    redKey:  'red_taken',
    fmt:     fmtK,
    yStep:   scale => {
      const steps = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000];
      return steps.find(s => scale / s <= 4) ?? 500000;
    },
    scale:   maxAbs => {
      const steps = [5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];
      return steps.find(s => s >= maxAbs) ?? 1000000;
    },
  },
  {
    key:     'cc',
    label:   'CC Time Diff',
    diffKey: 'cc_diff',
    blueKey: 'blue_cc',
    redKey:  'red_cc',
    fmt:     fmtSec,
    yStep:   scale => scale > 120 ? 60 : scale > 60 ? 30 : scale > 20 ? 10 : 5,
    scale:   maxAbs => {
      const steps = [5, 10, 20, 30, 60, 120, 300];
      return steps.find(s => s >= maxAbs) ?? 300;
    },
  },
];

function fmtTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

export function StatsAdvantageChart({ battleId, camp1Code, camp2Code, matchEvents = [] }) {
  const [data, setData]       = useState(null);
  const [statKey, setStatKey] = useState('gold');
  const [hover, setHover]     = useState(null);
  const svgRef                = useRef(null);

  useEffect(() => {
    fetch(`${API}/api/intl/matches/${battleId}/stats-diff`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]));
  }, [battleId]);

  const stat = STATS.find(s => s.key === statKey);

  if (data === null) return (
    <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
      Loading…
    </div>
  );
  if (!data.length) return (
    <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
      No realtime snapshot data available for this match.
    </div>
  );

  const maxTime = data[data.length - 1].game_time;
  const maxAbs  = Math.max(...data.map(d => Math.abs(d[stat.diffKey])), 1);
  const scale   = stat.scale(maxAbs);

  const xOf   = t => PAD.left + (t / maxTime) * cW;
  const yOf   = d => PAD.top  + cH / 2 - (d / scale) * (cH / 2);
  const zeroY = yOf(0);

  const pts = data.map(d => ({ x: xOf(d.game_time), y: yOf(d[stat.diffKey]), ...d }));

  const linePath = pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`
  ).join(' ');

  const areaPath = [
    `M ${xOf(0).toFixed(1)} ${zeroY.toFixed(1)}`,
    ...pts.map(p => `L ${p.x.toFixed(1)} ${p.y.toFixed(1)}`),
    `L ${xOf(maxTime).toFixed(1)} ${zeroY.toFixed(1)}`,
    'Z',
  ].join(' ');

  const maxMin  = Math.floor(maxTime / 60);
  const step    = maxMin > 25 ? 5 : maxMin > 12 ? 2 : 1;
  const minTicks = [];
  for (let m = 0; m <= maxMin; m += step) minTicks.push(m);

  const yTickStep = stat.yStep(scale);
  const yTicks = [];
  for (let g = yTickStep; g <= scale; g += yTickStep) { yTicks.push(g); yTicks.push(-g); }

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

  const clipAbove = `clipAbove-${battleId}-${statKey}`;
  const clipBelow = `clipBelow-${battleId}-${statKey}`;

  // Events
  const evKillHero  = matchEvents.filter(e => e.event_type === 'kill_hero');
  const evKillBoss  = matchEvents.filter(e => e.event_type === 'kill_boss');
  const evKillTower = matchEvents.filter(e => e.event_type === 'kill_tower');
  const objEvents   = [...evKillBoss, ...evKillTower];

  // Hover values
  const blueVal  = hover ? hover[stat.blueKey] : null;
  const redVal   = hover ? hover[stat.redKey]  : null;
  const diffVal  = hover ? hover[stat.diffKey] : null;
  const leadCode = diffVal > 0 ? camp1Code : camp2Code;
  const leadClr  = diffVal > 0 ? BLUE : RED;

  return (
    <div style={{ position: 'relative' }}>

      {/* Filter tabs + legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {STATS.map(s => (
          <button
            key={s.key}
            onClick={() => { setStatKey(s.key); setHover(null); }}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.08em',
              padding: '4px 12px',
              background: statKey === s.key ? 'var(--accent)' : 'var(--surface2)',
              color:      statKey === s.key ? '#000'          : 'var(--muted)',
              border: `1px solid ${statKey === s.key ? 'var(--accent)' : 'var(--border)'}`,
              cursor: 'pointer',
              borderRadius: 2,
            }}
          >
            {s.label.toUpperCase()}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 10, alignItems: 'center' }}>
          <span style={{ color: BLUE }}>■ {camp1Code || 'Blue'}</span>
          <span style={{ color: RED  }}>■ {camp2Code || 'Red'}</span>
          <span style={{ color: 'var(--muted)' }}>sampled every 10s</span>
        </div>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H_TOTAL}`}
        style={{ width: '100%', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label="Team statistics advantage chart"
      >
        <defs>
          <clipPath id={clipAbove}>
            <rect x={PAD.left} y={PAD.top} width={cW} height={cH / 2} />
          </clipPath>
          <clipPath id={clipBelow}>
            <rect x={PAD.left} y={zeroY} width={cW} height={cH / 2} />
          </clipPath>
        </defs>

        {/* Faint vertical lines for objectives */}
        {objEvents.map((ev, i) => {
          const x = xOf(ev.game_time);
          if (x < PAD.left || x > W - PAD.right) return null;
          return (
            <line key={i} x1={x.toFixed(1)} y1={PAD.top} x2={x.toFixed(1)} y2={H - PAD.bottom}
              stroke="rgba(255,255,255,0.08)" strokeWidth={1} strokeDasharray="2 4" />
          );
        })}

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

        {/* X axis ticks */}
        {minTicks.map(m => {
          const x = xOf(m * 60).toFixed(1);
          return (
            <g key={m}>
              <line x1={x} y1={H - PAD.bottom} x2={x} y2={H - PAD.bottom + 4} stroke="var(--muted)" strokeWidth={1} />
              <text x={x} y={H - PAD.bottom + 14} textAnchor="middle" fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">{m}m</text>
            </g>
          );
        })}

        {/* Y axis labels */}
        {yTicks.map(g => (
          <text key={g} x={PAD.left - 6} y={(yOf(g) + 3).toFixed(1)}
            textAnchor="end" fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">
            {g > 0 ? `+${stat.fmt(g)}` : stat.fmt(g)}
          </text>
        ))}
        <text x={PAD.left - 6} y={(zeroY + 3).toFixed(1)}
          textAnchor="end" fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">0</text>

        {/* Hover */}
        {hover && (() => {
          const tx  = hover.x + 12 > W - 160 ? hover.x - 168 : hover.x + 12;
          const ty  = Math.max(PAD.top, Math.min(hover.y - 28, H - PAD.bottom - 58));
          const abs = Math.abs(diffVal);
          return (
            <g>
              <line x1={hover.x.toFixed(1)} y1={PAD.top} x2={hover.x.toFixed(1)} y2={H - PAD.bottom}
                stroke="var(--text)" strokeWidth={1} strokeDasharray="4 3" opacity={0.45} />
              <line x1={hover.x.toFixed(1)} y1={H} x2={hover.x.toFixed(1)} y2={H_TOTAL}
                stroke="var(--text)" strokeWidth={1} strokeDasharray="4 3" opacity={0.2} />
              <circle cx={hover.x.toFixed(1)} cy={hover.y.toFixed(1)} r={4} fill={leadClr} stroke="var(--text)" strokeWidth={1.5} />
              <rect x={tx} y={ty} width={156} height={58} fill="var(--surface)" stroke="var(--border)" strokeWidth={1} rx={2} />
              <text x={tx + 8} y={ty + 14} fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">{fmtTime(hover.game_time)}</text>
              <text x={tx + 8} y={ty + 30} fill={leadClr} fontSize={11} fontFamily="var(--font-mono)" fontWeight="700">
                {abs === 0 ? 'Even' : `${leadCode} +${stat.fmt(abs)}`}
              </text>
              <text x={tx + 8} y={ty + 46} fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">
                {stat.fmt(blueVal)} vs {stat.fmt(redVal)}
              </text>
            </g>
          );
        })()}

        {/* Hover capture */}
        <rect x={PAD.left} y={PAD.top} width={cW} height={cH} fill="transparent" />

        {/* ── EVENT STRIP ── */}
        <line x1={PAD.left} y1={H} x2={W - PAD.right} y2={H} stroke="var(--border)" strokeWidth={1} />

        {/* Row labels */}
        {[
          { y: EVT_Y.obj,      label: 'OBJ',  color: '#e8b800' },
          { y: EVT_Y.tower,    label: 'TWR',  color: 'var(--muted)' },
          { y: EVT_Y.blueKill, label: 'BLUE', color: BLUE },
          { y: EVT_Y.redKill,  label: 'RED',  color: RED  },
        ].map(row => (
          <g key={row.label}>
            <line x1={PAD.left} y1={row.y} x2={W - PAD.right} y2={row.y}
              stroke="var(--border)" strokeWidth={0.5} strokeOpacity={0.5} />
            <text x={PAD.left - 4} y={row.y + 3} textAnchor="end"
              fill={row.color} fontSize={7} fontFamily="var(--font-mono)" fontWeight="700" letterSpacing="0.06em">
              {row.label}
            </text>
          </g>
        ))}

        {/* OBJ — Lord & Turtle icons */}
        {evKillBoss.map((ev, i) => {
          const x      = xOf(ev.game_time);
          if (x < PAD.left || x > W - PAD.right) return null;
          const isLord = ev.boss_name === 'lord';
          const team   = ev.killer_camp === 1 ? 'blue' : 'red';
          const icon   = iconUrl(isLord ? `lord-${team}` : `turtle-${team}`);
          const label  = `${ev.killer_camp === 1 ? camp1Code : camp2Code} ${isLord ? 'Lord' : 'Turtle'} @ ${fmtTime(ev.game_time)}`;
          const s = isLord ? 14 : 13;
          return (
            <g key={i}>
              <title>{label}</title>
              <image href={icon} x={x - s / 2} y={EVT_Y.obj - s / 2} width={s} height={s} />
            </g>
          );
        })}

        {/* TOWER icons */}
        {evKillTower.map((ev, i) => {
          const x    = xOf(ev.game_time);
          if (x < PAD.left || x > W - PAD.right) return null;
          const team  = ev.killer_camp === 1 ? 'blue' : 'red';
          const icon  = iconUrl(`tower-${team}`);
          const label = `${ev.killer_camp === 1 ? camp1Code : camp2Code} destroyed ${ev.tower_name || 'turret'} @ ${fmtTime(ev.game_time)}`;
          const s = 13;
          return (
            <g key={i}>
              <title>{label}</title>
              <image href={icon} x={x - s / 2} y={EVT_Y.tower - s / 2} width={s} height={s} />
            </g>
          );
        })}

        {/* BLUE kills */}
        {evKillHero.filter(e => e.killer_camp === 1).map((ev, i) => {
          const x = xOf(ev.game_time);
          if (x < PAD.left || x > W - PAD.right) return null;
          const s = 12;
          return (
            <g key={i}>
              <title>{`${camp1Code} kill @ ${fmtTime(ev.game_time)}`}</title>
              <image href={iconUrl('kill-blue')} x={x - s / 2} y={EVT_Y.blueKill - s / 2} width={s} height={s} />
            </g>
          );
        })}

        {/* RED kills */}
        {evKillHero.filter(e => e.killer_camp === 2).map((ev, i) => {
          const x = xOf(ev.game_time);
          if (x < PAD.left || x > W - PAD.right) return null;
          const s = 12;
          return (
            <g key={i}>
              <title>{`${camp2Code} kill @ ${fmtTime(ev.game_time)}`}</title>
              <image href={iconUrl('kill-red')} x={x - s / 2} y={EVT_Y.redKill - s / 2} width={s} height={s} />
            </g>
          );
        })}
      </svg>

      {/* Event strip legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 6, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', flexWrap: 'wrap', alignItems: 'center' }}>
        {[
          { icon: 'lord-blue',   label: 'Lord (Blue)'   },
          { icon: 'lord-red',    label: 'Lord (Red)'    },
          { icon: 'turtle-blue', label: 'Turtle (Blue)' },
          { icon: 'turtle-red',  label: 'Turtle (Red)'  },
          { icon: 'tower-blue',  label: 'Tower (Blue)'  },
          { icon: 'tower-red',   label: 'Tower (Red)'   },
          { icon: 'kill-blue',   label: 'Kill (Blue)'   },
          { icon: 'kill-red',    label: 'Kill (Red)'    },
        ].map(({ icon, label }) => (
          <span key={icon} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <img src={iconUrl(icon)} width={14} height={14} alt={label} style={{ display: 'block' }} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
