'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { HeroImg, PlayerPhoto, RoleImg, SkillImg, RuneImg, ItemImg } from './Images';

const BLUE = '#4da6ff';
const RED = '#ff4757';

function fmtCC(ms) {
  if (!ms) return '--';
  const s = ms / 1000;
  return (Number.isInteger(s) ? s.toFixed(1) : s.toFixed(2)) + 's';
}

function big(n) {
  return n ? Math.round(n).toLocaleString() : '--';
}

const ROLES = ['EXP LANE', 'JUNGLE', 'MID LANE', 'ROAM', 'GOLD LANE'];
const roleOrder = Object.fromEntries(ROLES.map((r, i) => [r, i]));
const sortP = arr => [...arr].sort((a, b) => (roleOrder[a.role_lane] ?? 9) - (roleOrder[b.role_lane] ?? 9));

const STAT_KEYS = [
  'kill_num', 'dead_num', 'assist_num', 'computed_kda', 'kill_participation',
  'total_gold', 'gold_pct', 'gold_per_min',
  'total_damage', 'damage_dealt_pct', 'damage_dealt_per_min',
  'total_hurt', 'damage_taken_per_min',
  'total_heal', 'total_heal_other', 'control_time_ms',
];
const LOWER_BETTER = new Set(['dead_num', 'total_hurt', 'damage_taken_per_min']);

function computeHighlights(allPlayers) {
  const hi = {}, lo = {};
  for (const key of STAT_KEYS) {
    const vals = allPlayers.map(p => parseFloat(p[key]) || 0).filter(v => v > 0);
    if (!vals.length) continue;
    hi[key] = Math.max(...vals);
    lo[key] = Math.min(...vals);
  }
  return { hi, lo };
}

function cs(key, val, hi, lo) {
  const n = parseFloat(val);
  if (!n || !hi[key] || hi[key] === lo[key]) {
    return {
      textAlign: 'center',
      padding: '4px 6px',
      fontFamily: 'var(--font-mono)',
      borderLeft: '2px solid transparent'
    };
  }
  const lb = LOWER_BETTER.has(key);
  const isHi = n === hi[key];
  const isLo = n === lo[key];
  const isBest = lb ? isLo : isHi;
  const isWorst = lb ? isHi : isLo;

  if (isBest) {
    return {
      textAlign: 'center',
      padding: '4px 6px',
      fontFamily: 'var(--font-mono)',
      borderLeft: '2px solid var(--win)',
      fontWeight: 600
    };
  }
  if (isWorst) {
    return {
      textAlign: 'center',
      padding: '4px 6px',
      fontFamily: 'var(--font-mono)',
      color: 'var(--loss)',
      borderLeft: '2px solid transparent'
    };
  }
  return {
    textAlign: 'center',
    padding: '4px 6px',
    fontFamily: 'var(--font-mono)',
    borderLeft: '2px solid transparent'
  };
}

function HeroCircle({ heroid, campid, size = 36 }) {
  const ring = campid === 1 ? BLUE : campid === 2 ? RED : 'var(--border)';
  return (
    <div style={{ flexShrink: 0, borderRadius: '50%', boxShadow: `0 0 0 2px ${ring}`, overflow: 'hidden', width: size, height: size }}>
      <HeroImg heroid={heroid} size={size} style={{ display: 'block' }} />
    </div>
  );
}

function Th({ children, title }) {
  return (
    <th title={title} style={{ textAlign: 'center', padding: '6px 4px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.07em', whiteSpace: 'nowrap', borderBottom: '1px solid var(--border)' }}>
      {children}
    </th>
  );
}

