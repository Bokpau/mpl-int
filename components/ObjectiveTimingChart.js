'use client';
import { useEffect, useState, useRef, useMemo } from 'react';
import { api } from '../lib/api';

// Objective (lord / turtle / tower) timing impact scatter. Ported from the PH site
// onto the intl backend endpoint. Server does all aggregation; this only draws.
// Icons come from jsDelivr (architecture Rule 4). Rich (MSC 2026) data only.

const ICONS = 'https://cdn.jsdelivr.net/gh/Bokpau/mlbb-tool@main/icons';
const icon  = n => `${ICONS}/${n}.png`;

const W   = 800;
const H   = 260;
const PAD = { left: 72, right: 24, top: 28, bottom: 36 };
const cW  = W - PAD.left - PAD.right;
const cH  = H - PAD.top  - PAD.bottom;

const SEQ_COLORS = ['#4fc3f7', '#aed581', '#ffd54f', '#ff8a65', '#ba68c8', '#90a4ae'];
const seqColor = seq => SEQ_COLORS[Math.min(seq, SEQ_COLORS.length) - 1];
const seqLabel = seq => seq === 1 ? '1st' : seq === 2 ? '2nd' : seq === 3 ? '3rd' : `${seq}th`;

const WIN  = '#4caf50';
const LOSS = '#ef5350';

const OBJ_TYPES = [
  { key: 'all',      label: 'All'    },
  { key: 'lord',     label: 'Lord'   },
  { key: 'tortoise', label: 'Turtle' },
  { key: 'tower',    label: 'Tower'  },
];

const STAT_CONFIGS = {
  gold:   { label: 'Gold',         field: 'gold_diff',   fmt: fmtK,   scaleSteps: [2000,5000,10000,20000,50000,100000] },
  damage: { label: 'Damage Dealt', field: 'damage_diff', fmt: fmtK,   scaleSteps: [10000,20000,50000,100000,200000,500000,1000000] },
  taken:  { label: 'Dmg Taken',    field: 'taken_diff',  fmt: fmtK,   scaleSteps: [10000,20000,50000,100000,200000,500000,1000000] },
  cc:     { label: 'CC Time',      field: 'cc_diff',     fmt: fmtSec, scaleSteps: [10,20,30,60,120,300] },
};

const RESULT_FILTERS = [
  { key: 'all',    label: 'All'    },
  { key: 'wins',   label: 'Wins'   },
  { key: 'losses', label: 'Losses' },
];

