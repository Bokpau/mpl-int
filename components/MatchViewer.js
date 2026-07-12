'use client';
import { useState, useRef, useEffect } from 'react';
import { MapReview } from './MapReview';
import { HeroImg, ItemImg, SkillImg } from './Images';
import { img as imgUrl } from '../lib/images';
import { RoleDiffChart } from './RoleDiffChart';

const BLUE = '#4da6ff';
const RED  = '#ff4757';

const ROLE_ORDER = ['GOLD LANE', 'EXP LANE', 'JUNGLE', 'MID LANE', 'ROAM'];
const ROLE_SHORT = { 'GOLD LANE': 'GOLD', 'EXP LANE': 'EXP', 'JUNGLE': 'JGL', 'MID LANE': 'MID', 'ROAM': 'ROAM' };
const TS_COLS = '22px minmax(80px,1fr) 62px 34px 30px 48px 48px 48px 48px';

function fmtStat(n) {
  if (n == null || n === '') return '--';
  const a = Math.abs(n);
  if (a >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (a >= 1000)      return (n / 1000).toFixed(1) + 'K';
  return Math.round(n).toLocaleString();
}

function TeamStatsView({ frame, players, camp1, camp2, inspectedRoleIds }) {
  const rowRefs = useRef({});
  const mono    = { fontFamily: 'var(--font-mono)' };

  useEffect(() => {
    const first = [...inspectedRoleIds][0];
    if (first != null) {
      rowRefs.current[String(first)]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [inspectedRoleIds]);

  const frameMap = {};
  for (const snap of frame) frameMap[String(snap.roleid)] = snap;

  const allKills = frame.reduce((s, p) => s + (p.kill_num || 0), 0);

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
    <div style={{ minWidth: 420 }}>
      {/* Sticky column headers */}
      <div style={{
        display: 'grid', gridTemplateColumns: TS_COLS, gap: '0 4px',
        padding: '3px 10px 3px 10px', background: 'var(--surface2)',
        borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 1,
      }}>
        {['', '', 'K/D/A', 'KDA', 'KP', 'GOLD', 'DMG', 'TKN', 'TURR'].map((h, i) => (
          <span key={i} style={{ ...mono, fontSize: 7, color: 'var(--muted)', letterSpacing: '.06em', textAlign: i >= 2 ? 'right' : 'left' }}>{h}</span>
        ))}
      </div>

      {[1, 2].map(campid => {
        const team      = campid === 1 ? camp1 : camp2;
        const campColor = campid === 1 ? BLUE : RED;
        const teamPlayers = [...players]
          .filter(p => Number(p.campid) === campid)
          .sort((a, b) => ROLE_ORDER.indexOf(a.role_lane) - ROLE_ORDER.indexOf(b.role_lane));
        const teamSnaps = teamPlayers.map(p => frameMap[String(p.roleid)]).filter(Boolean);

        const tK    = teamSnaps.reduce((s, p) => s + (p.kill_num    || 0), 0);
        const tD    = teamSnaps.reduce((s, p) => s + (p.dead_num    || 0), 0);
        const tA    = teamSnaps.reduce((s, p) => s + (p.assist_num  || 0), 0);
        const tKDA  = ((tK + tA) / (tD || 1)).toFixed(1);
        const tKP   = allKills > 0 ? Math.round(tK / allKills * 100) : 0;
        const tGold = teamSnaps.reduce((s, p) => s + (p.gold                 || 0), 0);
        const tDmg  = teamSnaps.reduce((s, p) => s + (p.total_damage         || 0), 0);
        const tTkn  = teamSnaps.reduce((s, p) => s + (p.total_hurt           || 0), 0);
        const tTurr = teamSnaps.reduce((s, p) => s + (p.total_damage_tower   || 0), 0);

        return (
          <div key={campid}>
            {/* Team header row */}
            <div style={{
              display: 'grid', gridTemplateColumns: TS_COLS, gap: '0 4px',
              padding: '6px 10px', alignItems: 'center',
              borderBottom: '1px solid var(--border)',
              borderLeft: `3px solid ${campColor}`,
              background: campid === 1 ? 'rgba(77,166,255,.07)' : 'rgba(255,71,87,.07)',
            }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: campColor }} />
              <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: campColor, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {team?.team_code || (campid === 1 ? 'Blue' : 'Red')}
              </span>
              <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{tK}/{tD}/{tA}</span>
              <span style={{ ...mono, fontSize: 9,  color: 'var(--text)', textAlign: 'right' }}>{tKDA}</span>
              <span style={{ ...mono, fontSize: 9,  color: 'var(--muted)', textAlign: 'right' }}>{tKP}%</span>
              <span style={{ ...mono, fontSize: 9,  color: 'var(--text)', textAlign: 'right' }}>{fmtStat(tGold)}</span>
              <span style={{ ...mono, fontSize: 9,  color: 'var(--text)', textAlign: 'right' }}>{fmtStat(tDmg)}</span>
              <span style={{ ...mono, fontSize: 9,  color: 'var(--text)', textAlign: 'right' }}>{fmtStat(tTkn)}</span>
              <span style={{ ...mono, fontSize: 9,  color: 'var(--text)', textAlign: 'right' }}>{fmtStat(tTurr)}</span>
            </div>

            {/* Player rows */}
            {teamPlayers.map(pl => {
              const rid   = String(pl.roleid);
              const snap  = frameMap[rid];
              const isHl  = inspectedRoleIds.has(pl.roleid) || inspectedRoleIds.has(rid);
              const k     = snap?.kill_num   ?? 0;
              const d     = snap?.dead_num   ?? 0;
              const a     = snap?.assist_num ?? 0;
              const kda   = ((k + a) / (d || 1)).toFixed(1);
              const kp    = tK > 0 ? Math.round((k + a) / tK * 100) : 0;
              const isDead = (snap?.revive_left_time || 0) > 0;
              return (
                <div
                  key={rid}
                  ref={el => { rowRefs.current[rid] = el; }}
                  style={{
                    display: 'grid', gridTemplateColumns: TS_COLS, gap: '0 4px',
                    padding: '4px 10px', alignItems: 'center',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: `3px solid ${isHl ? 'var(--accent)' : 'transparent'}`,
                    background: isHl ? 'rgba(0,229,255,.07)' : 'transparent',
                    minHeight: 28,
                  }}
                >
                  <div style={{ width: 22, height: 22, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, boxShadow: `0 0 0 1.5px ${campColor}`, filter: isDead ? 'grayscale(1)' : 'none' }}>
                    {snap?.heroid
                      ? <HeroImg heroid={snap.heroid} size={22} style={{ display: 'block' }} />
                      : <div style={{ width: 22, height: 22, background: 'var(--surface2)' }} />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ ...mono, fontSize: 10, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {pl.nickname || pl.player_name || '—'}
                    </div>
                    <div style={{ ...mono, fontSize: 8, color: 'var(--muted)' }}>
                      {ROLE_SHORT[pl.role_lane] || pl.role_lane || ''}
                      {snap?.level ? ` · Lv${snap.level}` : ''}
                    </div>
                  </div>
                  <span style={{ ...mono, fontSize: 10, fontWeight: 700, color: campColor,        textAlign: 'right' }}>{k}/{d}/{a}</span>
                  <span style={{ ...mono, fontSize: 9,  color: 'var(--text)',  textAlign: 'right' }}>{kda}</span>
                  <span style={{ ...mono, fontSize: 9,  color: 'var(--muted)', textAlign: 'right' }}>{kp}%</span>
                  <span style={{ ...mono, fontSize: 9,  color: 'var(--text)',  textAlign: 'right' }}>{fmtStat(snap?.gold)}</span>
                  <span style={{ ...mono, fontSize: 9,  color: 'var(--text)',  textAlign: 'right' }}>{fmtStat(snap?.total_damage)}</span>
                  <span style={{ ...mono, fontSize: 9,  color: 'var(--text)',  textAlign: 'right' }}>{fmtStat(snap?.total_hurt)}</span>
                  <span style={{ ...mono, fontSize: 9,  color: 'var(--text)',  textAlign: 'right' }}>{fmtStat(snap?.total_damage_tower)}</span>
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

const TOWER_SHORT = {
  up_outer:   'Up Outer',   up_mid:   'Up Mid',   up_inner:   'Up Inner',
  mid_outer:  'Mid Outer',  mid_mid:  'Mid',       mid_inner:  'Mid Inner',
  down_outer: 'Dn Outer',   down_mid: 'Dn Mid',    down_inner: 'Dn Inner',
};

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function big(n)    { return n != null && n !== '' ? Math.round(n).toLocaleString() : '--'; }
function fmtCC(ms) { return ms ? (ms / 1000).toFixed(1) + 's' : '--'; }

const GOLD_SOURCES = [
  { key: 'gold_map_1', label: 'Minions',      color: '#66bb6a' },
  { key: 'gold_map_2', label: 'Jungle',        color: '#26c6da' },
  { key: 'gold_map_3', label: 'Turtle+Lord',   color: '#e8b800' },
  { key: 'gold_map_4', label: 'Turrets',       color: '#42a5f5' },
  { key: 'gold_map_5', label: 'Roam Equip',    color: '#ab47bc' },
  { key: 'gold_map_6', label: 'Kills+Assists', color: '#ef5350' },
  { key: 'gold_map_9', label: 'Roam Vision',   color: '#78909c' },
];

function MiniHero({ heroid, campid, size = 18 }) {
  if (!heroid) return null;
  const ring = campid === 1 ? BLUE : campid === 2 ? RED : 'var(--border)';
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', boxShadow: `0 0 0 1.5px ${ring}`, overflow: 'hidden', flexShrink: 0 }}>
      <HeroImg heroid={heroid} size={size} style={{ display: 'block' }} />
    </div>
  );
}

function CompactEventRow({ ev, isSelected, isNear, onClick, playerMap, camp1, camp2 }) {
  const killerCamp = ev.killer_camp;
  const killedCamp = ev.killed_camp;
  const killerHero = ev.heroid;
  const killedHero = ev.killed_id ? playerMap[String(ev.killed_id)]?.heroid : null;

  const isFirstBlood = ev.extra_params?.includes('first_blood');
  const isSavage     = ev.extra_params?.includes('penta_kill');
  const isManiac     = ev.extra_params?.includes('quadra_kill');

  const assists = [ev.assister_1_id, ev.assister_2_id, ev.assister_3_id]
    .filter(Boolean)
    .map(aid => ({ heroid: playerMap[String(aid)]?.heroid, campid: playerMap[String(aid)]?.campid }))
    .filter(a => a.heroid)
    .slice(0, 3);

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '4px 8px',
        borderBottom: '1px solid var(--border)',
        borderLeft: `2px solid ${isSelected ? 'var(--accent)' : isNear ? 'rgba(0,229,255,.3)' : 'transparent'}`,
        background: isSelected ? 'rgba(0,229,255,.09)' : isNear ? 'rgba(0,229,255,.03)' : 'transparent',
        cursor: 'pointer',
        minHeight: 26,
      }}
    >
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '-.01em',
        color: isSelected ? 'var(--accent)' : isNear ? 'rgba(0,229,255,.8)' : 'var(--muted)',
        minWidth: 34, flexShrink: 0,
      }}>
        {fmtTime(ev.game_time)}
      </span>

      {ev.event_type === 'kill_hero' && (
        <>
          <MiniHero heroid={killerHero} campid={killerCamp} />
          <span style={{ fontSize: 8, color: 'var(--muted)', flexShrink: 0 }}>→</span>
          <MiniHero heroid={killedHero} campid={killedCamp} />
          {assists.map((a, i) => <MiniHero key={i} heroid={a.heroid} campid={a.campid} size={14} />)}
          {isFirstBlood && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#ff5252' }}>FB</span>}
          {isSavage     && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: '#e8b800' }}>SAV</span>}
          {isManiac     && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--accent)' }}>MAN</span>}
        </>
      )}

      {ev.event_type === 'kill_boss' && (
        <>
          <MiniHero heroid={killerHero} campid={killerCamp} />
          <span style={{ fontSize: 11, flexShrink: 0 }}>{ev.boss_name === 'lord' ? '⚔️' : '🐢'}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: ev.boss_name === 'lord' ? '#e8b800' : '#66bb6a' }}>
            {ev.boss_name === 'lord' ? 'Lord' : 'Turtle'}
          </span>
        </>
      )}

      {ev.event_type === 'kill_tower' && (
        <>
          {killerHero
            ? <MiniHero heroid={killerHero} campid={killerCamp} />
            : (() => {
                const team = killerCamp === 1 ? camp1 : camp2;
                const logo = imgUrl.team(team?.team_code);
                const ring = killerCamp === 1 ? BLUE : RED;
                return logo
                  ? <img src={logo} alt={team?.team_code} width={18} height={18} style={{ borderRadius: '50%', boxShadow: `0 0 0 1.5px ${ring}`, flexShrink: 0, display: 'block' }} onError={e => { e.target.style.display = 'none'; }} />
                  : <span style={{ fontSize: 9, flexShrink: 0, color: ring }}>●</span>;
              })()
          }
          <span style={{ fontSize: 9, flexShrink: 0, color: killerCamp === 1 ? BLUE : RED }}>🏰</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {TOWER_SHORT[ev.tower_name] || ev.tower_name || 'Turret'}
          </span>
        </>
      )}

      {ev.event_type === 'camp_ace' && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 800, color: 'var(--loss)' }}>💀 ACE</span>
      )}

      {/* Buff & Lithowanderer clears — "TEAM → icon", team-coloured, lower-emphasis.
          Team-only events (no player killer), like kill_tower's team-logo fallback. */}
      {ev.event_type === 'kill_buff' && (
        <>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, flexShrink: 0, color: killerCamp === 1 ? BLUE : RED }}>
            {(killerCamp === 1 ? camp1 : camp2)?.team_code || (killerCamp === 1 ? 'BLUE' : 'RED')}
          </span>
          <span style={{ fontSize: 8, color: 'var(--muted)', flexShrink: 0 }}>→</span>
          <img
            src={imgUrl.icon(ev.camp_name === 'Purple Buff' ? 'BUFF PURPLE' : 'BUFF ORANGE')}
            alt={ev.camp_name} width={16} height={16}
            style={{ flexShrink: 0, display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </>
      )}

      {ev.event_type === 'kill_crab' && (
        <>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, flexShrink: 0, color: killerCamp === 1 ? BLUE : RED }}>
            {(killerCamp === 1 ? camp1 : camp2)?.team_code || (killerCamp === 1 ? 'BLUE' : 'RED')}
          </span>
          <span style={{ fontSize: 8, color: 'var(--muted)', flexShrink: 0 }}>→</span>
          <span style={{ fontSize: 11, flexShrink: 0 }}>🦀</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>Litho</span>
        </>
      )}
    </div>
  );
}