function PlayerRow({ p, hi, lo, expanded }) {
  const items = [p.equip_1, p.equip_2, p.equip_3, p.equip_4, p.equip_5, p.equip_6].filter(Boolean);
  const talents = [p.rune_map_1, p.rune_map_2, p.rune_map_3].filter(Boolean);

  return (
    <tr style={{ borderBottom: '1px solid var(--border)' }}>
      <td style={{ padding: '6px 8px', whiteSpace: 'nowrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <RoleImg role={p.role_lane} size={18} style={{ flexShrink: 0 }} />
          {/* Player: image stacked above name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 70, flexShrink: 0 }}>
            <PlayerPhoto photoUrl={p.photo_url} name={p.player_name} size={32} />
            {p.player_key ? (
              <Link href={`/players/${encodeURIComponent(p.player_key)}`} style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {p.player_name}
              </Link>
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: 'var(--text)', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                {p.player_name}
              </span>
            )}
          </div>
          {/* Hero: image stacked above name */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: 70, flexShrink: 0 }}>
            <HeroCircle heroid={p.heroid} campid={p.campid} size={36} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{p.hero_name}</span>
          </div>
          {p.mvp && <span title="In-game MVP" style={{ fontSize: 13, color: 'var(--accent)', flexShrink: 0 }}>★</span>}
        </div>
      </td>
      <td style={cs('kill_num', p.kill_num, hi, lo)}>{p.kill_num ?? '--'}</td>
      <td style={cs('dead_num', p.dead_num, hi, lo)}>{p.dead_num ?? '--'}</td>
      <td style={cs('assist_num', p.assist_num, hi, lo)}>{p.assist_num ?? '--'}</td>
      <td style={cs('computed_kda', p.computed_kda, hi, lo)}>{p.computed_kda ?? '--'}</td>
      <td style={cs('kill_participation', p.kill_participation, hi, lo)}>{p.kill_participation ? p.kill_participation + '%' : '--'}</td>
      <td style={cs('gold_per_min', p.gold_per_min, hi, lo)}>{p.gold_per_min ? Math.round(p.gold_per_min) : '--'}</td>
      <td style={cs('gold_pct', p.gold_pct, hi, lo)}>{p.gold_pct ? p.gold_pct + '%' : '--'}</td>
      <td style={cs('damage_dealt_per_min', p.damage_dealt_per_min, hi, lo)}>{p.damage_dealt_per_min ? Math.round(p.damage_dealt_per_min) : '--'}</td>
      <td style={cs('damage_dealt_pct', p.damage_dealt_pct, hi, lo)}>{p.damage_dealt_pct ? p.damage_dealt_pct + '%' : '--'}</td>
      <td style={cs('control_time_ms', p.control_time_ms, hi, lo)}>{fmtCC(p.control_time_ms)}</td>

      {expanded && (
        <>
          <td style={cs('total_gold', p.total_gold, hi, lo)}>{p.total_gold ? p.total_gold.toLocaleString() : '--'}</td>
          <td style={cs('total_damage', p.total_damage, hi, lo)}>{big(p.total_damage)}</td>
          <td style={cs('total_hurt', p.total_hurt, hi, lo)}>{big(p.total_hurt)}</td>
          <td style={cs('damage_taken_per_min', p.damage_taken_per_min, hi, lo)}>{p.damage_taken_per_min ? Math.round(p.damage_taken_per_min) : '--'}</td>
          <td style={cs('total_heal', p.total_heal, hi, lo)}>{big(p.total_heal)}</td>
          <td style={cs('total_heal_other', p.total_heal_other, hi, lo)}>{big(p.total_heal_other)}</td>
        </>
      )}

      {/* Loadout: fixed min-width prevents overlap with items */}
      <td style={{ padding: '4px 8px', minWidth: 130 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'nowrap' }}>
          {p.skillid && <SkillImg skillid={p.skillid} size={24} />}
          <span style={{ color: 'var(--border)', fontSize: 9 }}>·</span>
          {p.rune_id && <RuneImg runeMap={p.rune_id} size={24} />}
          {talents.length > 0 && <span style={{ color: 'var(--border)', fontSize: 9 }}>·</span>}
          {talents.map((rm, i) => <RuneImg key={i} runeMap={rm} size={20} />)}
        </div>
      </td>
      {/* Items: fixed min-width for 6 x 28px icons + gaps */}
      <td style={{ padding: '4px 8px', minWidth: 192 }}>
        <div style={{ display: 'flex', gap: 2, flexWrap: 'nowrap' }}>
          {items.map((eq, i) => <ItemImg key={i} equipId={eq} size={28} />)}
          {Array.from({ length: Math.max(0, 6 - items.length) }).map((_, i) => (
            <div key={`e${i}`} style={{ width: 28, height: 28, background: 'var(--surface2)', borderRadius: 2 }} />
          ))}
        </div>
      </td>
    </tr>
  );
}

export function PlayerTable({ camp1, camp2, camp1players, camp2players }) {
  const [expanded, setExpanded] = useState(false);
  const { hi, lo } = computeHighlights([...camp1players, ...camp2players]);
  const colCount = expanded ? 19 : 13;

  return (
    <div className="mb-6">
      <div
        className="tbl-scroll"
        role="region"
        aria-label="Player statistics table"
        tabIndex={0}
        style={{ outline: 'none' }}
      >
        <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
          <caption className="sr-only">
            Player statistics comparing {camp1?.team_code} and {camp2?.team_code}
          </caption>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.08em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>PLAYER</th>
              <Th title="Kills">K</Th>
              <Th title="Deaths">D</Th>
              <Th title="Assists">A</Th>
              <Th title="KDA">KDA</Th>
              <Th title="Kill Participation">KP%</Th>
              <Th title="Gold per Minute">GPM</Th>
              <Th title="Gold Share">GOLD%</Th>
              <Th title="Damage per Minute">DPM</Th>
              <Th title="Damage Share">DMG%</Th>
              <Th title="Crowd Control Time">CC</Th>
              {expanded && (
                <>
                  <Th title="Total Gold">GOLD</Th>
                  <Th title="Total Damage">DMG</Th>
                  <Th title="Damage Taken">TAKEN</Th>
                  <Th title="Damage Taken per Minute">DTPM</Th>
                  <Th title="Total Heal">HEAL</Th>
                  <Th title="Heal to Allies">H.ALLY</Th>
                </>
              )}
              <Th title="Spell * Emblem * Talents">Spell | Emblem | Talents</Th>
              <Th title="Items">ITEMS</Th>
            </tr>
          </thead>
          <tbody>
            {/* Blue Side Group Header */}
            {camp1 && (
              <tr>
                <td
                  colSpan={colCount}
                  style={{
                    borderLeft: `2px solid ${BLUE}`,
                    background: 'rgba(77,166,255,.04)',
                    padding: '4px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '.1em',
                    color: BLUE
                  }}
                  aria-label={`${camp1.team_code} — Blue Side`}
                >
                  {camp1.team_code} {camp1.is_winner ? <span style={{ color: 'var(--win)', marginLeft: 8 }}>WIN</span> : ''}
                </td>
              </tr>
            )}
            {sortP(camp1players).map(p => (
              <PlayerRow key={p.roleid} p={p} hi={hi} lo={lo} expanded={expanded} />
            ))}

            {/* Red Side Group Header */}
            {camp2 && (
              <tr>
                <td
                  colSpan={colCount}
                  style={{
                    borderLeft: `2px solid ${RED}`,
                    background: 'rgba(255,71,87,.04)',
                    padding: '4px 8px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    letterSpacing: '.1em',
                    color: RED
                  }}
                  aria-label={`${camp2.team_code} — Red Side`}
                >
                  {camp2.team_code} {camp2.is_winner ? <span style={{ color: 'var(--win)', marginLeft: 8 }}>WIN</span> : ''}
                </td>
              </tr>
            )}
            {sortP(camp2players).map(p => (
              <PlayerRow key={p.roleid} p={p} hi={hi} lo={lo} expanded={expanded} />
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--accent)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px 8px',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 4
          }}
        >
          {expanded ? '– Less stats' : '+ More stats'}
        </button>
      </div>
    </div>
  );
}
