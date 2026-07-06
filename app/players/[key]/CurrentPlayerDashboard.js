'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { HeroImg, ItemImg, SkillImg, RuneImg, PlayerAvatar, PlayerPhoto } from '../../../components/Images';
import FilterSidebar from '../../../components/FilterSidebar';
import { VsTeamsTable } from '../../../components/VsTeamsTable';
import TeamLogo from '../../../components/TeamLogo';
import { img } from '../../../lib/images';

// Current-tournament rich player dashboard — the recreated PH player page, scoped to
// the featured edition (MSC 2026). Basics only; the 12 advanced-analytics tabs are a
// later phase. Reads the backend /api/intl/current/* endpoints through the same-origin
// proxy. See plans/recreate-player-page-plan.md.
const API = '';

function n(v) { return (v !== null && v !== undefined && v !== '' && !isNaN(v)) ? v : '--'; }
function big(v) { return (v !== null && v !== undefined && v !== '') ? Math.round(v).toLocaleString() : '--'; }
function pct(w, g) { return g > 0 ? Math.round(w / g * 100) : 0; }

function rankAmong(all, roleid, key, lb = false) {
  if (!all?.length) return null;
  const sorted = [...all].filter(p => p[key] != null).sort((a, b) =>
    lb ? parseFloat(a[key]) - parseFloat(b[key]) : parseFloat(b[key]) - parseFloat(a[key])
  );
  const i = sorted.findIndex(p => p.roleid == roleid);
  return i >= 0 ? i + 1 : null;
}
function rankAmongRole(all, roleid, role, key, lb = false) {
  if (!role) return null;
  return rankAmong(all.filter(p => p.role_lane === role), roleid, key, lb);
}

const ROLE_SHORT = { 'EXP LANE': 'EXP', 'JUNGLE': 'JGL', 'MID LANE': 'MID', 'ROAM': 'ROAM', 'GOLD LANE': 'GOLD' };

function StatCard({ label, value, rank, roleRank, roleLabel, color }) {
  const clr = r => r === 1 ? 'var(--accent)' : r <= 3 ? 'var(--text)' : 'var(--muted)';
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px 16px', minWidth: 110 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.55)', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>{value}</div>
      {rank && value !== '--' && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: clr(rank), marginTop: 6 }}>#{rank} overall</div>}
      {roleRank && value !== '--' && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: clr(roleRank), marginTop: 2 }}>#{roleRank} {roleLabel || 'role'}</div>}
    </div>
  );
}

const PERF_FILTERS = [
  { key: 'average', label: 'Average' },
  { key: 'total', label: 'Total' },
  { key: 'per_minute', label: 'Per Minute' },
  { key: 'percentage', label: 'Percentage' },
  { key: 'milestone', label: 'Milestones' },
];

const COMPARE_STATS = [
  { label: 'Win Rate', key: 'win_pct', fmt: v => Math.round(parseFloat(v) || 0) + '%', lb: false },
  { label: 'KDA', key: 'avg_kda', fmt: v => n(v), lb: false },
  { label: 'Kill Part%', key: 'avg_kp', fmt: v => v != null ? v + '%' : '--', lb: false },
  { label: 'Kills/G', key: 'avg_kills', fmt: v => n(v), lb: false },
  { label: 'Deaths/G', key: 'avg_deaths', fmt: v => n(v), lb: true },
  { label: 'Assists/G', key: 'avg_assists', fmt: v => n(v), lb: false },
  { label: 'Avg Damage', key: 'avg_damage', fmt: v => big(v), lb: false },
  { label: 'Dmg Share%', key: 'avg_dmg_share', fmt: v => v != null ? v + '%' : '--', lb: false },
  { label: 'DPM', key: 'avg_dpm', fmt: v => big(v), lb: false },
  { label: 'GPM', key: 'avg_gpm', fmt: v => big(v), lb: false },
  { label: 'Gold Share%', key: 'avg_gold_share', fmt: v => v != null ? v + '%' : '--', lb: false },
  { label: 'Avg Gold', key: 'avg_gold', fmt: v => big(v), lb: false },
];

const WL_STATS = [
  { label: 'KDA', key: 'avg_kda', fmt: v => n(v), lb: false },
  { label: 'Kill Part%', key: 'avg_kp', fmt: v => v != null ? v + '%' : '--', lb: false },
  { label: 'Kills/G', key: 'avg_kills', fmt: v => n(v), lb: false },
  { label: 'Deaths/G', key: 'avg_deaths', fmt: v => n(v), lb: true },
  { label: 'Assists/G', key: 'avg_assists', fmt: v => n(v), lb: false },
  { label: 'Avg Damage', key: 'avg_damage', fmt: v => big(v), lb: false },
  { label: 'Dmg Share%', key: 'avg_dmg_share', fmt: v => v != null ? v + '%' : '--', lb: false },
  { label: 'Avg Dmg Taken', key: 'avg_damage_taken', fmt: v => big(v), lb: true },
  { label: 'Dmg Tkn/Min', key: 'avg_dtpm', fmt: v => n(v), lb: true },
  { label: 'Avg Turret Dmg', key: 'avg_turret_damage', fmt: v => big(v), lb: false },
  { label: 'Turret Dmg/Min', key: 'avg_turret_dpm', fmt: v => n(v), lb: false },
  { label: 'Avg Heal', key: 'avg_heal', fmt: v => big(v), lb: false },
  { label: 'GPM', key: 'avg_gpm', fmt: v => big(v), lb: false },
  { label: 'Gold Share%', key: 'avg_gold_share', fmt: v => v != null ? v + '%' : '--', lb: false },
  { label: 'Avg Gold', key: 'avg_gold', fmt: v => big(v), lb: false },
  { label: 'Avg EXP', key: 'avg_exp', fmt: v => big(v), lb: false },
  { label: 'Avg Level', key: 'avg_level', fmt: v => n(v), lb: false },
  { label: 'CC Time (sec)', key: 'avg_cc_sec', fmt: v => n(v), lb: false },
];