function fmtDiff(n)    { return n > 0 ? `+${Math.round(n).toLocaleString()}` : Math.round(n).toLocaleString(); }
function fmtDiffCC(ms) { const s = ms / 1000; return (s > 0 ? '+' : '') + s.toFixed(1) + 's'; }

// Left column:  label(fixed) | value | team% | diff
// Right column: ●+label(flex) | value | team% | diff
const COL_L = '38px 1fr 34px 52px';
const COL_R = '1fr 52px 34px 52px';

function TableHeader({ oppRole, col }) {
  const mono = { fontFamily: 'var(--font-mono)' };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: col, gap: '0 4px', marginBottom: 2, paddingBottom: 2, borderBottom: '1px solid var(--border)' }}>
      {['', 'VAL', '%', oppRole ? `v${oppRole[0]}` : '—'].map((h, i) => (
        <span key={i} style={{ ...mono, fontSize: 8, color: 'var(--muted)', letterSpacing: '.06em', textAlign: i > 0 ? 'right' : 'left' }}>{h}</span>
      ))}
    </div>
  );
}

function StatRow({ label, valueStr, pct, diffFmt, good, labelEl, col }) {
  const mono = { fontFamily: 'var(--font-mono)' };
  const diffColor = diffFmt == null ? 'var(--muted)'
    : good === true  ? '#66bb6a'
    : good === false ? '#ef5350'
    : 'var(--muted)';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: col, gap: '0 4px', alignItems: 'center', minHeight: 19 }}>
      <span style={{ ...mono, fontSize: 10, color: 'var(--muted)', letterSpacing: '.03em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {labelEl ?? label}
      </span>
      <span style={{ ...mono, fontSize: 11, fontWeight: 700, color: 'var(--text)', textAlign: 'right' }}>{valueStr}</span>
      <span style={{ ...mono, fontSize: 9, color: 'var(--muted)', textAlign: 'right' }}>{pct != null ? `${pct}%` : '—'}</span>
      <span style={{ ...mono, fontSize: 9, color: diffColor, textAlign: 'right' }}>{diffFmt ?? '—'}</span>
    </div>
  );
}