function fmtK(n) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (abs >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return String(Math.round(n));
}
function fmtSec(n) { return Math.round(n) + 's'; }
function fmtTime(s) {
  const m = Math.floor(s / 60), sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

function dotRadius(type) {
  if (type === 'lord')     return 7;
  if (type === 'tortoise') return 6;
  return 4;
}

function pickScale(steps, maxAbs) {
  return steps.find(s => s >= maxAbs) ?? steps[steps.length - 1];
}

function avg(arr, field) {
  const vals = arr.map(e => e[field]).filter(v => v !== undefined && v !== null);
  if (!vals.length) return null;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

const MAX_SEQ_DISPLAY = 6;
const normSeq = seq => Math.min(seq, MAX_SEQ_DISPLAY);

function fmtPct(val) {
  if (val == null) return '—';
  const r = Math.round(val * 100) / 100;
  return Number.isInteger(r) ? r.toFixed(1) + '%' : r.toFixed(2) + '%';
}

export function ObjectiveTimingChart({ teamKey, teamCode, buildQ, totalGames }) {
  const [data,      setData]      = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [objFilter, setObjFilter] = useState('all');
  const [statKey,   setStatKey]   = useState('gold');
  const [resFilter, setResFilter] = useState('all');
  const [seqFilter, setSeqFilter] = useState('all');
  const [hover,     setHover]     = useState(null);
  const svgRef                    = useRef(null);

  useEffect(() => {
    setLoading(true);
    setData(null);
    setSeqFilter('all');
    api.teamObjectiveTiming(teamKey, buildQ())
      .then(d => { setData(Array.isArray(d) ? d : []); setLoading(false); })
      .catch(() => { setData([]); setLoading(false); });
  }, [teamKey, buildQ]);

  const stat = STAT_CONFIGS[statKey];

  const availableSeqs = useMemo(() => {
    if (!data) return [];
    const seqs = new Set(
      data
        .filter(e =>
          (objFilter === 'all' || e.type === objFilter) &&
          (resFilter === 'all' || (resFilter === 'wins' ? e.is_winner : !e.is_winner))
        )
        .map(e => normSeq(e.sequence_num))
    );
    return [...seqs].sort((a, b) => a - b);
  }, [data, objFilter, resFilter]);

  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter(e =>
      (objFilter === 'all' || e.type === objFilter) &&
      (resFilter === 'all' || (resFilter === 'wins' ? e.is_winner : !e.is_winner)) &&
      (seqFilter === 'all' || normSeq(e.sequence_num) === seqFilter)
    );
  }, [data, objFilter, resFilter, seqFilter]);

  const { scale, yStep, xMax, xOf, yOf, zeroY } = useMemo(() => {
    if (!filtered.length) return {};
    const maxAbs = Math.max(...filtered.map(e => Math.abs(e[stat.field])), 1);
    const scale  = pickScale(stat.scaleSteps, maxAbs);
    const yStepCandidates = stat.scaleSteps.map(s => s / 4);
    const yStep  = yStepCandidates.find(s => s * 4 >= scale) ?? scale / 4;

    const maxMin = Math.max(...filtered.map(e => e.minute), 5);
    const xMax   = Math.ceil(maxMin / 5) * 5;

    const xOf  = m => PAD.left + (m / xMax) * cW;
    const yOf  = v => PAD.top  + cH / 2 - (v / scale) * (cH / 2);
    const zeroY = yOf(0);

    return { scale, yStep, xMax, xOf, yOf, zeroY };
  }, [filtered, stat]);

  const handleMouseMove = e => {
    if (!filtered.length || !xOf || !yOf) return;
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const svgX = ((e.clientX - rect.left) / rect.width) * W;
    const svgY = ((e.clientY - rect.top)  / rect.height) * H;

    let closest = null, bestDist = Infinity;
    for (const ev of filtered) {
      const dx = xOf(ev.minute) - svgX;
      const dy = yOf(ev[stat.field]) - svgY;
      const d  = Math.sqrt(dx * dx + dy * dy);
      if (d < bestDist && d < 28) { bestDist = d; closest = ev; }
    }
    setHover(closest);
  };

  const summary = useMemo(() => {
    if (!data) return [];
    const types = [
      { key: 'lord',     label: 'Lord',   icon: 'lord-blue'   },
      { key: 'tortoise', label: 'Turtle', icon: 'turtle-blue' },
      { key: 'tower',    label: 'Tower',  icon: 'tower-blue'  },
    ];
    return types.map(t => {
      const all = data.filter(e => e.type === t.key);
      if (!all.length) return { ...t, count: 0, sequences: [] };

      if (t.key === 'tower') {
        const byGame = {};
        for (const e of all) {
          if (!byGame[e.battle_id]) byGame[e.battle_id] = [];
          byGame[e.battle_id].push(e);
        }
        for (const bid of Object.keys(byGame))
          byGame[bid].sort((a, b) => a.game_time - b.game_time);

        const makeRow = (label, evts, denom) => {
          if (!evts.length) return null;
          const wins   = evts.filter(e =>  e.is_winner);
          const losses = evts.filter(e => !e.is_winner);
          return {
            label,
            count:       evts.length,
            winCount:    wins.length,
            lossCount:   losses.length,
            winRate:     Math.round(wins.length / evts.length * 100),
            securePct:   denom > 0 ? evts.length / denom * 100 : null,
            avgMin:      avg(evts,   'minute'),
            avgDiffWin:  avg(wins,   stat.field),
            avgDiffLoss: avg(losses, stat.field),
          };
        };

        const firstTurretEvts = all.filter(e => e.sequence_num === 1);
        const firstInnerEvts = all.filter(e => e.inner_seq === 1);
        const allNineEvts = Object.values(byGame)
          .filter(evts => evts.length >= 9)
          .map(evts => evts[8]);

        const sequences = [
          makeRow('1st Turret',       firstTurretEvts, totalGames),
          makeRow('1st Inner Turret', firstInnerEvts,  totalGames),
          makeRow('All 9 Turrets',    allNineEvts,     totalGames),
        ].filter(Boolean);

        return { ...t, count: all.length, sequences };
      }

      let gameMaxSeq = null;
      if (t.key === 'lord') {
        gameMaxSeq = {};
        for (const e of all) {
          const bid = e.battle_id;
          if (!gameMaxSeq[bid] || gameMaxSeq[bid] < e.sequence_num)
            gameMaxSeq[bid] = e.sequence_num;
        }
      }

      const bySeq = {};
      for (const e of all) {
        const s = normSeq(e.sequence_num);
        if (!bySeq[s]) bySeq[s] = [];
        bySeq[s].push(e);
      }

      const sequences = Object.entries(bySeq)
        .map(([s, evts]) => {
          const seq    = parseInt(s);
          const wins   = evts.filter(e =>  e.is_winner);
          const losses = evts.filter(e => !e.is_winner);
          const denom  = gameMaxSeq
            ? Object.values(gameMaxSeq).filter(m => m >= seq).length
            : totalGames;
          return {
            seq,
            count:       evts.length,
            winCount:    wins.length,
            lossCount:   losses.length,
            winRate:     Math.round(wins.length / evts.length * 100),
            securePct:   denom > 0 ? evts.length / denom * 100 : null,
            avgMin:      avg(evts,   'minute'),
            avgDiffWin:  avg(wins,   stat.field),
            avgDiffLoss: avg(losses, stat.field),
          };
        })
        .sort((a, b) => a.seq - b.seq);

      return { ...t, count: all.length, sequences };
    });
  }, [data, stat, totalGames]);

  if (loading) return (
    <div style={{ padding: '24px 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>Loading…</div>
  );
  if (!data?.length) return (
    <div style={{ padding: '24px 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>No objective data available.</div>
  );

  const yTicks = [];
  if (scale && yStep) {
    for (let g = yStep; g <= scale; g += yStep) { yTicks.push(g); yTicks.push(-g); }
  }
  const xTicks = [];
  if (xMax) for (let m = 0; m <= xMax; m += 5) xTicks.push(m);

  const visibleSeqs = [...new Set(filtered.map(e => normSeq(e.sequence_num)))].sort((a,b) => a-b);

  const btnStyle = (active) => ({
    fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.08em', padding: '4px 10px',
    background: active ? 'rgba(255,255,255,0.12)' : 'var(--surface2)',
    color:      active ? 'var(--text)'            : 'var(--muted)',
    border:     `1px solid ${active ? 'rgba(255,255,255,0.3)' : 'var(--border)'}`,
    cursor: 'pointer', borderRadius: 2,
  });

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        {Object.entries(STAT_CONFIGS).map(([k, cfg]) => (
          <button key={k} onClick={() => setStatKey(k)} style={{
            fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.08em', padding: '4px 12px',
            background: statKey === k ? 'var(--accent)' : 'var(--surface2)',
            color:      statKey === k ? '#000'          : 'var(--muted)',
            border: `1px solid ${statKey === k ? 'var(--accent)' : 'var(--border)'}`,
            cursor: 'pointer', borderRadius: 2,
          }}>{cfg.label.toUpperCase()}</button>
        ))}

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

        {OBJ_TYPES.map(o => (
          <button key={o.key} onClick={() => { setObjFilter(o.key); setSeqFilter('all'); }}
            style={btnStyle(objFilter === o.key)}>
            {o.label.toUpperCase()}
          </button>
        ))}

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

        {RESULT_FILTERS.map(r => (
          <button key={r.key} onClick={() => setResFilter(r.key)} style={btnStyle(resFilter === r.key)}>
            {r.label.toUpperCase()}
          </button>
        ))}

        <div style={{ width: 1, height: 18, background: 'var(--border)', margin: '0 4px' }} />

        <button onClick={() => setSeqFilter('all')} style={btnStyle(seqFilter === 'all')}>ALL</button>
        {availableSeqs.map(s => (
          <button key={s} onClick={() => setSeqFilter(s)} style={{
            ...btnStyle(seqFilter === s),
            borderColor: seqFilter === s ? seqColor(s) : undefined,
            color:       seqFilter === s ? seqColor(s) : undefined,
          }}>
            {s === MAX_SEQ_DISPLAY ? `${s}TH+` : seqLabel(s).toUpperCase()}
          </button>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 9, alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)' }}>
          <svg width={14} height={14}><circle cx={7} cy={7} r={7} fill="var(--muted)" opacity={0.4} /></svg>
          Lord
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)' }}>
          <svg width={12} height={12}><circle cx={6} cy={6} r={6} fill="var(--muted)" opacity={0.4} /></svg>
          Turtle
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--muted)' }}>
          <svg width={8} height={8}><rect x={0} y={0} width={8} height={8} fill="var(--muted)" opacity={0.4} /></svg>
          Tower
        </span>

        <div style={{ width: 1, height: 14, background: 'var(--border)' }} />

        {visibleSeqs.map(s => (
          <span key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width={10} height={10}><circle cx={5} cy={5} r={5} fill={seqColor(s)} /></svg>
            <span style={{ color: seqColor(s) }}>
              {s === MAX_SEQ_DISPLAY ? `${s}th+` : seqLabel(s)}
            </span>
          </span>
        ))}

        <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>
          diff = {teamCode} − opp at moment of securing · boss seq = game-wide, tower seq = team kills
        </span>
      </div>

      {/* Scatter plot */}
      {filtered.length > 0 && scale ? (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', display: 'block', overflow: 'visible', cursor: 'crosshair' }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
          role="img"
          aria-label="Objective timing scatter chart"
        >
          {yTicks.map(g => (
            <line key={g} x1={PAD.left} y1={yOf(g).toFixed(1)} x2={W - PAD.right} y2={yOf(g).toFixed(1)}
              stroke="var(--border)" strokeWidth={0.5} strokeDasharray="3 3" />
          ))}

          <line x1={PAD.left} y1={zeroY.toFixed(1)} x2={W - PAD.right} y2={zeroY.toFixed(1)}
            stroke="var(--muted)" strokeWidth={1} />

          {filtered.map((ev, i) => {
            const cx    = xOf(ev.minute);
            const cy    = yOf(ev[stat.field]);
            const r     = dotRadius(ev.type);
            const color = seqColor(normSeq(ev.sequence_num));
            const isHov = hover === ev;
            const baseOpacity = ev.is_winner ? 0.75 : 0.45;

            if (ev.type === 'tower') {
              return (
                <rect key={i}
                  x={(cx - r).toFixed(1)} y={(cy - r).toFixed(1)}
                  width={r * 2} height={r * 2}
                  fill={color} opacity={isHov ? 1 : baseOpacity}
                  stroke={isHov ? '#fff' : ev.is_winner ? WIN : LOSS}
                  strokeWidth={isHov ? 1.5 : 0.8}
                />
              );
            }
            return (
              <circle key={i} cx={cx.toFixed(1)} cy={cy.toFixed(1)} r={r}
                fill={color} opacity={isHov ? 1 : baseOpacity}
                stroke={isHov ? '#fff' : ev.is_winner ? WIN : LOSS}
                strokeWidth={isHov ? 1.5 : 0.8}
              />
            );
          })}

          {xTicks.map(m => {
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

          {hover && (() => {
            const hx      = xOf(hover.minute);
            const tx      = hx + 12 > W - 170 ? hx - 178 : hx + 12;
            const hy      = yOf(hover[stat.field]);
            const ty      = Math.max(PAD.top, Math.min(hy - 28, H - PAD.bottom - 84));
            const val     = hover[stat.field];
            const typeLabel = hover.type === 'lord'     ? 'Lord'
                            : hover.type === 'tortoise' ? 'Turtle'
                            : `Tower${hover.tower_name ? ` (${hover.tower_name})` : ''}`;
            const ns       = normSeq(hover.sequence_num);
            const seqStr   = ns === MAX_SEQ_DISPLAY ? `${ns}th+` : seqLabel(ns);
            const col      = seqColor(ns);
            return (
              <g>
                <line x1={hx.toFixed(1)} y1={PAD.top} x2={hx.toFixed(1)} y2={H - PAD.bottom}
                  stroke="var(--text)" strokeWidth={1} strokeDasharray="4 3" opacity={0.3} />
                <rect x={tx} y={ty} width={172} height={84}
                  fill="var(--surface)" stroke="var(--border)" strokeWidth={1} rx={2} />
                <text x={tx + 8} y={ty + 14} fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">
                  {typeLabel} · {fmtTime(hover.game_time)}
                </text>
                <text x={tx + 8} y={ty + 30} fontSize={10} fontFamily="var(--font-mono)" fontWeight="700">
                  <tspan fill={col}>{seqStr}</tspan>
                  <tspan fill="var(--muted)"> · </tspan>
                  <tspan fill={hover.is_winner ? WIN : LOSS}>{hover.is_winner ? 'WIN' : 'LOSS'}</tspan>
                </text>
                <text x={tx + 8} y={ty + 47} fill={val >= 0 ? WIN : LOSS} fontSize={12} fontFamily="var(--font-mono)" fontWeight="700">
                  {val > 0 ? '+' : ''}{stat.fmt(val)}
                </text>
                <text x={tx + 8} y={ty + 63} fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">
                  Gold diff: {hover.gold_diff > 0 ? '+' : ''}{fmtK(hover.gold_diff)}
                </text>
                <text x={tx + 8} y={ty + 77} fill="var(--muted)" fontSize={9} fontFamily="var(--font-mono)">
                  Dmg diff: {hover.damage_diff > 0 ? '+' : ''}{fmtK(hover.damage_diff)}
                </text>
              </g>
            );
          })()}

          <rect x={PAD.left} y={PAD.top} width={cW} height={cH} fill="transparent" />
        </svg>
      ) : (
        <div style={{ padding: '24px 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
          No data for this filter.
        </div>
      )}

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 20 }}>
        {summary.map(s => {
          if (!s.count) return null;
          if (!['lord', 'tortoise', 'tower'].includes(s.key)) return null;
          return (
            <div key={s.key} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                <img src={icon(s.icon)} width={16} height={16} alt="" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>
                  {s.label}
                </span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginLeft: 'auto' }}>
                  {s.count} total
                </span>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: `${s.key === 'tower' ? '90px' : '54px'} 22px 40px 36px 36px 1fr 1fr`,
                gap: 4, marginBottom: 4, paddingBottom: 4,
                borderBottom: '1px solid var(--border)',
                fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '.06em',
              }}>
                <span></span>
                <span style={{ textAlign: 'right' }}>#</span>
                <span style={{ textAlign: 'right', color: 'var(--accent)' }}>G%</span>
                <span style={{ textAlign: 'right' }}>WR%</span>
                <span style={{ textAlign: 'right' }}>AVG</span>
                <span style={{ textAlign: 'right', color: WIN }}>W AVG</span>
                <span style={{ textAlign: 'right', color: LOSS }}>L AVG</span>
              </div>

              {s.sequences.map((sq) => {
                const isTower = s.key === 'tower';
                const col     = isTower ? 'var(--accent)' : seqColor(sq.seq);
                const rowLabel = isTower
                  ? sq.label
                  : `${sq.seq === MAX_SEQ_DISPLAY ? `${sq.seq}th+` : seqLabel(sq.seq)} ${s.label}`;
                const minStr  = sq.avgMin !== null
                  ? `${Math.floor(sq.avgMin)}:${String(Math.round((sq.avgMin % 1) * 60)).padStart(2,'0')}`
                  : '—';
                const wrColor = sq.winRate >= 60 ? WIN : sq.winRate <= 40 ? LOSS : 'var(--text)';
                return (
                  <div key={isTower ? sq.label : sq.seq} style={{
                    display: 'grid', gridTemplateColumns: `${isTower ? '90px' : '54px'} 22px 40px 36px 36px 1fr 1fr`,
                    gap: 4, alignItems: 'baseline',
                    padding: '3px 0',
                    borderBottom: '1px solid var(--border)',
                    fontFamily: 'var(--font-mono)', fontSize: 9,
                  }}>
                    <span style={{ color: col, fontWeight: 700, fontSize: isTower ? 8 : 9 }}>
                      {rowLabel}
                    </span>
                    <span style={{ color: 'var(--text)', textAlign: 'right', fontSize: 9 }}>
                      {sq.count}
                    </span>
                    <span style={{ color: 'var(--accent)', textAlign: 'right', fontWeight: 700, fontSize: 9 }}>
                      {fmtPct(sq.securePct)}
                    </span>
                    <span style={{ color: wrColor, textAlign: 'right', fontWeight: 700, fontSize: 9 }}>
                      {sq.winRate}%
                    </span>
                    <span style={{ color: 'var(--muted)', textAlign: 'right', fontSize: 9 }}>
                      {minStr}
                    </span>
                    <span style={{ color: WIN, textAlign: 'right', fontSize: 9 }}>
                      {sq.avgDiffWin !== null
                        ? `${sq.avgDiffWin > 0 ? '+' : ''}${stat.fmt(Math.round(sq.avgDiffWin))}`
                        : <span style={{ color: 'var(--muted)' }}>—</span>}
                      {sq.winCount > 0 && <span style={{ color: 'var(--muted)', fontSize: 8 }}> ({sq.winCount})</span>}
                    </span>
                    <span style={{ color: LOSS, textAlign: 'right', fontSize: 9 }}>
                      {sq.avgDiffLoss !== null
                        ? `${sq.avgDiffLoss > 0 ? '+' : ''}${stat.fmt(Math.round(sq.avgDiffLoss))}`
                        : <span style={{ color: 'var(--muted)' }}>—</span>}
                      {sq.lossCount > 0 && <span style={{ color: 'var(--muted)', fontSize: 8 }}> ({sq.lossCount})</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
