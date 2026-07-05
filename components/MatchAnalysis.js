'use client';
import { useState, useMemo } from 'react';
import { HeroImg, TeamImg, RoleImg } from './Images';

const BLUE = '#4da6ff';
const RED  = '#ff4757';
const ROLES = ['EXP LANE', 'JUNGLE', 'MID LANE', 'ROAM', 'GOLD LANE'];
const roleOrder = Object.fromEntries(ROLES.map((r, i) => [r, i]));

// Gold source labels
const GOLD_SOURCES = [
  { key: 'gold_map_1', label: 'Minions',         color: '#66bb6a' },
  { key: 'gold_map_2', label: 'Jungle Creeps',   color: '#26c6da' },
  { key: 'gold_map_3', label: 'Turtle + Lord',   color: '#e8b800' },
  { key: 'gold_map_4', label: 'Turrets',          color: '#42a5f5' },
  { key: 'gold_map_5', label: 'Roam Equip',       color: '#ab47bc' },
  { key: 'gold_map_6', label: 'Kills + Assists',  color: '#ef5350' },
  { key: 'gold_map_9', label: 'Roam Vision',      color: '#78909c' },
];

// PVP stat definitions
const PVP_STATS = [
  { key: 'total_gold',     label: 'Gold',          fmt: v => v?.toLocaleString() },
  { key: 'total_damage',   label: 'Damage',         fmt: v => Math.round(v)?.toLocaleString() },
  { key: 'total_hurt',     label: 'Damage Taken',   fmt: v => Math.round(v)?.toLocaleString() },
  { key: 'total_damage_tower', label: 'Turret Dmg', fmt: v => Math.round(v)?.toLocaleString() },
  { key: 'total_heal',     label: 'Heal',           fmt: v => Math.round(v)?.toLocaleString() },
  { key: 'total_heal_other', label: 'Heal to Ally', fmt: v => Math.round(v)?.toLocaleString() },
  { key: 'control_time_ms', label: 'CC Time',       fmt: v => (v / 1000).toFixed(1) + 's' },
];

// PIE CHART stat options
const PIE_STATS = [
  { key: 'total_gold',    label: 'Gold',         fmt: v => v?.toLocaleString() },
  { key: 'total_damage',  label: 'Damage',        fmt: v => Math.round(v)?.toLocaleString() },
  { key: 'total_hurt',    label: 'Damage Taken',  fmt: v => Math.round(v)?.toLocaleString() },
  { key: 'total_heal',    label: 'Heal',          fmt: v => Math.round(v)?.toLocaleString() },
];

function fmtK(v) {
  if (!v) return '0';
  if (v >= 1000) return (v / 1000).toFixed(1) + 'K';
  return String(v);
}