function PlayerStatCard({ roleid, frame, players }) {
  const snap       = frame.find(p => String(p.roleid) === String(roleid));
  const staticInfo = players.find(p => String(p.roleid) === String(roleid));

  if (!snap) {
    return (
      <div style={{ padding: '12px', borderBottom: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
        {staticInfo?.nickname || 'Player'} — no data at this time
      </div>
    );
  }

  const campColor = snap.campid === 1 ? BLUE : RED;
  const isDead    = (snap.revive_left_time || 0) > 0;
  const teammates = frame.filter(p => p.campid === snap.campid);
  const opp       = snap.role ? frame.find(p => p.campid !== snap.campid && p.role === snap.role) : null;

  const teamKills = teammates.reduce((s, p) => s + (p.kill_num || 0), 0);
  const kp  = teamKills > 0 ? Math.round(((snap.kill_num || 0) + (snap.assist_num || 0)) / teamKills * 100) : 0;
  // No deaths → treat deaths as 1 so KDA reads as kills+assists instead of ∞.
  const kda = (((snap.kill_num || 0) + (snap.assist_num || 0)) / (snap.dead_num || 1)).toFixed(1);

  // EXP (from snapshot) and diff vs same-role opponent — only shown once the
  // map-data endpoint returns an `exp` field on each snapshot.
  const expDiff = (snap.exp != null && opp && opp.exp != null) ? snap.exp - opp.exp : null;

  function sd(raw, teamTotal, oppRaw, goodIfPositive = true, isCC = false) {
    const pct     = teamTotal > 0 ? Math.round(raw / teamTotal * 100) : null;
    const diff    = opp != null ? raw - (oppRaw ?? 0) : null;
    const diffFmt = diff == null ? null : isCC ? fmtDiffCC(diff) : fmtDiff(diff);
    const good    = diff == null ? null : goodIfPositive ? diff > 0 : diff < 0;
    return { valueStr: isCC ? fmtCC(raw) : big(raw), pct, diffFmt, good };
  }

  const tGold = teammates.reduce((a, p) => a + (p.gold || 0), 0);
  const tDmg  = teammates.reduce((a, p) => a + (p.total_damage || 0), 0);
  const tTkn  = teammates.reduce((a, p) => a + (p.total_hurt || 0), 0);
  const tTurr = teammates.reduce((a, p) => a + (p.total_damage_tower || 0), 0);
  const tHeal = teammates.reduce((a, p) => a + (p.total_heal || 0), 0);
  const tAlly = teammates.reduce((a, p) => a + (p.total_heal_other || 0), 0);

  const mainStats = [
    { label: 'GOLD', ...sd(snap.gold || 0,               tGold, opp?.gold || 0) },
    { label: 'DMG',  ...sd(snap.total_damage || 0,       tDmg,  opp?.total_damage || 0) },
    { label: 'TKN',  ...sd(snap.total_hurt || 0,         tTkn,  opp?.total_hurt || 0,         false) },
    { label: 'TURR', ...sd(snap.total_damage_tower || 0, tTurr, opp?.total_damage_tower || 0) },
    { label: 'CC',   ...sd(snap.control_time_ms || 0,    0,     opp?.control_time_ms || 0,    true, true) },
    { label: 'HEAL', ...sd(snap.total_heal || 0,         tHeal, opp?.total_heal || 0) },
    { label: 'ALLY', ...sd(snap.total_heal_other || 0,   tAlly, opp?.total_heal_other || 0) },
  ];

  const goldTotal = GOLD_SOURCES.reduce((a, g) => a + (snap[g.key] || 0), 0);
  const goldMapRows = GOLD_SOURCES
    .map(({ key, label, color }) => {
      const val    = snap[key] || 0;
      const tVal   = teammates.reduce((a, p) => a + (p[key] || 0), 0);
      const oppVal = opp ? (opp[key] || 0) : null;
      const pct    = tVal > 0 ? Math.round(val / tVal * 100) : null;
      const diff   = oppVal != null ? val - oppVal : null;
      return { key, label, color, val, valueStr: big(val), pct,
               diffFmt: diff != null ? fmtDiff(diff) : null,
               good:    diff != null ? diff > 0 : null };
    })
    .filter(r => r.val > 0 || (opp && (opp[r.key] || 0) > 0));

  const items = [snap.equip_1, snap.equip_2, snap.equip_3, snap.equip_4, snap.equip_5, snap.equip_6].filter(Boolean);
  const mono  = { fontFamily: 'var(--font-mono)' };

  return (
    <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* ── Identity + Items (same row) ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Hero portrait with overlays — outer has no overflow clip so badges can escape */}
        <div style={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
          {/* Circular clipping layer */}
          <div style={{ width: 40, height: 40, borderRadius: '50%', boxShadow: `0 0 0 2.5px ${isDead ? 'var(--muted)' : campColor}`, overflow: 'hidden', position: 'relative' }}>
            <HeroImg heroid={snap.heroid} size={40} style={{ display: 'block', filter: isDead ? 'grayscale(1)' : 'none' }} />
            {isDead && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ ...mono, fontSize: 12, fontWeight: 700, color: '#fff' }}>
                  {snap.revive_left_time || ''}
                </span>
              </div>
            )}
          </div>
          {/* Ult indicator — upper-left, outside clip */}
          {!isDead && (
            <div style={{
              position: 'absolute', top: -1, left: -1,
              width: 14, height: 14, borderRadius: '50%',
              background: (snap.major_left_time || 0) === 0 ? '#66bb6a' : 'rgba(10,10,10,0.9)',
              border: `1px solid ${(snap.major_left_time || 0) === 0 ? 'rgba(255,255,255,0.5)' : '#888'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              ...mono, fontSize: 8, fontWeight: 700, color: '#fff',
            }}>
              {(snap.major_left_time || 0) > 0 ? snap.major_left_time : ''}
            </div>
          )}
          {/* Skill icon — lower-right, always shown */}
          {!isDead && staticInfo?.skillid && (
            <div style={{
              position: 'absolute', bottom: -2, right: -2,
              width: 18, height: 18, borderRadius: '50%',
              border: `1px solid ${(snap.skill_left_time || 0) > 0 ? '#e8b800' : '#66bb6a'}`,
              overflow: 'hidden',
            }}>
              <SkillImg skillid={staticInfo.skillid} size={18} style={{ display: 'block', borderRadius: 0 }} />
              {(snap.skill_left_time || 0) > 0 && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.62)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  ...mono, fontSize: 8, fontWeight: 700, color: '#fff',
                }}>
                  {snap.skill_left_time}
                </div>
              )}
            </div>
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ ...mono, fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {staticInfo?.nickname || snap.player_name || '—'}
          </div>
          <div style={{ ...mono, fontSize: 10, color: 'var(--muted)', display: 'flex', gap: 4 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staticInfo?.hero_name || ''}</span>
            {snap.role && <span style={{ color: campColor, flexShrink: 0 }}>· {snap.role}</span>}
            <span style={{ flexShrink: 0 }}>· Lv <strong style={{ color: 'var(--text)' }}>{snap.level || '—'}</strong></span>
            {snap.exp != null && (
              <span style={{ flexShrink: 0 }}>
                · EXP <strong style={{ color: 'var(--text)' }}>{big(snap.exp)}</strong>
                {expDiff != null && (
                  <strong style={{ marginLeft: 3, fontWeight: 600, color: expDiff > 0 ? '#66bb6a' : expDiff < 0 ? '#ef5350' : 'var(--muted)' }}>
                    {fmtDiff(expDiff)}
                  </strong>
                )}
              </span>
            )}
          </div>
        </div>
        {/* Items — single horizontal row */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ width: 28, height: 28, borderRadius: 4, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--surface2)', flexShrink: 0 }}>
              {items[i] && <ItemImg equipId={items[i]} size={28} />}
            </div>
          ))}
        </div>
      </div>

      {/* ── KDA / KP ── */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingBottom: 5, borderBottom: '1px solid var(--border)' }}>
        <span style={{ ...mono, fontSize: 17, fontWeight: 700, color: campColor }}>
          {snap.kill_num ?? 0}/{snap.dead_num ?? 0}/{snap.assist_num ?? 0}
        </span>
        <span style={{ ...mono, fontSize: 11, color: 'var(--muted)' }}>
          KDA&nbsp;<span style={{ color: 'var(--text)' }}>{kda}</span>
        </span>
        <span style={{ ...mono, fontSize: 11, color: 'var(--muted)' }}>
          KP&nbsp;<span style={{ color: 'var(--text)' }}>{kp}%</span>
        </span>
      </div>

      {/* ── Stats (left) + Gold Map sources (right) ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 10px' }}>

        {/* Left: main stats */}
        <div>
          <TableHeader oppRole={opp?.role || null} col={COL_L} />
          {mainStats.map(row => <StatRow key={row.label} col={COL_L} {...row} />)}
        </div>

        {/* Right: gold map sources */}
        <div>
          <TableHeader oppRole={opp?.role || null} col={COL_R} />
          {goldMapRows.map(({ key, label, color, valueStr, pct, diffFmt, good }) => (
            <StatRow
              key={key}
              col={COL_R}
              label={label}
              labelEl={
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
                </span>
              }
              valueStr={valueStr}
              pct={pct}
              diffFmt={diffFmt}
              good={good}
            />
          ))}
        </div>
      </div>

      {/* ── Gold Map bar (full width, below both columns) ── */}
      {goldTotal > 0 && (
        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', gap: 1, marginTop: 2 }}>
          {GOLD_SOURCES.map(({ key, color }) => {
            const pct = (snap[key] || 0) / goldTotal * 100;
            if (pct < 0.5) return null;
            return <div key={key} style={{ width: `${pct}%`, background: color, minWidth: 2 }} />;
          })}
        </div>
      )}
    </div>
  );
}

export function MatchViewer({ battleId, mapId, camp1Code, camp2Code, matchEvents = [], playerMap = {}, camp1, camp2, players = [] }) {
  const [selectedEvent,    setSelectedEvent]    = useState(null);
  const [mapTime,          setMapTime]          = useState(0);
  const [leftH,            setLeftH]            = useState(0);
  const [inspectedRoleIds, setInspectedRoleIds] = useState(new Set());
  const [currentFrame,     setCurrentFrame]     = useState([]);
  const [rightView,        setRightView]        = useState('stats');
  const [showJungle,       setShowJungle]       = useState(false); // JUNGLE toggle: map camps + buff/litho timeline rows
  const leftColRef = useRef(null);

  useEffect(() => {
    const el = leftColRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setLeftH(entry.contentRect.height));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggleEvent = (ev) =>
    setSelectedEvent(prev => prev?.id === ev.id ? null : ev);

  const relevant = matchEvents.filter(e => {
    // Buff & Lithowanderer rows are gated behind the JUNGLE toggle (shared with the map layer).
    if (e.event_type === 'kill_buff' || e.event_type === 'kill_crab') return showJungle;
    return ['kill_hero', 'kill_boss', 'kill_tower', 'camp_ace'].includes(e.event_type);
  });

  const inspectedRoleIdList = [...inspectedRoleIds];

  const panelH = leftH > 0 ? leftH : undefined;

  return (
    <div className="match-viewer-grid">

      {/* ── LEFT: Map ── */}
      <div ref={leftColRef}>
        <MapReview
          battleId={battleId}
          mapId={mapId}
          camp1Code={camp1Code}
          camp2Code={camp2Code}
          matchEvents={matchEvents}
          selectedEvent={selectedEvent}
          onEventSelect={toggleEvent}
          onTimeChange={setMapTime}
          players={players}
          camp1={camp1}
          camp2={camp2}
          inspectedRoleIds={inspectedRoleIds}
          onInspectChange={setInspectedRoleIds}
          onFrameChange={setCurrentFrame}
          showJungle={showJungle}
          onJungleChange={setShowJungle}
        />
      </div>

      {/* ── MIDDLE: Events panel ── */}
      <div className="match-viewer-panel" style={{
        border: '1px solid var(--border)', background: 'var(--surface)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        height: panelH,
        minHeight: 200,
      }}>
        <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em' }}>GAME EVENTS</span>
          {selectedEvent
            ? <button
                onClick={() => setSelectedEvent(null)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                ✕ CLEAR
              </button>
            : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(0,229,255,.5)' }}>click to highlight</span>
          }
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {relevant.length === 0 && (
            <div style={{ padding: '24px 10px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>—</div>
          )}
          {relevant.map((ev, i) => (
            <CompactEventRow
              key={ev.id ?? i}
              ev={ev}
              isSelected={selectedEvent?.id === ev.id}
              isNear={mapTime > 0 && Math.abs(ev.game_time - mapTime) <= 15}
              onClick={() => toggleEvent(ev)}
              playerMap={playerMap}
              camp1={camp1}
              camp2={camp2}
            />
          ))}
        </div>

        <div style={{ padding: '5px 8px', borderTop: '1px solid var(--border)', background: 'var(--surface2)', flexShrink: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)' }}><span style={{ color: 'rgba(0,229,255,.6)' }}>│</span> near map time</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)' }}><span style={{ color: 'var(--accent)' }}>│</span> selected</span>
        </div>
      </div>

      {/* ── RIGHT: Player stats panel ── */}
      <div className="match-viewer-panel" style={{
        border: '1px solid var(--border)', background: 'var(--surface)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        height: panelH,
        minHeight: 200,
      }}>
        <div style={{ padding: '6px 10px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* View toggle */}
          {['stats', 'chart'].map(v => (
            <button
              key={v}
              onClick={() => setRightView(v)}
              style={{
                fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '.07em',
                padding: '2px 7px',
                background: rightView === v ? 'var(--accent)' : 'var(--surface2)',
                color:      rightView === v ? '#000'          : 'var(--muted)',
                border: `1px solid ${rightView === v ? 'var(--accent)' : 'var(--border)'}`,
                cursor: 'pointer', borderRadius: 2,
              }}
            >
              {v.toUpperCase()}
            </button>
          ))}
          {inspectedRoleIdList.length > 0 && (
            <button
              onClick={() => setInspectedRoleIds(new Set())}
              style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 'auto' }}>
              ✕ CLEAR
            </button>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {rightView === 'chart' ? (
            <>
              <RoleDiffChart
                battleId={battleId}
                matchEvents={matchEvents}
                mapTime={mapTime}
                camp1Code={camp1Code}
                camp2Code={camp2Code}
              />
              {inspectedRoleIdList.map(rid => (
                <PlayerStatCard key={rid} roleid={rid} frame={currentFrame} players={players} />
              ))}
            </>
          ) : (
            <TeamStatsView
              frame={currentFrame}
              players={players}
              camp1={camp1}
              camp2={camp2}
              inspectedRoleIds={inspectedRoleIds}
            />
          )}
        </div>
      </div>

    </div>
  );
}