export default function CurrentPlayerDashboard({ playerKey, scope, season, initial }) {
  const roleid = initial?.player?.roleid ?? null;

  const [data, setData] = useState(initial);
  const [allPlayers, setAllPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState('overall');
  const [perfFilter, setPerfFilter] = useState('average');
  const [side, setSide] = useState('overall');
  const [result, setResult] = useState('all');
  const [patch, setPatch] = useState(null);
  const [patches, setPatches] = useState([]);
  const [heroPool, setHeroPool] = useState([]);
  const [heroPoolLoading, setHeroPoolLoading] = useState(false);
  const [hpExpanded, setHpExpanded] = useState(false);
  const [logExpanded, setLogExpanded] = useState(false);
  const [compareRoleid, setCompareRoleid] = useState('');
  const [compareHeroPool, setCompareHeroPool] = useState([]);
  const [compareHeroLoading, setCompareHeroLoading] = useState(false);
  const [vsTeams, setVsTeams] = useState([]);
  const [winLoss, setWinLoss] = useState([]);
  const [vsLoading, setVsLoading] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/intl/patches`).then(r => r.json()).then(d => setPatches(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // Every query carries scope+season (the detail resolve needs them; the roleid-keyed
  // endpoints ignore them) plus the active filters.
  const buildQ = useCallback(() => {
    const p = [`scope=${encodeURIComponent(scope)}`, `season=${encodeURIComponent(season)}`];
    if (phase !== 'overall') p.push(`phase=${encodeURIComponent(phase)}`);
    if (side !== 'overall') p.push(`side=${side}`);
    if (patch && patch !== 'all') p.push(`patch=${encodeURIComponent(patch)}`);
    if (result !== 'all') p.push(`result=${result}`);
    return '?' + p.join('&');
  }, [scope, season, phase, side, patch, result]);

  // Detail (by key) + roster (for comparison / ranks). Re-fetch on any filter change.
  const q = buildQ();
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`${API}/api/intl/current/players/${encodeURIComponent(playerKey)}${q}`).then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`${API}/api/intl/current/roster${q}`).then(r => r.json()).catch(() => []),
    ]).then(([playerData, all]) => {
      if (playerData) setData(playerData);
      setAllPlayers(Array.isArray(all) ? all : []);
      setLoading(false);
    });
  }, [playerKey, q]);

  useEffect(() => {
    if (!roleid) return;
    setHeroPoolLoading(true);
    fetch(`${API}/api/intl/current/roles/${roleid}/heroes${q}`)
      .then(r => r.json()).catch(() => [])
      .then(rows => { setHeroPool(Array.isArray(rows) ? rows : []); setHeroPoolLoading(false); });
  }, [roleid, q]);

  useEffect(() => {
    if (!compareRoleid) { setCompareHeroPool([]); return; }
    setCompareHeroLoading(true);
    fetch(`${API}/api/intl/current/roles/${compareRoleid}/heroes${q}`)
      .then(r => r.json()).catch(() => [])
      .then(rows => { setCompareHeroPool(Array.isArray(rows) ? rows : []); setCompareHeroLoading(false); });
  }, [compareRoleid, q]);

  useEffect(() => {
    if (!roleid) return;
    setVsLoading(true);
    Promise.all([
      fetch(`${API}/api/intl/current/roles/${roleid}/vs-teams${q}`).then(r => r.json()).catch(() => []),
      fetch(`${API}/api/intl/current/roles/${roleid}/win-loss${q}`).then(r => r.json()).catch(() => []),
    ]).then(([vt, wl]) => {
      setVsTeams(Array.isArray(vt) ? vt : []);
      setWinLoss(Array.isArray(wl) ? wl : []);
      setVsLoading(false);
    });
  }, [roleid, q]);

  const s = data?.stats;
  const player = data?.player;
  const playerRole = player?.role_lane;
  const winP = s ? pct(s.wins, s.games) : 0;

  const allEnriched = useMemo(() => allPlayers.map(p => ({
    ...p,
    win_pct: parseInt(p.games) > 0 ? parseInt(p.wins) / parseInt(p.games) * 100 : 0,
  })), [allPlayers]);

  const perfStats = useMemo(() => {
    if (!s) return [];
    const pct1 = (v) => v != null && v !== '' ? v + '%' : '--';
    const roleLabel = ROLE_SHORT[playerRole] || 'role';
    const R = (label, value, key, lb = false, color) => ({
      label, value, color,
      rank: rankAmong(allPlayers, roleid, key, lb),
      roleRank: rankAmongRole(allPlayers, roleid, playerRole, key, lb),
      roleLabel,
    });
    switch (perfFilter) {
      case 'average': return [
        R('KDA', n(s.avg_kda), 'avg_kda', false, 'var(--accent)'),
        R('Kill Part%', pct1(s.avg_kp), 'avg_kp'),
        R('Kills/Game', n(s.avg_kills), 'avg_kills'),
        R('Deaths/Game', n(s.avg_deaths), 'avg_deaths', true),
        R('Assists/Game', n(s.avg_assists), 'avg_assists'),
        R('Avg Damage', big(s.avg_damage), 'avg_damage'),
        R('Avg Dmg Taken', big(s.avg_damage_taken), 'avg_damage_taken', true),
        R('Avg Turret Dmg', big(s.avg_turret_damage), 'avg_turret_damage'),
        R('Avg Heal', big(s.avg_heal), 'avg_heal'),
        R('Avg Heal (Allies)', big(s.avg_heal_allies), 'avg_heal_allies'),
        R('Avg Gold', big(s.avg_gold), 'avg_gold'),
        R('Avg EXP', big(s.avg_exp), 'avg_exp'),
        R('CC (sec)', n(s.avg_cc_sec), 'avg_cc_sec'),
        R('Avg Level', n(s.avg_level), 'avg_level'),
      ];
      case 'total': return [
        R('Total Kills', big(s.total_kills), 'total_kills'),
        R('Total Deaths', big(s.total_deaths), 'total_deaths', true),
        R('Total Assists', big(s.total_assists), 'total_assists'),
        R('Total Damage', big(s.total_damage), 'total_damage'),
        R('Total Dmg Taken', big(s.total_damage_taken), 'total_damage_taken', true),
        R('Total Turret Dmg', big(s.total_turret_damage), 'total_turret_damage'),
        R('Total Heal', big(s.total_heal), 'total_heal'),
        R('Total Heal (Allies)', big(s.total_heal_allies), 'total_heal_allies'),
        R('Total Gold', big(s.total_gold), 'total_gold'),
        R('CC Time (sec)', n(s.total_cc_sec), 'total_cc_sec'),
        R('Heroes Played', n(s.heroes_played), 'heroes_played'),
        R('In-Game MVPs', n(s.total_mvps), 'total_mvps'),
      ];
      case 'per_minute': return [
        R('GPM', big(s.avg_gpm), 'avg_gpm'),
        R('DPM', big(s.avg_dpm), 'avg_dpm'),
        R('Dmg Tkn/Min', n(s.avg_dtpm), 'avg_dtpm', true),
        R('Turret Dmg/Min', n(s.avg_turret_dpm), 'avg_turret_dpm'),
      ];
      case 'percentage': return [
        R('Win Rate', winP + '%', 'wins'),
        R('Kill Part%', pct1(s.avg_kp), 'avg_kp'),
        R('Dmg Share%', pct1(s.avg_dmg_share), 'avg_dmg_share'),
        R('Dmg Tkn%', pct1(s.avg_dmg_taken_pct), 'avg_dmg_taken_pct', true),
        R('Turret Dmg%', pct1(s.avg_turret_dmg_pct), 'avg_turret_dmg_pct'),
        R('Gold Share%', pct1(s.avg_gold_share), 'avg_gold_share'),
        R('First Blood%', pct1(s.first_blood_pct), 'first_blood_pct'),
        R('Lord%', pct1(s.lord_pct), 'lord_pct'),
        R('Turtle%', pct1(s.turtle_pct), 'turtle_pct'),
        R('Turret%', pct1(s.turret_pct), 'turret_pct'),
      ];
      case 'milestone': return [
        R('First Bloods', n(s.total_first_bloods), 'total_first_bloods'),
        R('Solo Kills', n(s.total_solo_kills), 'total_solo_kills'),
        R('Double Kills', n(s.total_double_kills), 'total_double_kills'),
        R('Triple Kills', n(s.total_triple_kills), 'total_triple_kills'),
        R('Maniacs', n(s.total_maniacs), 'total_maniacs'),
        R('Savages', n(s.total_savages), 'total_savages'),
        R('Legendaries', n(s.total_legendaries), 'total_legendaries'),
        R('Lord Kills', n(s.total_lord_kills), 'total_lord_kills'),
        R('Lord Steals', n(s.total_lord_steals), 'total_lord_steals'),
        R('Turtle Kills', n(s.total_turtle_kills), 'total_turtle_kills'),
        R('Turtle Steals', n(s.total_turtle_steals), 'total_turtle_steals'),
        R('Turret Dest.', n(s.total_turret_kills), 'total_turret_kills'),
      ];
      default: return [];
    }
  }, [s, perfFilter, allPlayers, roleid, winP, playerRole]);

  const filterLabel = () => {
    const p = [];
    if (phase !== 'overall') p.push(phase);
    if (side !== 'overall') p.push(side === 'blue' ? 'Blue Side' : 'Red Side');
    if (patch && patch !== 'all') p.push(patch);
    return p.length ? p.join(' · ') : 'All Games';
  };

  if (!player) return <div className="page"><div className="container" style={{ paddingTop: 48 }}><div className="empty">Player not found.</div></div></div>;

  const stats = s || {};
  const games = data?.games || [];

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: 24 }}>

        {/* ── Masthead ── */}
        <div style={{
          background: 'linear-gradient(90deg, rgba(26,26,46,0.9) 0%, rgba(18,18,32,0.9) 100%)',
          borderLeft: '4px solid var(--accent)', border: '1px solid var(--border)', borderRadius: 6,
          padding: '20px 24px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/players" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', textDecoration: 'none', letterSpacing: '.08em', textTransform: 'uppercase' }}>← Back to Players</Link>
            <Link href={`/teams/${player.team_code}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 10px' }}>
              <TeamLogo src={player.team_logo_dark} fallbackSrc={img.team(player.team_code)} alt={player.team_code} style={{ width: 20, height: 20, objectFit: 'contain' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', fontWeight: 700 }}>{player.team_code} PROFILE</span>
            </Link>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <PlayerPhoto photoUrl={player.photo_url} name={player.player_name} size={64} />
            <div style={{ flex: 1, minWidth: 200 }}>
              <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>{player.player_name}</h1>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{player.role_lane}</span>
                <span>·</span><span>{player.team_code}</span>
                <span>·</span><span style={{ color: 'var(--muted2)' }}>Active Filter: {filterLabel()}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', minWidth: 65, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>GP</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>{stats.games || 0}</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', minWidth: 65, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>Win%</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: winP >= 50 ? 'var(--win)' : 'var(--loss)', marginTop: 2 }}>{winP}%</div>
              </div>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', minWidth: 65, textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>KDA</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--accent)', marginTop: 2 }}>{n(stats.avg_kda)}</div>
              </div>
              {(stats.voted_game_mvps > 0 || stats.voted_match_mvps > 0) && (
                <div style={{ background: 'rgba(232,184,0,0.06)', border: '1px solid rgba(232,184,0,0.3)', borderRadius: 4, padding: '8px 12px', minWidth: 100, textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#e8b800', textTransform: 'uppercase', fontWeight: 700 }}>★ MVPs</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: '#e8b800', marginTop: 4 }}>
                    {stats.voted_game_mvps > 0 && <span>{stats.voted_game_mvps} GMVP</span>}
                    {stats.voted_game_mvps > 0 && stats.voted_match_mvps > 0 && <span> · </span>}
                    {stats.voted_match_mvps > 0 && <span>{stats.voted_match_mvps} MMVP</span>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="page-layout">
          <FilterSidebar
            phase={phase} setPhase={setPhase}
            patch={patch} setPatch={setPatch} patches={patches}
            side={side} setSide={setSide}
            result={result} setResult={setResult}
          />
          <div className="sidebar-content">

            {/* ── Performance Overview ── */}
            <div className="section-header">Performance Overview</div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,.45)', marginBottom: 12, letterSpacing: '.06em' }}>
              // {filterLabel()} · {stats.games || 0} games · {stats.wins || 0}W {(stats.games || 0) - (stats.wins || 0)}L · {winP}% WR
            </p>

            {(parseInt(stats.games) || 0) === 0 ? (
              <div className="empty" style={{ marginBottom: 32 }}>// No games for this filter</div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                  {PERF_FILTERS.map(f => (
                    <button key={f.key} className={`filter-btn ${perfFilter === f.key ? 'active' : ''}`} onClick={() => setPerfFilter(f.key)} style={{ padding: '6px 12px', fontSize: 10 }}>{f.label}</button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, marginBottom: 32 }}>
                  {perfStats.map(st => (
                    <StatCard key={st.label} label={st.label} value={st.value} rank={st.rank} roleRank={st.roleRank} roleLabel={st.roleLabel} color={st.color} />
                  ))}
                </div>
              </>
            )}

            {/* ── Hero Pool ── */}
            <div className="section-header">Hero Pool</div>
            <div className="tbl-wrap" style={{ border: '1px solid var(--border)' }}>
              {heroPoolLoading ? <div className="loading" style={{ margin: '20px 0' }} /> : (
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Hero</th>
                      <th className="center">GP</th>
                      <th className="center">W</th>
                      <th className="center">Win%</th>
                      <th className="center">Avg KDA</th>
                      <th className="center">Avg KP%</th>
                      <th className="center">Avg Damage</th>
                      <th className="center">Avg GPM</th>
                      {hpExpanded && (
                        <>
                          <th className="center" title="Pick+Ban rate across all games">Prio Pick</th>
                          <th className="center" title="Pick rate when not banned">Adj Pick</th>
                          <th className="center" title="Times picked 1st">1st Pick</th>
                          {side !== 'blue' && <th className="center" title="Red side consecutive picks (orders 8,9)">2-Picks</th>}
                        </>
                      )}
                      <th className="center" title="Win rate across all players using this hero in the meta">Meta Win%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {heroPool.map(h => (
                      <tr key={h.heroid}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <HeroImg heroid={h.heroid} size={32} />
                            <span style={{ fontWeight: 600 }}>{h.hero_name}</span>
                          </div>
                        </td>
                        <td className="num center">{h.games}</td>
                        <td className="num center" style={{ color: 'var(--win)' }}>{h.wins}</td>
                        <td className="num center" style={{ color: h.win_pct >= 50 ? 'var(--win)' : 'var(--loss)' }}>{h.win_pct}%</td>
                        <td className="num center" style={{ color: 'var(--accent)' }}>{n(h.avg_kda)}</td>
                        <td className="num center">{h.avg_kp != null ? h.avg_kp + '%' : '--'}</td>
                        <td className="num center">{big(h.avg_damage)}</td>
                        <td className="num center">{h.avg_gpm != null ? Math.round(h.avg_gpm) : '--'}</td>
                        {hpExpanded && (
                          <>
                            <td className="num center">{h.prio_pick != null ? h.prio_pick + '%' : '--'}</td>
                            <td className="num center">{h.adj_pick != null ? h.adj_pick + '%' : '--'}</td>
                            <td className="num center">{h.first_picks}</td>
                            {side !== 'blue' && <td className="num center">{h.two_picks}</td>}
                          </>
                        )}
                        <td className="num center" style={{ color: h.meta_win_pct != null ? (h.meta_win_pct >= 50 ? 'var(--win)' : 'var(--loss)') : 'inherit' }}>
                          {h.meta_win_pct != null ? h.meta_win_pct + '%' : '--'}
                        </td>
                      </tr>
                    ))}
                    {heroPool.length === 0 && (
                      <tr><td colSpan={hpExpanded ? (side === 'blue' ? 12 : 13) : 9} className="empty" style={{ textAlign: 'center', padding: 20 }}>// No games for this filter</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, marginBottom: 32 }}>
              <button onClick={() => setHpExpanded(!hpExpanded)} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                {hpExpanded ? '– Less stats' : '+ More stats'}
              </button>
            </div>

            {/* ── Player Comparison ── */}
            <div className="section-header">Player Comparison</div>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20, border: '1px solid var(--border)', background: 'var(--surface)', maxWidth: 480 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.1em', padding: '0 12px', borderRight: '1px solid var(--border)', whiteSpace: 'nowrap', alignSelf: 'stretch', display: 'flex', alignItems: 'center' }}>COMPARE VS</span>
              <select value={compareRoleid} onChange={e => setCompareRoleid(e.target.value)} style={{ flex: 1, background: 'transparent', border: 'none', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '10px 12px', cursor: 'pointer', outline: 'none' }}>
                <option value="">— Select a {playerRole} —</option>
                {allEnriched.filter(p => p.role_lane === playerRole && String(p.roleid) !== String(roleid)).sort((a, b) => a.player_name.localeCompare(b.player_name)).map(p => (
                  <option key={p.roleid} value={p.roleid}>{p.player_name} ({p.team_code})</option>
                ))}
              </select>
            </div>

            {compareRoleid && (() => {
              const me = allEnriched.find(p => String(p.roleid) === String(roleid));
              const them = allEnriched.find(p => String(p.roleid) === String(compareRoleid));
              if (!me || !them) return null;
              const rl = ROLE_SHORT[playerRole] || 'role';
              const clr = r => r === 1 ? '#e8b800' : r === 2 ? '#c0c0c0' : r === 3 ? '#cd7f32' : 'rgba(255,255,255,.35)';
              const wl = h => `${h.wins}-${h.games - h.wins}`;
              const sharedHeroes = heroPool.filter(h => compareHeroPool.some(c => c.heroid === h.heroid)).map(h => ({ ...h, them: compareHeroPool.find(c => c.heroid === h.heroid) })).sort((a, b) => (b.games + b.them.games) - (a.games + a.them.games));
              const myUnique = heroPool.filter(h => !compareHeroPool.some(c => c.heroid === h.heroid));
              const theirUnique = compareHeroPool.filter(c => !heroPool.some(h => h.heroid === c.heroid));
              return (
                <>
                  <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', marginBottom: 24 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end', padding: '12px 16px', borderRight: '1px solid var(--border)' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{me.player_name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>{me.team_code} · {me.games || 0} GP</div>
                        </div>
                        <PlayerPhoto photoUrl={me.photo_url} name={me.player_name} size={40} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em' }}>VS</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderLeft: '1px solid var(--border)' }}>
                        <PlayerPhoto photoUrl={them.photo_url} name={them.player_name} size={40} />
                        <div>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{them.player_name}</div>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>{them.team_code} · {them.games || 0} GP</div>
                        </div>
                      </div>
                    </div>
                    {COMPARE_STATS.map((stat, si) => {
                      const aRaw = parseFloat(me[stat.key] ?? NaN);
                      const bRaw = parseFloat(them[stat.key] ?? NaN);
                      const aWins = !isNaN(aRaw) && !isNaN(bRaw) && aRaw !== bRaw && (stat.lb ? aRaw < bRaw : aRaw > bRaw);
                      const bWins = !isNaN(aRaw) && !isNaN(bRaw) && aRaw !== bRaw && (stat.lb ? bRaw < aRaw : bRaw > aRaw);
                      const aRoleRank = rankAmongRole(allEnriched, me.roleid, playerRole, stat.key, stat.lb);
                      const bRoleRank = rankAmongRole(allEnriched, them.roleid, playerRole, stat.key, stat.lb);
                      const tot = (isNaN(aRaw) ? 0 : aRaw) + (isNaN(bRaw) ? 0 : bRaw);
                      const aPct = tot > 0 ? Math.round((isNaN(aRaw) ? 0 : aRaw) / tot * 100) : 50;
                      return (
                        <div key={stat.label} style={{ borderBottom: si < COMPARE_STATS.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', alignItems: 'center', padding: '8px 0' }}>
                            <div style={{ textAlign: 'right', paddingRight: 16, paddingLeft: 8 }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: aWins ? 'var(--accent)' : 'var(--text)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                                {aWins && <span style={{ fontSize: 12 }}>▲</span>}{stat.fmt(me[stat.key])}
                              </div>
                              {aRoleRank && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: clr(aRoleRank), textAlign: 'right' }}>#{aRoleRank} {rl}</div>}
                            </div>
                            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.45)', letterSpacing: '.06em' }}>{stat.label}</div>
                            <div style={{ paddingLeft: 16, paddingRight: 8 }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: bWins ? 'var(--text)' : 'rgba(255,255,255,.5)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {stat.fmt(them[stat.key])}{bWins && <span style={{ fontSize: 12 }}>▲</span>}
                              </div>
                              {bRoleRank && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: clr(bRoleRank) }}>#{bRoleRank} {rl}</div>}
                            </div>
                          </div>
                          {!isNaN(aRaw) && !isNaN(bRaw) && (
                            <div style={{ display: 'flex', height: 3, margin: '0 0 2px' }}>
                              <div style={{ width: aPct + '%', background: aWins ? 'var(--accent)' : 'rgba(255,255,255,.12)' }} />
                              <div style={{ flex: 1, background: bWins ? 'rgba(255,255,255,.35)' : 'rgba(255,255,255,.06)' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--muted2)', letterSpacing: '.1em', marginBottom: 10 }}>// UNIQUE &amp; SHARED HEROES</div>
                  {compareHeroLoading ? <div className="loading" style={{ marginBottom: 32 }} /> : (
                    <div style={{ marginBottom: 32, border: '1px solid var(--border)', background: 'var(--surface)' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', borderBottom: '1px solid var(--border)' }}>
                        {[
                          { label: `${me.player_name} only`, count: myUnique.length, align: 'right' },
                          { label: 'shared', count: sharedHeroes.length, align: 'center' },
                          { label: `${them.player_name} only`, count: theirUnique.length, align: 'left' },
                        ].map((col, i) => (
                          <div key={i} style={{ padding: '8px 12px', borderLeft: i > 0 ? '1px solid var(--border)' : undefined, textAlign: col.align }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>{col.label} </span>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--accent)' }}>({col.count})</span>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr' }}>
                        <div style={{ borderRight: '1px solid var(--border)', padding: '12px 10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {myUnique.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,.25)', textAlign: 'right' }}>—</div>}
                            {myUnique.map(h => (
                              <div key={h.heroid} style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: h.win_pct >= 50 ? 'var(--win)' : 'var(--loss)', fontWeight: 700 }}>{wl(h)}</span>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                  <HeroImg heroid={h.heroid} size={32} />
                                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{h.hero_name}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ borderRight: '1px solid var(--border)', padding: '12px 16px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {sharedHeroes.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,.25)', textAlign: 'center' }}>—</div>}
                            {sharedHeroes.map(h => {
                              const aB = h.win_pct > h.them.win_pct;
                              const bB = h.them.win_pct > h.win_pct;
                              return (
                                <div key={h.heroid} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: aB ? 700 : 400, color: aB ? 'var(--win)' : bB ? 'rgba(255,255,255,.3)' : 'var(--text)', minWidth: 36, textAlign: 'right' }}>{wl(h)}</span>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1 }}>
                                    <HeroImg heroid={h.heroid} size={32} />
                                    <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{h.hero_name}</span>
                                  </div>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: bB ? 700 : 400, color: bB ? 'var(--win)' : aB ? 'rgba(255,255,255,.3)' : 'var(--text)', minWidth: 36 }}>{wl(h.them)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                        <div style={{ padding: '12px 10px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {theirUnique.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,.25)' }}>—</div>}
                            {theirUnique.map(h => (
                              <div key={h.heroid} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                  <HeroImg heroid={h.heroid} size={32} />
                                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap' }}>{h.hero_name}</span>
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: h.win_pct >= 50 ? 'var(--win)' : 'var(--loss)', fontWeight: 700 }}>{wl(h)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* ── Stats vs Teams ── */}
            <div className="section-header">Stats vs Teams</div>
            <VsTeamsTable vsTeams={vsTeams} vsLoading={vsLoading} />

            {/* ── Win vs Loss Stats ── */}
            <div className="section-header">Win vs Loss Stats</div>
            {vsLoading ? <div className="loading" style={{ marginBottom: 32 }} /> : (() => {
              const W = winLoss.find(r => r.is_winner === true);
              const L = winLoss.find(r => r.is_winner === false);
              if (!W && !L) return <div className="empty" style={{ marginBottom: 32 }}>// No games for this filter</div>;
              const wGames = W?.games || 0, lGames = L?.games || 0, totalG = wGames + lGames;
              const wPctBar = totalG > 0 ? Math.round(wGames / totalG * 100) : 50;
              return (
                <div style={{ marginBottom: 32 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', marginBottom: 16, border: '1px solid var(--border)' }}>
                    <div style={{ background: 'var(--surface)', borderRight: '1px solid var(--border)', padding: '14px 20px', borderLeft: '3px solid var(--win)', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--win)', letterSpacing: '.1em', marginBottom: 6 }}>WIN</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--win)', lineHeight: 1 }}>{wGames}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>games</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', background: 'var(--surface)' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.3)', letterSpacing: '.1em', marginBottom: 6 }}>TOTAL</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{totalG}</div>
                      <div style={{ height: 4, width: 80, background: 'rgba(255,255,255,.08)', borderRadius: 2, marginTop: 8, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: wPctBar + '%', background: 'var(--win)', borderRadius: 2 }} />
                      </div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>{wPctBar}% WR</div>
                    </div>
                    <div style={{ background: 'var(--surface)', borderLeft: '1px solid var(--border)', padding: '14px 20px', borderRight: '3px solid var(--loss)', textAlign: 'center' }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--loss)', letterSpacing: '.1em', marginBottom: 6 }}>LOSS</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 900, color: 'var(--loss)', lineHeight: 1 }}>{lGames}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,.4)', marginTop: 4 }}>games</div>
                    </div>
                  </div>
                  <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
                    {WL_STATS.map((stat, si) => {
                      const wv = parseFloat(W?.[stat.key] ?? NaN);
                      const lv = parseFloat(L?.[stat.key] ?? NaN);
                      const wBetter = !isNaN(wv) && !isNaN(lv) && wv !== lv && (stat.lb ? wv < lv : wv > lv);
                      const lBetter = !isNaN(wv) && !isNaN(lv) && wv !== lv && (stat.lb ? lv < wv : lv > wv);
                      const tot = (isNaN(wv) ? 0 : wv) + (isNaN(lv) ? 0 : lv);
                      const wBarPct = tot > 0 ? Math.round((isNaN(wv) ? 0 : wv) / tot * 100) : 50;
                      return (
                        <div key={stat.label} style={{ borderBottom: si < WL_STATS.length - 1 ? '1px solid rgba(255,255,255,.04)' : 'none' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px 1fr', alignItems: 'center', padding: '8px 0' }}>
                            <div style={{ textAlign: 'right', paddingRight: 20, paddingLeft: 8 }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: wBetter ? 'var(--win)' : 'rgba(255,255,255,.6)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                                {wBetter && <span style={{ fontSize: 10, color: 'var(--win)' }}>▲</span>}{stat.fmt(W?.[stat.key])}
                              </div>
                            </div>
                            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.4)', letterSpacing: '.06em' }}>{stat.label}</div>
                            <div style={{ paddingLeft: 20, paddingRight: 8 }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: lBetter ? 'var(--loss)' : 'rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                                {stat.fmt(L?.[stat.key])}{lBetter && <span style={{ fontSize: 10, color: 'var(--loss)' }}>▲</span>}
                              </div>
                            </div>
                          </div>
                          {!isNaN(wv) && !isNaN(lv) && (
                            <div style={{ display: 'flex', height: 2, margin: '0 0 2px' }}>
                              <div style={{ width: wBarPct + '%', background: wBetter ? 'var(--win)' : 'rgba(255,255,255,.1)' }} />
                              <div style={{ flex: 1, background: lBetter ? 'var(--loss)' : 'rgba(255,255,255,.05)' }} />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ── Game Log ── */}
            <details className="collapsible" style={{ marginBottom: 32 }}>
              <summary><span className="section-header" style={{ marginBottom: 0 }}><span className="disclosure">▶</span>Game Log</span></summary>
              <div className="collapsible-body">
                <div className="tbl-wrap" style={{ border: '1px solid var(--border)' }}>
                  <table className="tbl">
                    <thead>
                      <tr>
                        <th style={{ position: 'sticky', top: 0, left: 0, zIndex: 3, background: 'var(--surface)', boxShadow: '2px 0 8px rgba(0,0,0,.5)' }}>Match</th>
                        <th style={{ position: 'sticky', top: 0, left: 120, zIndex: 3, background: 'var(--surface)', boxShadow: '2px 0 8px rgba(0,0,0,.4)' }}>Hero</th>
                        <th className="center" style={{ whiteSpace: 'nowrap', minWidth: 120 }}>Skill · Emblem</th>
                        <th className="center" style={{ minWidth: 220 }}>Items</th>
                        <th className="center">Side</th>
                        <th className="center" style={{ color: 'var(--accent)' }}>KDA</th>
                        <th className="center">KP%</th>
                        <th className="center">K</th>
                        <th className="center">D</th>
                        <th className="center">A</th>
                        <th className="center">CC(s)</th>
                        <th className="center">Dmg</th>
                        <th className="center">Dmg%</th>
                        <th className="center">DPM</th>
                        {logExpanded && (
                          <>
                            <th className="center">Dmg Tkn</th>
                            <th className="center">DTPM</th>
                            <th className="center">Trt Dmg</th>
                            <th className="center">TDPM</th>
                            <th className="center">Self Heal</th>
                            <th className="center">Ally Heal</th>
                            <th className="center">Gold</th>
                          </>
                        )}
                        <th className="center">GPM</th>
                        <th className="center">Gold%</th>
                        {logExpanded && (
                          <>
                            <th className="center">EXP</th>
                            <th className="center">Lvl</th>
                            <th className="center">Lord K</th>
                            <th className="center">Lord Stl</th>
                            <th className="center">Turtle K</th>
                            <th className="center">Turtle Stl</th>
                            <th className="center">Turrets</th>
                            <th className="center">FB</th>
                            <th className="center">Solo</th>
                            <th className="center">2K</th>
                            <th className="center">3K</th>
                            <th className="center">Maniac</th>
                            <th className="center">Savage</th>
                            <th className="center">Legend</th>
                          </>
                        )}
                        <th className="center" style={{ whiteSpace: 'nowrap' }}>Result</th>
                        <th className="center">Awards</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map(g => {
                        const isGMVP = g.voted_game_mvp, isMMVP = g.voted_match_mvp;
                        const sd = g.campid === 1 ? 'BLUE' : g.campid === 2 ? 'RED' : '--';
                        const sideColor = g.campid === 1 ? 'var(--blue)' : g.campid === 2 ? 'var(--loss)' : 'var(--muted)';
                        const items = [g.equip_1, g.equip_2, g.equip_3, g.equip_4, g.equip_5, g.equip_6, g.equip_7].filter(Boolean);
                        const itemNames = [g.equip_1_name, g.equip_2_name, g.equip_3_name, g.equip_4_name, g.equip_5_name, g.equip_6_name, g.equip_7_name];
                        const talents = [[g.rune_map_1, g.rune_map_1_name], [g.rune_map_2, g.rune_map_2_name], [g.rune_map_3, g.rune_map_3_name]].filter(t => t[0]);
                        const p1 = v => v != null ? v + '%' : '--';
                        const rowAccent = g.is_winner ? 'var(--win)' : 'var(--loss)';
                        const rowBg = isGMVP ? 'rgba(255,215,0,.04)' : isMMVP ? 'rgba(232,184,0,.03)' : undefined;
                        const stickyBg = isGMVP ? 'rgba(20,18,10,.95)' : isMMVP ? 'rgba(18,14,8,.95)' : 'var(--surface)';
                        const seriesParts = (g.series_name || '').split(' vs ');
                        const oppTeamCode = seriesParts.find(p => p.trim() !== player.team_code)?.trim();
                        return (
                          <tr key={g.battle_id} style={{ background: rowBg, borderLeft: `3px solid ${rowAccent}` }}>
                            <td style={{ position: 'sticky', left: 0, zIndex: 2, background: stickyBg, boxShadow: '2px 0 8px rgba(0,0,0,.5)' }}>
                              <Link href={`/matches/${g.battle_id}`} style={{ color: 'var(--text)', textDecoration: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {g.opp_team_code && (
                                  <TeamLogo
                                    src={g.opp_team_logo_dark}
                                    fallbackSrc={img.team(g.opp_team_code)}
                                    alt={g.opp_team_code}
                                    style={{ width: 24, height: 24, objectFit: 'contain' }}
                                  />
                                )}
                                <div style={{ fontWeight: 700, fontSize: 13 }}>{g.series_name || g.room_name || '--'}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>{g.week_number ? `W${g.week_number}` : ''} {g.game_number ? `G${g.game_number}` : ''}</div>
                              </Link>
                            </td>
                            <td style={{ position: 'sticky', left: 120, zIndex: 2, background: stickyBg, boxShadow: '2px 0 8px rgba(0,0,0,.4)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                                <HeroImg heroid={g.heroid} size={32} />
                                <span style={{ fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap' }}>{g.hero_name}</span>
                              </div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap', minWidth: 150, padding: '4px 10px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {g.skillid && <SkillImg skillid={g.skillid} size={24} />}
                                {g.rune_id && <RuneImg runeMap={g.rune_id} size={22} title={g.emblem_name} />}
                                {talents.map(([id, name], i) => <RuneImg key={i} runeMap={id} size={20} title={name} />)}
                              </div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap', minWidth: 220, padding: '4px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {items.map((eq, i) => <ItemImg key={i} equipId={eq} size={24} title={itemNames[i]} />)}
                              </div>
                            </td>
                            <td className="center"><span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: sideColor }}>{sd}</span></td>
                            <td className="num center" style={{ color: 'var(--accent)', fontWeight: 700 }}>{g.computed_kda}</td>
                            <td className="num center">{p1(g.kill_participation)}</td>
                            <td className="num center" style={{ color: 'var(--win)' }}>{g.kill_num}</td>
                            <td className="num center" style={{ color: 'var(--loss)' }}>{g.dead_num}</td>
                            <td className="num center">{g.assist_num}</td>
                            <td className="num center">{n(g.cc_sec)}</td>
                            <td className="num center">{big(g.total_damage)}</td>
                            <td className="num center">{p1(g.damage_dealt_pct)}</td>
                            <td className="num center">{n(g.dpm)}</td>
                            {logExpanded && (
                              <>
                                <td className="num center">{big(g.total_hurt)}</td>
                                <td className="num center">{n(g.dtpm)}</td>
                                <td className="num center">{big(g.total_damage_tower)}</td>
                                <td className="num center">{n(g.turret_dpm)}</td>
                                <td className="num center">{big(g.total_heal)}</td>
                                <td className="num center">{big(g.total_heal_other)}</td>
                                <td className="num center">{big(g.total_gold)}</td>
                              </>
                            )}
                            <td className="num center">{n(g.gold_per_min)}</td>
                            <td className="num center">{p1(g.gold_pct)}</td>
                            {logExpanded && (
                              <>
                                <td className="num center">{g.exp_total != null ? big(g.exp_total) : '--'}</td>
                                <td className="num center">{g.level != null ? g.level : '--'}</td>
                                <td className="num center">{g.lord_kills || 0}</td>
                                <td className="num center">{g.lord_steal || 0}</td>
                                <td className="num center">{g.turtle_kills || 0}</td>
                                <td className="num center">{g.turtle_steal || 0}</td>
                                <td className="num center">{g.turret_kills || 0}</td>
                                <td className="num center">{g.first_blood || 0}</td>
                                <td className="num center">{g.solo_kill || 0}</td>
                                <td className="num center">{g.double_kill || 0}</td>
                                <td className="num center">{g.triple_kill || 0}</td>
                                <td className="num center">{g.maniac || 0}</td>
                                <td className="num center">{g.savage || 0}</td>
                                <td className="num center">{g.legendary || 0}</td>
                              </>
                            )}
                            <td className="center">
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, color: g.is_winner ? 'var(--win)' : 'var(--loss)', background: g.is_winner ? 'rgba(0,255,159,.1)' : 'rgba(255,60,90,.1)', border: `1px solid ${g.is_winner ? 'rgba(0,255,159,.3)' : 'rgba(255,60,90,.3)'}`, padding: '2px 8px', display: 'inline-block' }}>
                                {g.is_winner ? 'WIN' : 'LOSS'}
                              </span>
                            </td>
                            <td className="center" style={{ minWidth: 90, padding: '4px 8px' }}>
                              <div style={{ display: 'flex', gap: 4, justifyContent: 'center', alignItems: 'center', flexWrap: 'nowrap' }}>
                                {g.mvp && <span title="In-game MVP" style={{ color: 'var(--muted)', fontSize: 14 }}>★</span>}
                                {isGMVP && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', background: 'rgba(255,215,0,.12)', border: '1px solid var(--accent)', padding: '1px 5px', borderRadius: 2 }}>GMVP</span>}
                                {isMMVP && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: '#e8b800', background: 'rgba(232,184,0,.12)', border: '1px solid #e8b800', padding: '1px 5px', borderRadius: 2 }}>MMVP</span>}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {games.length === 0 && (
                        <tr><td colSpan={logExpanded ? 39 : 18} className="empty">// No games for this filter</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={() => setLogExpanded(!logExpanded)} style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', letterSpacing: '.08em', textTransform: 'uppercase' }}>
                    {logExpanded ? '– Less stats' : '+ More stats'}
                  </button>
                </div>
              </div>
            </details>

          </div>
        </div>
      </div>
    </div>
  );
}