// ── Dual bar (left=blue, right=red) ──────────────────────────
function DualBar({ aVal, bVal, color = BLUE }) {
  const total = (aVal || 0) + (bVal || 0);
  if (!total) return null;
  const aPct = Math.round((aVal || 0) / total * 100);
  const bPct = 100 - aPct;
  return (
    <div style={{ display: 'flex', height: 20, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
      <div style={{
        width: aPct + '%', background: BLUE,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
        paddingLeft: 6, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#000',
        minWidth: aVal ? 24 : 0, transition: 'width .4s',
      }}>
        {aPct > 15 ? fmtK(aVal) : ''}
      </div>
      <div style={{
        width: bPct + '%', background: RED,
        display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
        paddingRight: 6, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: '#000',
        minWidth: bVal ? 24 : 0, transition: 'width .4s',
      }}>
        {bPct > 15 ? fmtK(bVal) : ''}
      </div>
    </div>
  );
}

// ── SVG Donut Pie Chart ───────────────────────────────────────
function DonutChart({ players, statKey, fmtFn, camp1, camp2 }) {
  const sorted = [...players].sort((a, b) => (roleOrder[a.role_lane] ?? 9) - (roleOrder[b.role_lane] ?? 9));
  const blueTeam = sorted.filter(p => p.campid === 1);
  const redTeam  = sorted.filter(p => p.campid === 2);

  const total = players.reduce((s, p) => s + (parseFloat(p[statKey]) || 0), 0);
  const blueTotal = blueTeam.reduce((s, p) => s + (parseFloat(p[statKey]) || 0), 0);
  const redTotal  = redTeam.reduce((s, p) => s + (parseFloat(p[statKey]) || 0), 0);

  if (!total) return <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 40 }}>No data</div>;

  // Build pie slices: blue team first (campid=1), then red (campid=2)
  const allSlices = [
    ...blueTeam.map(p => ({ ...p, color: BLUE, pct: (parseFloat(p[statKey]) || 0) / total })),
    ...redTeam.map(p  => ({ ...p, color: RED,  pct: (parseFloat(p[statKey]) || 0) / total })),
  ];

  // SVG donut
  const CX = 120, CY = 120, R_OUT = 110, R_IN = 65, GAP = 1.5;
  let angle = -Math.PI / 2;

  const slicePaths = allSlices.map((s, i) => {
    const sweep = s.pct * 2 * Math.PI - (GAP * Math.PI / 180);
    const x1 = CX + R_OUT * Math.cos(angle);
    const y1 = CY + R_OUT * Math.sin(angle);
    const x2 = CX + R_OUT * Math.cos(angle + sweep);
    const y2 = CY + R_OUT * Math.sin(angle + sweep);
    const x3 = CX + R_IN  * Math.cos(angle + sweep);
    const y3 = CY + R_IN  * Math.sin(angle + sweep);
    const x4 = CX + R_IN  * Math.cos(angle);
    const y4 = CY + R_IN  * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;

    // Mid angle for label
    const mid = angle + sweep / 2;
    const lx = CX + (R_IN + (R_OUT - R_IN) / 2) * Math.cos(mid);
    const ly = CY + (R_IN + (R_OUT - R_IN) / 2) * Math.sin(mid);

    const path = `M ${x1} ${y1} A ${R_OUT} ${R_OUT} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${R_IN} ${R_IN} 0 ${large} 0 ${x4} ${y4} Z`;
    angle += sweep + (GAP * Math.PI / 180);

    const pct = Math.round(s.pct * 1000) / 10;
    return { path, lx, ly, pct, player: s, mid };
  });

  // Outer team arcs (thin ring)
  const TEAM_R = R_OUT + 8;
  const bluePct = blueTotal / total;
  const redPct  = 1 - bluePct;

  return (
    <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      {/* SVG */}
      <div style={{ flexShrink: 0 }}>
        <svg width={240} height={240} viewBox="0 0 240 240">
          {slicePaths.map((s, i) => (
            <g key={i}>
              <path d={s.path}
                fill={s.player.campid === 1
                  ? `rgba(${parseInt(BLUE.slice(1,3),16)},${parseInt(BLUE.slice(3,5),16)},${parseInt(BLUE.slice(5,7),16)},${0.5 + s.player.pct * 1.2})`
                  : `rgba(${parseInt(RED.slice(1,3),16)},${parseInt(RED.slice(3,5),16)},${parseInt(RED.slice(5,7),16)},${0.5 + s.player.pct * 1.2})`}
                stroke="var(--surface)" strokeWidth="1.5"
              />
              {/* Role icon at slice midpoint */}
              {s.pct >= 5 && s.player.role_lane && (
                <>
                  <image
                    href={`https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/Role/${encodeURIComponent(s.player.role_lane)}.png`}
                    x={s.lx - 10} y={s.ly - (s.pct >= 10 ? 14 : 10)}
                    width={s.pct >= 10 ? 20 : 16} height={s.pct >= 10 ? 20 : 16}
                    style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,.8))' }}
                  />
                  {s.pct >= 10 && (
                    <text x={s.lx} y={s.ly + 9} textAnchor="middle" dominantBaseline="middle"
                      fill="#fff" fontSize="8" fontFamily="var(--font-mono)" fontWeight="700"
                      style={{ textShadow: '0 1px 2px rgba(0,0,0,.8)' }}>
                      {s.pct}%
                    </text>
                  )}
                </>
              )}
            </g>
          ))}
          {/* Center text */}
          <text x={CX} y={CY - 18} textAnchor="middle" fill="var(--text)" fontSize="16" fontWeight="800" fontFamily="var(--font-display)">
            {fmtK(Math.round(total))}
          </text>
          <text x={CX} y={CY - 2} textAnchor="middle" fill="var(--muted)" fontSize="8" fontFamily="var(--font-mono)">
            TOTAL
          </text>
          {/* Blue % vs Red % */}
          <text x={CX - 2} y={CY + 14} textAnchor="middle" fill="var(--text)" fontSize="10" fontFamily="var(--font-mono)" fontWeight="700">
            <tspan fill={'#4da6ff'}>{total > 0 ? Math.round(blueTotal/total*100) : 0}%</tspan>
            <tspan fill="var(--muted2)"> · </tspan>
            <tspan fill={'#ff4757'}>{total > 0 ? Math.round(redTotal/total*100) : 0}%</tspan>
          </text>
        </svg>
      </div>

      {/* Breakdown lists */}
      <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 0 }}>
        {[
          { team: camp1, players: blueTeam, total: blueTotal, color: BLUE },
          { team: camp2, players: redTeam,  total: redTotal,  color: RED  },
        ].map(({ team, players: tp, total: tt, color }) => (
          <div key={team?.campid} style={{ flex: 1, minWidth: 0 }}>
            {/* Team header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              background: `${color}18`, borderLeft: `3px solid ${color}`,
              padding: '6px 10px', marginBottom: 8,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TeamImg code={team?.team_code} size={20} />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color }}>{team?.team_code}</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color }}>{fmtK(Math.round(tt))}</span>
            </div>
            {/* Player rows */}
            {tp.map(p => {
              const val = parseFloat(p[statKey]) || 0;
              const pct = tt > 0 ? Math.round(val / tt * 100 * 10) / 10 : 0;
              return (
                <div key={p.roleid} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <HeroImg heroid={p.heroid} size={20} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.player_name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{fmtK(Math.round(val))}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2 }}>
                    <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 2, transition: 'width .4s' }} />
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Player vs Player (by role) ────────────────────────────────
function PlayerVsPlayer({ players }) {
  const sorted = [...players].sort((a, b) => (roleOrder[a.role_lane] ?? 9) - (roleOrder[b.role_lane] ?? 9));
  const blue = sorted.filter(p => p.campid === 1);
  const red  = sorted.filter(p => p.campid === 2);
  const pairs = ROLES.map(role => ({
    role,
    a: blue.find(p => p.role_lane === role),
    b: red.find(p  => p.role_lane === role),
  })).filter(pr => pr.a || pr.b);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {pairs.map(({ role, a, b }) => {
        const aGold = a?.total_gold || 0;
        const bGold = b?.total_gold || 0;
        const goldDiff = aGold - bGold;
        const leader = goldDiff > 0 ? 'a' : goldDiff < 0 ? 'b' : null;

        return (
          <div key={role} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            padding: 14, flex: '1 1 220px', maxWidth: 280, minWidth: 220,
          }}>
            {/* Header: role */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RoleImg role={role} size={14} />
              {role}
            </div>

            {/* Player headers */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              {/* Blue player */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, maxWidth: 80 }}>
                <div style={{ borderRadius: '50%', boxShadow: `0 0 0 2.5px ${BLUE}`, overflow: 'hidden', width: 48, height: 48 }}>
                  <HeroImg heroid={a?.heroid} size={48} style={{ display: 'block' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: BLUE, textAlign: 'center' }}>{a?.player_name || '--'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{a?.kill_num}/{a?.dead_num}/{a?.assist_num}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>{aGold.toLocaleString()}</span>
              </div>

              {/* Gold diff */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>VS</span>
                {goldDiff !== 0 && (
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700,
                    color: leader === 'a' ? BLUE : RED,
                  }}>
                    {leader === 'a' ? '▲' : '▼'}{fmtK(Math.abs(goldDiff))}
                  </span>
                )}
              </div>

              {/* Red player */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, maxWidth: 80 }}>
                <div style={{ borderRadius: '50%', boxShadow: `0 0 0 2.5px ${RED}`, overflow: 'hidden', width: 48, height: 48 }}>
                  <HeroImg heroid={b?.heroid} size={48} style={{ display: 'block' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: RED, textAlign: 'center' }}>{b?.player_name || '--'}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{b?.kill_num}/{b?.dead_num}/{b?.assist_num}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>{bGold.toLocaleString()}</span>
              </div>
            </div>

            {/* Stat bars */}
            {PVP_STATS.map(stat => {
              const av = parseFloat(a?.[stat.key]) || 0;
              const bv = parseFloat(b?.[stat.key]) || 0;
              if (!av && !bv) return null;
              return (
                <div key={stat.key} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{stat.label}</span>
                  </div>
                  <DualBar aVal={av} bVal={bv} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Team vs Team Stats Comparison ────────────────────────────
const TEAM_STAT_SECTIONS = [
  {
    label: 'COMBAT',
    rows: [
      { label: 'Kills',   key: 'total_kills'   },
      { label: 'Deaths',  key: 'total_deaths',  lowerBetter: true },
      { label: 'Assists', key: 'total_assists'  },
    ],
  },
  {
    label: 'ECONOMY',
    rows: [
      { label: 'Total Gold', key: 'total_gold',   fmt: v => fmtK(v) },
      { label: 'GPM',        key: 'gold_per_min', fmt: v => v ? Math.round(v) : 0 },
    ],
  },
  {
    label: 'DAMAGE',
    rows: [
      { label: 'Damage Dealt', key: 'total_damage',          fmt: v => fmtK(Math.round(v || 0)) },
      { label: 'DPM',          key: 'damage_dealt_per_min',  fmt: v => v ? Math.round(v) : 0 },
      { label: 'Dmg Taken',    key: 'total_damage_taken',    fmt: v => fmtK(Math.round(v || 0)), lowerBetter: true },
      { label: 'DTPM',         key: 'damage_taken_per_min',  fmt: v => v ? Math.round(v) : 0,   lowerBetter: true },
    ],
  },
  {
    label: 'UTILITY',
    rows: [
      { label: 'Team Heal', key: 'total_heal',           fmt: v => fmtK(Math.round(v || 0)) },
      { label: 'CC Time',   key: 'total_control_time_ms', fmt: v => v ? (v / 1000).toFixed(1) + 's' : '0s' },
    ],
  },
  {
    label: 'OBJECTIVES',
    rows: [
      { label: 'Lords',        key: 'kill_lord'     },
      { label: 'Turtles',      key: 'kill_tortoise' },
      { label: 'Turrets',      key: 'kill_tower'    },
      { label: 'Orange Buff',  key: 'red_buff_num'  },
      { label: 'Purple Buff',  key: 'blue_buff_num' },
    ],
  },
];

function TeamVsTeam({ camp1, camp2 }) {
  if (!camp1 || !camp2) return null;

  return (
    <div>
      {/* Team header */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', gap: 8, alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <TeamImg code={camp1.team_code} size={32} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: BLUE }}>{camp1.team_code}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: BLUE, letterSpacing: '.1em' }}>BLUE SIDE</div>
          </div>
          {camp1.is_winner && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 800, color: '#000', background: 'var(--win)', padding: '2px 8px' }}>WIN</span>}
        </div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', letterSpacing: '.1em' }}>VS</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end', flexDirection: 'row-reverse' }}>
          <TeamImg code={camp2.team_code} size={32} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: RED }}>{camp2.team_code}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: RED, letterSpacing: '.1em' }}>RED SIDE</div>
          </div>
          {camp2.is_winner && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 800, color: '#000', background: 'var(--win)', padding: '2px 8px' }}>WIN</span>}
        </div>
      </div>

      {/* Sections */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {TEAM_STAT_SECTIONS.map(section => (
          <div key={section.label}>
            {/* Section label */}
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.14em',
              color: 'var(--muted)', marginBottom: 10, paddingBottom: 5,
              borderBottom: '1px solid var(--border)',
            }}>
              {section.label}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {section.rows.map(({ label, key, fmt, lowerBetter }) => {
                const aRaw = parseFloat(camp1[key]) || 0;
                const bRaw = parseFloat(camp2[key]) || 0;
                const fa   = fmt ? fmt(camp1[key]) : (camp1[key] ?? 0);
                const fb   = fmt ? fmt(camp2[key]) : (camp2[key] ?? 0);
                const aWins = lowerBetter ? aRaw < bRaw : aRaw > bRaw;
                const bWins = lowerBetter ? bRaw < aRaw : bRaw > aRaw;
                const total = aRaw + bRaw;
                const aPct  = total ? Math.round(aRaw / total * 100) : 50;
                const bPct  = 100 - aPct;

                return (
                  <div key={key} style={{ display: 'grid', gridTemplateColumns: '80px 1fr 80px', gap: 8, alignItems: 'center' }}>
                    {/* Blue value */}
                    <div style={{
                      textAlign: 'right',
                      fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: aWins ? 800 : 400,
                      color: aWins ? BLUE : 'var(--text)',
                    }}>
                      {fa}
                    </div>

                    {/* Bar + label */}
                    <div>
                      <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', letterSpacing: '.06em', marginBottom: 3 }}>
                        {label}
                      </div>
                      {total > 0 ? (
                        <div style={{ display: 'flex', height: 18, borderRadius: 2, overflow: 'hidden', gap: 1 }}>
                          <div style={{
                            width: aPct + '%', background: aWins ? BLUE : `${BLUE}88`,
                            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                            paddingRight: 5, transition: 'width .4s',
                          }} />
                          <div style={{
                            width: bPct + '%', background: bWins ? RED : `${RED}88`,
                            display: 'flex', alignItems: 'center',
                            paddingLeft: 5, transition: 'width .4s',
                          }} />
                        </div>
                      ) : (
                        <div style={{ height: 18, background: 'var(--surface2)', borderRadius: 2 }} />
                      )}
                    </div>

                    {/* Red value */}
                    <div style={{
                      textAlign: 'left',
                      fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: bWins ? 800 : 400,
                      color: bWins ? RED : 'var(--text)',
                    }}>
                      {fb}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Gold Distribution (Role vs Role) ─────────────────────────
function GoldDistribution({ players }) {
  const sorted = [...players].sort((a, b) => (roleOrder[a.role_lane] ?? 9) - (roleOrder[b.role_lane] ?? 9));
  const blue = sorted.filter(p => p.campid === 1);
  const red  = sorted.filter(p => p.campid === 2);

  const pairs = ROLES.map(role => ({
    role,
    a: blue.find(p => p.role_lane === role),
    b: red.find(p  => p.role_lane === role),
  })).filter(pr => pr.a || pr.b);

  return (
    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
      {pairs.map(({ role, a, b }) => {
        const aGold = a?.total_gold || 0;
        const bGold = b?.total_gold || 0;

        return (
          <div key={role} style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            padding: 14, flex: '1 1 220px', maxWidth: 280, minWidth: 220,
          }}>
            {/* Header */}
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <RoleImg role={role} size={14} />
              {role}
            </div>

            {/* Players */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ borderRadius: '50%', boxShadow: `0 0 0 2px ${BLUE}`, overflow: 'hidden', width: 36, height: 36 }}>
                  <HeroImg heroid={a?.heroid} size={36} style={{ display: 'block' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: BLUE }}>{a?.player_name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>{aGold.toLocaleString()}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{a?.gold_per_min ? Math.round(a.gold_per_min) : '--'} GPM</span>
              </div>

              {/* Gold diff arrow */}
              {aGold !== bGold && (
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: aGold > bGold ? BLUE : RED }}>
                    {aGold > bGold ? '◀' : '▶'} {fmtK(Math.abs(aGold - bGold))}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <div style={{ borderRadius: '50%', boxShadow: `0 0 0 2px ${RED}`, overflow: 'hidden', width: 36, height: 36 }}>
                  <HeroImg heroid={b?.heroid} size={36} style={{ display: 'block' }} />
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: RED }}>{b?.player_name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700 }}>{bGold.toLocaleString()}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{b?.gold_per_min ? Math.round(b.gold_per_min) : '--'} GPM</span>
              </div>
            </div>

            {/* Gold source bars */}
            {GOLD_SOURCES.map(src => {
              const av = parseFloat(a?.[src.key]) || 0;
              const bv = parseFloat(b?.[src.key]) || 0;
              if (!av && !bv) return null;
              return (
                <div key={src.key} style={{ marginBottom: 7 }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', marginBottom: 2 }}>{src.label}</div>
                  <DualBar aVal={av} bVal={bv} />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

// ── Main exported component ───────────────────────────────────
export function MatchAnalysis({ players, camp1, camp2 }) {
  const [tab,     setTab]     = useState('team');
  const [pieStat, setPieStat] = useState('total_gold');

  const pieDef = PIE_STATS.find(s => s.key === pieStat) || PIE_STATS[0];

  const TABS = [
    { key: 'team', label: '🆚 Team vs Team' },
    { key: 'pvp',  label: '⚔️ Player vs Player' },
    { key: 'pie',  label: '📊 Team Breakdown' },
    { key: 'gold', label: '💰 Gold Distribution' },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: 11, padding: '8px 16px',
              background: tab === t.key ? 'var(--surface2)' : 'transparent',
              border: 'none',
              borderBottom: `2px solid ${tab === t.key ? 'var(--accent)' : 'transparent'}`,
              color: tab === t.key ? 'var(--accent)' : 'var(--muted)',
              cursor: 'pointer', letterSpacing: '.06em',
              marginBottom: -1,
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Team vs Team */}
      {tab === 'team' && <TeamVsTeam camp1={camp1} camp2={camp2} />}

      {/* Player vs Player */}
      {tab === 'pvp' && <PlayerVsPlayer players={players} />}

      {/* Pie Chart breakdown */}
      {tab === 'pie' && (
        <div>
          {/* Stat selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
            {PIE_STATS.map(s => (
              <button key={s.key} onClick={() => setPieStat(s.key)}
                style={{
                  fontFamily: 'var(--font-mono)', fontSize: 10, padding: '4px 12px',
                  border: `1px solid ${pieStat === s.key ? 'var(--accent)' : 'var(--border)'}`,
                  background: pieStat === s.key ? 'rgba(0,229,255,.1)' : 'transparent',
                  color: pieStat === s.key ? 'var(--accent)' : 'var(--muted)',
                  cursor: 'pointer', borderRadius: 2,
                }}>
                {s.label}
              </button>
            ))}
          </div>
          <DonutChart
            players={players}
            statKey={pieStat}
            fmtFn={pieDef.fmt}
            camp1={camp1}
            camp2={camp2}
          />
        </div>
      )}

      {/* Gold Distribution */}
      {tab === 'gold' && <GoldDistribution players={players} />}
    </div>
  );
}