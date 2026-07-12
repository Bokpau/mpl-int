'use client';
import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { HeroImg, TeamImg, PlayerPhoto, RoleImg, ItemImg, SkillImg, RuneImg } from '../../../components/Images';
import FilterSidebar from '../../../components/FilterSidebar';
import TeamLogo from '../../../components/TeamLogo';
import StatTable from '../../../components/StatTable';
import { PLAYER_COLUMNS, STAT_GROUPS } from '../../../lib/columns';
import { img } from '../../../lib/images';
import SynergyTable from '../../../components/SynergyTable';

const API = '';

function n(v) { return (v !== null && v !== undefined && v !== '' && !isNaN(v)) ? v : '--'; }
function big(v) { return (v !== null && v !== undefined && v !== '') ? Math.round(v).toLocaleString() : '--'; }
function pct(w, g) { return g > 0 ? Math.round(w / g * 100) : 0; }

function rankAmong(all, heroid, key, lb = false) {
  if (!all?.length) return null;
  const sorted = [...all].filter(h => h[key] != null).sort((a, b) =>
    lb ? parseFloat(a[key]) - parseFloat(b[key]) : parseFloat(b[key]) - parseFloat(a[key])
  );
  const i = sorted.findIndex(h => String(h.hero_id) === String(heroid) || String(h.heroid) === String(heroid));
  return i >= 0 ? i + 1 : null;
}

function rankAmongRole(all, heroid, roleKey, key, lb = false) {
  if (!all?.length) return null;
  const pool = all.filter(h => parseInt(h[roleKey]) > 0);
  const sorted = [...pool].filter(h => h[key] != null).sort((a, b) =>
    lb ? parseFloat(a[key]) - parseFloat(b[key]) : parseFloat(b[key]) - parseFloat(a[key])
  );
  const i = sorted.findIndex(h => String(h.hero_id) === String(heroid) || String(h.heroid) === String(heroid));
  return i >= 0 ? i + 1 : null;
}

const ROLE_KEYS = [
  { role: 'EXP LANE', key: 'role_exp' }, { role: 'JUNGLE', key: 'role_jungle' },
  { role: 'MID LANE', key: 'role_mid' }, { role: 'ROAM', key: 'role_roam' }, { role: 'GOLD LANE', key: 'role_gold' },
];

function RoleDistribution({ s, total }) {
  if (!total) return <span style={{ color: 'var(--muted2)', fontSize: 10 }}>—</span>;
  const active = ROLE_KEYS.filter(({ key }) => parseInt(s[key]) > 0);
  if (active.length === 1) {
    const { role } = active[0];
    return (
      <span title={role} aria-label={role} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <RoleImg role={role} size={16} />
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 130 }}>
      {active.map(({ role, key }) => {
        const p = Math.round(parseInt(s[key]) / total * 100);
        return (
          <div key={role} title={role} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RoleImg role={role} size={11} />
            <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3 }}>
              <div style={{ width: p + '%', height: '100%', background: 'var(--neutral2)', borderRadius: 3 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', minWidth: 28, textAlign: 'right' }}>{p}%</span>
          </div>
        );
      })}
    </div>
  );
}



function DraftCard({ label, value, sub, color, dimmed }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      padding: '12px 16px', minWidth: 100, flex: '1 1 100px',
      opacity: dimmed ? 0.4 : 1,
    }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.55)', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,.35)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function StatCard({ label, value, rank, color, roleRanks }) {
  const clr = r => r === 1 ? '#e8b800' : r === 2 ? '#c0c0c0' : r === 3 ? '#cd7f32' : 'rgba(255,255,255,.35)';
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '14px 16px', minWidth: 110 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.55)', letterSpacing: '.06em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>{value}</div>
      {rank && value !== '--' && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: clr(rank), marginTop: 6 }}>#{rank} overall</div>}
      {roleRanks && value !== '--' && roleRanks.map(({ rank: rr, role }) => (
        <div key={role} title={role} style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--muted)', marginTop: 2 }}>
          <RoleImg role={role} size={11} /> #{rr}
        </div>
      ))}
    </div>
  );
}

const PERF_FILTERS = [
  { key: 'average', label: 'Average' }, { key: 'total', label: 'Total' },
  { key: 'per_minute', label: 'Per Minute' }, { key: 'percentage', label: 'Percentage' },
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

export default function CurrentHeroDashboard({ heroid, scope, season, initialOverview }) {
  const [data, setData] = useState(initialOverview);
  const [allHeroes, setAllHeroes] = useState([]);
  const [heroBaseRoles, setHeroBaseRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patches, setPatches] = useState([]);
  const [phase, setPhase] = useState('overall');
  const [side, setSide] = useState('overall');
  const [result, setResult] = useState('all');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [perfFilter, setPerfFilter] = useState('average');
  const [compareHid, setCompareHid] = useState('');
  const [vsTeams, setVsTeams] = useState([]);
  const [winLoss, setWinLoss] = useState([]);
  const [vsLoading, setVsLoading] = useState(false);
  const [draftData, setDraftData] = useState(null);
  const [draftLoad, setDraftLoad] = useState(false);
  const [compareRole, setCompareRole] = useState(null);
  const [compareHeroes, setCompareHeroes] = useState([]);
  const [compareAllLoad, setCompareAllLoad] = useState(false);
  const [synergy, setSynergy] = useState(null);
  const [matchup, setMatchup] = useState(null);
  const [synergyLoad, setSynergyLoad] = useState(false);
  const [players, setPlayers] = useState([]);
  const [playersLoad, setPlayersLoad] = useState(false);
  const [games, setGames] = useState([]);
  const [gamesLoad, setGamesLoad] = useState(false);
  const [patch, setPatch] = useState(null);
  const [logExpanded, setLogExpanded] = useState(false);

  const buildQ = () => {
    const p = [];
    p.push(`scope=${scope}`);
    p.push(`season=${season}`);
    if (phase !== 'overall') p.push(`stage=${phase === 'Wild Card' ? 'qualifier' : 'main'}`);
    if (side !== 'overall') p.push(`side=${side}`);
    if (result !== 'all') p.push(`result=${result}`);
    if (patch !== null && patch !== 'all') p.push(`patch=${encodeURIComponent(patch)}`);
    return p.length ? '?' + p.join('&') : '';
  };

  // Fetch patches once
  useEffect(() => {
    fetch(`/api/intl/patches?scope=${scope}&season=${season}`)
      .then(r => r.json())
      .then(d => setPatches(Array.isArray(d) ? d : []))
      .catch(() => { });
  }, [scope, season]);

  // Reset base roles when heroid changes
  useEffect(() => {
    setHeroBaseRoles([]);
  }, [heroid]);

  // Fetch dynamic stats based on filters
  useEffect(() => {
    setLoading(true);
    const q = buildQ();
    const roleQ = roleFilter !== 'ALL' ? `${q}&role=${encodeURIComponent(roleFilter)}` : q;

    Promise.all([
      fetch(`/api/intl/heroes/${heroid}/overview${roleQ}`).then(r => r.json()).catch(() => null),
      fetch(`/api/intl/heroes${roleQ}`).then(r => r.json()).catch(() => []),
      fetch(`/api/intl/stats/draft/hero-roles${q}`).then(r => r.json()).catch(() => ({})),
    ]).then(([heroData, all, hr]) => {
      if (heroData) {
        const hRoles = hr[heroid] || {};
        const enrichedHero = {
          ...heroData,
          role_exp: hRoles['EXP LANE'] || 0,
          role_jungle: hRoles['JUNGLE'] || 0,
          role_mid: hRoles['MID LANE'] || 0,
          role_roam: hRoles['ROAM'] || 0,
          role_gold: hRoles['GOLD LANE'] || 0,
          primary_role: Object.keys(hRoles).filter(k => k !== 'total').sort((a, b) => hRoles[b] - hRoles[a])[0] || '',
        };
        setData(enrichedHero);

        if (roleFilter === 'ALL') {
          const roles = ROLE_KEYS.filter(({ key }) => parseInt(enrichedHero[key]) > 0).map(({ role }) => role);
          if (roles.length) setHeroBaseRoles(roles);
        }
      }

      const rows = (Array.isArray(all) ? all : []).map(h => {
        const hRoles = hr[h.hero_id] || {};
        return {
          ...h,
          win_pct: h.win_rate != null ? Math.round(parseFloat(h.win_rate)) : 0,
          games: parseInt(h.picks) || 0,
          wins: parseInt(h.wins) || 0,
          avg_kda: h.kda,
          avg_gpm: h.gpm,
          avg_dpm: h.dpm,
          role_exp: hRoles['EXP LANE'] || 0,
          role_jungle: hRoles['JUNGLE'] || 0,
          role_mid: hRoles['MID LANE'] || 0,
          role_roam: hRoles['ROAM'] || 0,
          role_gold: hRoles['GOLD LANE'] || 0,
          primary_role: Object.keys(hRoles).filter(k => k !== 'total').sort((a, b) => hRoles[b] - hRoles[a])[0] || '',
        };
      });
      setAllHeroes(rows);
      setLoading(false);
    });
  }, [heroid, phase, side, result, patch, roleFilter, scope, season]);

  // Fetch vs-teams & win-loss
  useEffect(() => {
    setVsLoading(true);
    const q = buildQ();
    const roleQ = roleFilter !== 'ALL' ? `${q}&role=${encodeURIComponent(roleFilter)}` : q;

    Promise.all([
      fetch(`/api/intl/heroes/${heroid}/vs-teams${roleQ}`).then(r => r.json()).catch(() => []),
      fetch(`/api/intl/heroes/${heroid}/win-loss${roleQ}`).then(r => r.json()).catch(() => []),
    ]).then(([vt, wl]) => {
      setVsTeams(Array.isArray(vt) ? vt : []);
      setWinLoss(Array.isArray(wl) ? wl : []);
      setVsLoading(false);
    });
  }, [heroid, phase, side, result, patch, roleFilter, scope, season]);

  // Fetch draft stats
  useEffect(() => {
    setDraftLoad(true);
    const q = buildQ();
    fetch(`/api/intl/heroes/${heroid}/draft-stats${q}`)
      .then(r => r.json())
      .then(d => {
        setDraftData(d);
        setDraftLoad(false);
      })
      .catch(() => setDraftLoad(false));
  }, [heroid, phase, side, result, patch, scope, season]);

  // Fetch synergy & matchups
  useEffect(() => {
    setSynergyLoad(true);
    const q = buildQ();
    Promise.all([
      fetch(`/api/intl/stats/draft/hero-synergy/${heroid}${q}`).then(r => r.json()).catch(() => null),
      fetch(`/api/intl/stats/draft/role-matchup/${heroid}${q}`).then(r => r.json()).catch(() => null),
    ]).then(([syn, mu]) => {
      setSynergy(syn);
      setMatchup(mu);
      setSynergyLoad(false);
    });
  }, [heroid, phase, side, result, patch, scope, season]);

  // Fetch players table
  useEffect(() => {
    setPlayersLoad(true);
    const q = buildQ();
    const roleQ = roleFilter !== 'ALL' ? `${q}&role=${encodeURIComponent(roleFilter)}` : q;
    fetch(`/api/intl/leaderboard${roleQ}&hero=${heroid}`)
      .then(r => r.json())
      .then(d => {
        setPlayers(Array.isArray(d) ? d : []);
        setPlayersLoad(false);
      })
      .catch(() => setPlayersLoad(false));
  }, [heroid, phase, side, result, patch, roleFilter, scope, season]);

  // Fetch games log
  useEffect(() => {
    setGamesLoad(true);
    const q = buildQ();
    const roleQ = roleFilter !== 'ALL' ? `${q}&role=${encodeURIComponent(roleFilter)}` : q;
    fetch(`/api/intl/heroes/${heroid}/games${roleQ}`)
      .then(r => r.json())
      .then(d => {
        setGames(Array.isArray(d) ? d : []);
        setGamesLoad(false);
      })
      .catch(() => setGamesLoad(false));
  }, [heroid, phase, side, result, patch, roleFilter, scope, season]);

  const s = data || {};
  const total = parseInt(s.picks || s.games) || 0;
  const winP = total > 0 ? pct(parseInt(s.wins), total) : 0;

  // Active roles for comparison
  const activeCompareRoles = useMemo(() => {
    if (!s) return [];
    return ROLE_KEYS.filter(({ key }) => parseInt(s[key]) > 0).map(({ role }) => role);
  }, [s]);

  useEffect(() => {
    if (!activeCompareRoles.length) return;
    if (!compareRole || !activeCompareRoles.includes(compareRole)) {
      const primary = s.primary_role;
      setCompareRole(activeCompareRoles.includes(primary) ? primary : activeCompareRoles[0]);
    }
  }, [activeCompareRoles, compareRole, s.primary_role]);

  // Reset comparison when role switches
  useEffect(() => {
    setCompareHid('');
  }, [compareRole]);

  // Fetch role-filtered hero pool for comparison
  useEffect(() => {
    if (!compareRole) return;
    setCompareAllLoad(true);
    const q = buildQ();
    fetch(`/api/intl/heroes${q}&role=${encodeURIComponent(compareRole)}`)
      .then(r => r.json())
      .then(d => {
        const rows = (Array.isArray(d) ? d : []).map(h => ({
          ...h,
          win_pct: h.win_rate != null ? Math.round(parseFloat(h.win_rate)) : 0,
          games: parseInt(h.picks) || 0,
          wins: parseInt(h.wins) || 0,
          avg_kda: h.kda,
          avg_gpm: h.gpm,
          avg_dpm: h.dpm,
        }));
        setCompareHeroes(rows);
        setCompareAllLoad(false);
      })
      .catch(() => setCompareAllLoad(false));
  }, [compareRole, phase, side, result, patch, scope, season]);

  const perfStats = useMemo(() => {
    if (!s || !total) return [];
    const p1 = v => v != null && v !== '' ? v + '%' : '--';
    const activeRoles = ROLE_KEYS.filter(({ key: rk }) => parseInt(s[rk]) > 0);
    const showRoleRanks = activeRoles.length >= 1 && roleFilter === 'ALL';

    const R = (label, value, key, lb = false, color) => ({
      label, value, color,
      rank: rankAmong(allHeroes, heroid, key, lb),
      roleRanks: showRoleRanks
        ? activeRoles
            .map(({ role, key: rk }) => ({ role, rank: rankAmongRole(allHeroes, heroid, rk, key, lb) }))
            .filter(({ rank }) => rank !== null)
        : undefined,
    });

    switch (perfFilter) {
      case 'average': return [
        R('KDA', n(s.kda || s.avg_kda), 'kda', false, 'var(--accent)'),
        R('Kills/Game', n(s.avg_kills), 'avg_kills'),
        R('Deaths/Game', n(s.avg_deaths), 'avg_deaths', true),
        R('Assists/Game', n(s.avg_assists), 'avg_assists'),
        R('Avg Damage', big(s.avg_damage), 'avg_damage'),
        R('Avg Dmg Taken', big(s.avg_damage_taken), 'avg_damage_taken', true),
        R('Avg Turret Dmg', big(s.avg_turret_damage), 'avg_turret_damage'),
        R('Avg Gold', big(s.avg_gold || (s.total_gold ? s.total_gold / total : null)), 'avg_gold'),
        R('Avg EXP', big(s.avg_exp), 'avg_exp'),
        R('Avg Level', n(s.avg_level), 'avg_level'),
      ];
      case 'total': return [
        R('Total Kills', big(s.total_kills), 'total_kills'),
        R('Total Deaths', big(s.total_deaths), 'total_deaths', true),
        R('Total Assists', big(s.total_assists), 'total_assists'),
        R('Total Damage', big(s.total_damage), 'total_damage'),
        R('Total Dmg Taken', big(s.total_damage_taken), 'total_damage_taken', true),
        R('Total Turret Dmg', big(s.total_turret_damage), 'total_turret_damage'),
        R('Total Gold', big(s.total_gold), 'total_gold'),
        R('Players Used', n(s.players), 'players'),
        R('In-Game MVPs', n(s.mvps), 'mvps'),
        R('Savages', n(s.savages), 'savages'),
        R('Maniacs', n(s.maniacs), 'maniacs'),
      ];
      case 'per_minute': return [
        R('GPM', big(s.gpm), 'gpm'),
        R('DPM', big(s.dpm), 'dpm'),
        R('Dmg Tkn/Min', n(s.dtpm), 'dtpm', true),
        R('Turret Dmg/Min', n(s.turret_dpm), 'turret_dpm'),
      ];
      case 'percentage': return [
        R('Win Rate', winP + '%', 'win_rate'),
        R('Dmg Share%', p1(s.avg_dmg_share), 'avg_dmg_share'),
        R('Gold Share%', p1(s.avg_gold_share), 'avg_gold_share'),
        R('First Blood%', p1(s.first_blood_pct), 'first_blood_pct'),
        R('Lord%', p1(s.lord_pct), 'lord_pct'),
        R('Turtle%', p1(s.turtle_pct), 'turtle_pct'),
        R('Turret%', p1(s.turret_pct), 'turret_pct'),
      ];
      case 'milestone': return [
        R('Solo Kills', n(s.total_solo_kills), 'total_solo_kills'),
        R('Double Kills', n(s.total_double_kills), 'total_double_kills'),
        R('Triple Kills', n(s.total_triple_kills), 'total_triple_kills'),
        R('Maniacs', n(s.maniacs), 'maniacs'),
        R('Savages', n(s.savages), 'savages'),
        R('Lord Kills', n(s.total_lord_kills), 'total_lord_kills'),
        R('Lord Steals', n(s.total_lord_steals), 'total_lord_steals'),
        R('Turtle Kills', n(s.total_turtle_kills), 'total_turtle_kills'),
        R('Turtle Steals', n(s.total_turtle_steals), 'total_turtle_steals'),
        R('Turrets Dest.', n(s.total_turrets), 'total_turrets'),
      ];
      default: return [];
    }
  }, [s, perfFilter, allHeroes, heroid, winP, roleFilter, total]);

  const filterLabel = () => {
    const p = [];
    if (phase !== 'overall') p.push(phase);
    if (side !== 'overall') p.push(side === 'blue' ? 'Blue' : 'Red');
    if (result !== 'all') p.push(result === 'wins' ? 'Wins' : 'Losses');
    if (patch !== null) p.push(`Patch ${patch}`);
    if (roleFilter !== 'ALL') p.push(roleFilter);
    return p.length ? p.join(', ') : 'All Games';
  };

  const compareHero = compareHid ? compareHeroes.find(h => String(h.hero_id) === String(compareHid)) : null;
  const thisHero = compareHeroes.find(h => String(h.hero_id) === String(heroid) || String(h.heroid) === String(heroid));

  return (
    <div className="page container">
      <div style={{ marginBottom: 8 }}>
        <Link href="/heroes" style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em' }}>← HEROES</Link>
      </div>

      {/* ── Header ── */}
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <HeroImg heroid={parseInt(heroid)} size={72} style={{ borderRadius: 8, border: '2px solid var(--border)' }} />
          <div>
            <h1 className="page-title" style={{ margin: 0 }}><span>{s.hero_name || 'Hero'}</span></h1>
            <div style={{ marginTop: 6 }}>
              <RoleDistribution s={s} total={total} />
            </div>
            <p className="page-sub" style={{ margin: '4px 0 0' }}>
              // {total} games
              {(phase !== 'overall' || side !== 'overall' || result !== 'all' || patch !== null || roleFilter !== 'ALL') && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', marginLeft: 10 }}>[{filterLabel()}]</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ── 4 Headline Stats ── */}
      {total > 0 && (
        <div className="hero-headline-stats" style={{ marginBottom: 24 }}>
          {[
            { label: 'Games', value: total },
            { label: 'Win Rate', value: winP + '%', color: winP >= 50 ? 'var(--win)' : 'var(--loss)' },
            { label: 'Pick Rate', value: draftData?.pick_rate != null ? draftData.pick_rate + '%' : '—' },
            { label: 'Ban Rate', value: draftData?.ban_rate != null ? draftData.ban_rate + '%' : '—' },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: '16px 20px',
              background: 'var(--surface)',
            }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 6 }}>{stat.label}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, lineHeight: 1, color: stat.color || 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── Filters ── */}
      <FilterSidebar
        layout="bar"
        phase={phase} setPhase={setPhase}
        side={side} setSide={setSide}
        result={result} setResult={setResult}
        patch={patch} setPatch={setPatch} patches={patches}
        roleFilter={heroBaseRoles.length > 1 ? roleFilter : undefined}
        setRoleFilter={heroBaseRoles.length > 1 ? setRoleFilter : undefined}
      />

      {/* ── Performance Overview ── */}
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <div className="section-header" style={{ marginBottom: 0 }}>Performance Overview</div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {PERF_FILTERS.map(f => (
                <button key={f.key} className={`filter-btn${perfFilter === f.key ? ' active' : ''}`}
                  onClick={() => setPerfFilter(f.key)}>{f.label}</button>
              ))}
            </div>
          </div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,.45)', marginBottom: 12, letterSpacing: '.06em' }}>
            // {filterLabel()} · {total} games · {s.wins || 0}W {total - (parseInt(s.wins) || 0)}L · {winP}% WR
          </p>

          {total === 0 ? (
            <div className="empty" style={{ marginBottom: 32 }}>// No games for this filter</div>
          ) : (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
              {perfStats.map(st => (
                <StatCard key={st.label} label={st.label} value={st.value} rank={st.rank} color={st.color} roleRanks={st.roleRanks} />
              ))}
            </div>
          )}

          {/* ── Draft Stats Overview ── */}
          <div className="section-header">Draft Stats Overview</div>
          {draftLoad ? <div className="loading" style={{ marginBottom: 32 }} /> : draftData ? (() => {
            const d = draftData;
            const fpPct = d.picks > 0 ? Math.round(d.first_pick_blue / d.picks * 100) : 0;
            const tpPct = d.picks > 0 ? Math.round(d.two_picks_red / d.picks * 100) : 0;
            return (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em', marginBottom: 8 }}>
                  COUNTS — {d.total_games} total games
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  <DraftCard label="Bans" value={d.bans} color="var(--accent2)" />
                  <DraftCard label="Picks" value={d.picks} color="var(--blue)" />
                  <DraftCard label="Presence" value={d.presence} />
                  <DraftCard label="Wins" value={d.wins} color="var(--win)"
                    sub={d.picks > 0 ? `of ${d.picks} picks` : undefined} />
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em', marginBottom: 8 }}>
                  RATES
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                  <DraftCard label="Ban Rate" value={d.ban_rate + '%'} color="var(--accent2)" />
                  <DraftCard label="Pick Rate" value={d.pick_rate + '%'} color="var(--blue)" />
                  <DraftCard label="Presence Rate" value={d.presence_rate + '%'}
                    color={d.presence_rate >= 70 ? 'var(--win)' : 'var(--accent)'} />
                  <DraftCard label="Win Rate"
                    value={d.win_rate != null ? d.win_rate + '%' : '—'}
                    color={d.win_rate != null ? (d.win_rate >= 50 ? 'var(--win)' : 'var(--loss)') : 'var(--muted)'} />
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', letterSpacing: '.1em', marginBottom: 8 }}>
                  PRIORITY &amp; POSITION
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <DraftCard label="Prio Ban" value={d.prio_bans} color="var(--accent2)"
                    sub={`${d.prio_ban_pct}% of bans`} />
                  <DraftCard label="Prio Pick" value={d.prio_picks} color="var(--blue)"
                    sub={`${d.prio_pick_pct}% of picks`} />
                  <DraftCard label="1st Pick (Blue)" value={d.first_pick_blue}
                    color={side === 'red' ? 'var(--muted)' : '#4a9eff'}
                    sub={d.picks > 0 ? fpPct + '% of picks' : undefined}
                    dimmed={side === 'red'} />
                  <DraftCard label="2-Picks (Red)" value={d.two_picks_red}
                    color={side === 'blue' ? 'var(--muted)' : 'var(--loss)'}
                    sub={d.picks > 0 ? tpPct + '% of picks' : undefined}
                    dimmed={side === 'blue'} />
                </div>
              </div>
            );
          })() : <div className="empty" style={{ marginBottom: 32 }}>// No draft data available</div>}

          {/* ── Draft Synergy ── */}
          <div className="section-header">Draft Synergy</div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,.35)', marginBottom: 16, letterSpacing: '.04em' }}>
            // Phase, patch &amp; side filters apply
          </p>
          {synergyLoad ? <div className="loading" style={{ marginBottom: 32 }} /> : (
            <div className="hero-synergy-grid">
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--win)', letterSpacing: '.08em', marginBottom: 10, fontWeight: 700 }}>
                  PLAYED WITH ({synergy?.played_with?.length || 0} heroes)
                </div>
                <SynergyTable rows={synergy?.played_with} emptyMsg="// No data" />
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--loss)', letterSpacing: '.08em', marginBottom: 10, fontWeight: 700 }}>
                  PLAYED AGAINST ({synergy?.played_against?.length || 0} heroes)
                </div>
                <SynergyTable rows={synergy?.played_against} emptyMsg="// No data" />
              </div>

              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '.08em', marginBottom: 10, fontWeight: 700 }}>
                  ROLE VS ROLE {matchup?.role ? `(${matchup.role})` : ''}
                </div>
                {matchup?.role && (
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', marginBottom: 8 }}>
                    // Win% = {s.hero_name} team wins
                  </p>
                )}
                <SynergyTable rows={matchup?.matchups} emptyMsg="// No role matchup data" />
              </div>
            </div>
          )}

          {/* ── Players ── */}
          <div className="section-header">Players</div>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,.45)', marginBottom: 12, letterSpacing: '.06em' }}>
            // Players who used {s.hero_name || 'Hero'} in selected period
          </p>
          <div style={{ marginBottom: 32 }}>
            {playersLoad ? <div className="loading" /> : (
              <StatTable
                columns={PLAYER_COLUMNS}
                groups={STAT_GROUPS}
                rows={players}
                rowKey="player_key"
                defaultLimit={20}
              />
            )}
          </div>

          {/* ── Hero Comparison ── */}
          <div className="section-header">Hero Comparison</div>
          {activeCompareRoles.length > 1 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
              {activeCompareRoles.map(role => (
                <button key={role} onClick={() => setCompareRole(role)} title={role} aria-label={role} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 10px', borderRadius: 2, cursor: 'pointer',
                  border: `1px solid ${compareRole === role ? 'var(--accent)' : 'var(--border)'}`,
                  background: compareRole === role ? 'rgba(255,215,0,.10)' : 'transparent',
                }}>
                  <RoleImg role={role} size={14} />
                </button>
              ))}
            </div>
          )}

          {compareAllLoad ? <div className="loading" style={{ marginBottom: 16 }} /> : (
            <div style={{ marginBottom: 16 }}>
              <select
                value={compareHid}
                onChange={e => setCompareHid(e.target.value)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'var(--font-mono)', fontSize: 12, padding: '8px 12px', cursor: 'pointer', minWidth: 260 }}
              >
                <option value="">— Select a {compareRole || 'hero'} to compare —</option>
                {compareHeroes
                  .filter(h => String(h.hero_id) !== String(heroid))
                  .sort((a, b) => a.hero_name.localeCompare(b.hero_name))
                  .map(h => <option key={h.hero_id} value={h.hero_id}>{h.hero_name} ({h.games} GP)</option>)
                }
              </select>
              {compareRole && (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginLeft: 12 }}>
                  {compareHeroes.length} {compareRole} heroes
                </span>
              )}
            </div>
          )}

          {compareHid && thisHero && compareHero && (() => {
            const clr = r => r === 1 ? '#e8b800' : r === 2 ? '#c0c0c0' : r === 3 ? '#cd7f32' : 'rgba(255,255,255,.35)';
            const rankLabel = compareRole || 'overall';
            return (
              <div className="tbl-wrap" style={{ marginBottom: 32 }}>
                <table className="tbl no-sort">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right', width: '38%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                          <div>
                            <div style={{ fontWeight: 700 }}>{s.hero_name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end', marginTop: 2 }}>
                              {compareRole && <RoleImg role={compareRole} size={12} />}
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{thisHero.games || 0} GP</span>
                            </div>
                          </div>
                          <HeroImg heroid={parseInt(heroid)} size={36} style={{ borderRadius: 4 }} />
                        </div>
                      </th>
                      <th className="center" style={{ width: '24%', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.08em', color: 'rgba(255,255,255,.4)' }}>STAT</th>
                      <th style={{ width: '38%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <HeroImg heroid={parseInt(compareHid)} size={36} style={{ borderRadius: 4 }} />
                          <div>
                            <div style={{ fontWeight: 700 }}>{compareHero.hero_name}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                              {compareRole && <RoleImg role={compareRole} size={12} />}
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>{compareHero.games || 0} GP</span>
                            </div>
                          </div>
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_STATS.map(stat => {
                      const aRaw = parseFloat(thisHero[stat.key] ?? NaN);
                      const bRaw = parseFloat(compareHero[stat.key] ?? NaN);
                      const aWins = !isNaN(aRaw) && !isNaN(bRaw) && aRaw !== bRaw && (stat.lb ? aRaw < bRaw : aRaw > bRaw);
                      const bWins = !isNaN(aRaw) && !isNaN(bRaw) && aRaw !== bRaw && (stat.lb ? bRaw < aRaw : bRaw > aRaw);
                      const aRank = rankAmong(compareHeroes, heroid, stat.key, stat.lb);
                      const bRank = rankAmong(compareHeroes, compareHid, stat.key, stat.lb);
                      return (
                        <tr key={stat.label}>
                          <td style={{ textAlign: 'right', paddingRight: 16 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: aWins ? 'var(--accent)' : 'var(--text)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                              {aWins && <span style={{ fontSize: 10 }}>▲</span>}
                              {stat.fmt(thisHero[stat.key])}
                            </div>
                            {aRank && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: clr(aRank), textAlign: 'right' }}>#{aRank} {rankLabel}</div>}
                          </td>
                          <td className="center" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.45)', letterSpacing: '.06em' }}>{stat.label}</td>
                          <td style={{ paddingLeft: 16 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: bWins ? 'var(--accent)' : 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {stat.fmt(compareHero[stat.key])}
                              {bWins && <span style={{ fontSize: 10 }}>▲</span>}
                            </div>
                            {bRank && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: clr(bRank) }}>#{bRank} {rankLabel}</div>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* ── Stats vs Teams ── */}
          <div className="section-header">Stats vs Teams</div>
          {vsLoading ? <div className="loading" style={{ marginBottom: 32 }} /> : (
            <div className="tbl-wrap" style={{ marginBottom: 32 }}>
              <table className="tbl no-sort">
                <thead>
                  <tr>
                    <th className="sticky-col-player no-sort">Opponent</th>
                    <th className="center">GP</th>
                    <th className="center">W</th>
                    <th className="center">Win%</th>
                    <th className="center">Avg K</th>
                    <th className="center">Avg D</th>
                    <th className="center">Avg Dmg</th>
                  </tr>
                </thead>
                <tbody>
                  {vsTeams.map(t => {
                    const wp = t.games > 0 ? Math.round(t.wins / t.games * 100) : 0;
                    return (
                      <tr key={t.opp_team}>
                        <td className="sticky-col-player">
                          <Link href={`/teams/${t.opp_team}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)' }}>
                            <TeamLogo src={t.opp_team_logo_dark} fallbackSrc={img.team(t.opp_team)} alt={t.opp_team} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                            <span style={{ fontWeight: 600 }}>{t.opp_team}</span>
                          </Link>
                        </td>
                        <td className="num center">{t.games}</td>
                        <td className="num center" style={{ color: 'var(--win)' }}>{t.wins}</td>
                        <td className="num center" style={{ color: wp >= 50 ? 'var(--win)' : 'var(--loss)', fontWeight: 700 }}>{wp}%</td>
                        <td className="num center">{n(t.avg_kills)}</td>
                        <td className="num center" style={{ color: 'var(--muted)' }}>{n(t.avg_deaths)}</td>
                        <td className="num center">{big(t.avg_damage)}</td>
                      </tr>
                    );
                  })}
                  {vsTeams.length === 0 && <tr><td colSpan={7} className="empty">// No games for this filter</td></tr>}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Win vs Loss Stats ── */}
          <div className="section-header">Win vs Loss Stats</div>
          {vsLoading ? <div className="loading" style={{ marginBottom: 32 }} /> : (() => {
            const W = winLoss.find(r => r.win === true || r.win === 't' || r.win === 'true');
            const L = winLoss.find(r => r.win === false || r.win === 'f' || r.win === 'false');
            if (!W && !L) return <div className="empty" style={{ marginBottom: 32 }}>// No games for this filter</div>;
            return (
              <div className="tbl-wrap" style={{ marginBottom: 32 }}>
                <table className="tbl no-sort">
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'right', width: '38%' }}>
                        <span style={{ color: 'var(--win)' }}>WIN</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,.45)', marginLeft: 8 }}>({W?.games || 0} games)</span>
                      </th>
                      <th className="center" style={{ width: '24%', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '.08em', color: 'rgba(255,255,255,.4)' }}>STAT</th>
                      <th style={{ width: '38%' }}>
                        <span style={{ color: 'var(--loss)' }}>LOSS</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,.45)', marginLeft: 8 }}>({L?.games || 0} games)</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {WL_STATS.map(stat => {
                      const wv = parseFloat(W?.[stat.key] ?? NaN);
                      const lv = parseFloat(L?.[stat.key] ?? NaN);
                      const wBetter = !isNaN(wv) && !isNaN(lv) && wv !== lv && (stat.lb ? wv < lv : wv > lv);
                      const lBetter = !isNaN(wv) && !isNaN(lv) && wv !== lv && (stat.lb ? lv < wv : lv > wv);
                      return (
                        <tr key={stat.label}>
                          <td style={{ textAlign: 'right', paddingRight: 16 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: wBetter ? 'var(--win)' : 'rgba(255,255,255,.6)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6 }}>
                              {wBetter && <span style={{ fontSize: 10, color: 'var(--win)' }}>▲</span>}
                              {stat.fmt(W?.[stat.key])}
                            </div>
                          </td>
                          <td className="center" style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.45)', letterSpacing: '.06em' }}>{stat.label}</td>
                          <td style={{ paddingLeft: 16 }}>
                            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: lBetter ? 'var(--loss)' : 'rgba(255,255,255,.4)', display: 'flex', alignItems: 'center', gap: 6 }}>
                              {stat.fmt(L?.[stat.key])}
                              {lBetter && <span style={{ fontSize: 10, color: 'var(--loss)' }}>▲</span>}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}

          {/* ── Game Log ── */}
          <details className="collapsible" style={{ marginBottom: 32 }}>
            <summary><span className="section-header" style={{ marginBottom: 0 }}><span className="disclosure">▶</span>Game Log</span></summary>
            <div className="collapsible-body">
              {gamesLoad ? <div className="loading" /> : (
                <div className="tbl-wrap">
                  <table className="tbl no-sort">
                    <thead>
                      <tr>
                        <th className="sticky-col-match no-sort" style={{ top: 0 }}>Match</th>
                        <th className="sticky-col-hero no-sort" style={{ top: 0 }}>Player</th>
                        <th className="center" style={{ whiteSpace: 'nowrap' }}>Skill · Emblem</th>
                        <th className="center">Items</th>
                        <th className="center">Role</th>
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
                        <th className="center">Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {games.map(g => {
                        const sideStr = g.campid === 1 ? 'BLUE' : g.campid === 2 ? 'RED' : '--';
                        const sideColor = g.campid === 1 ? '#4a9eff' : g.campid === 2 ? 'var(--loss)' : 'var(--muted)';
                        const items = [g.equip_1, g.equip_2, g.equip_3, g.equip_4, g.equip_5, g.equip_6, g.equip_7].filter(Boolean);
                        const itemNames = [g.equip_1_name, g.equip_2_name, g.equip_3_name, g.equip_4_name, g.equip_5_name, g.equip_6_name, g.equip_7_name];
                        const talents = [[g.rune_map_1, g.rune_map_1_name], [g.rune_map_2, g.rune_map_2_name], [g.rune_map_3, g.rune_map_3_name]].filter(t => t[0]);
                        const p1 = v => v != null ? v + '%' : '--';
                        return (
                          <tr key={g.battle_id + '-' + g.roleid} style={{ background: g.is_winner ? undefined : 'rgba(255,60,60,.02)' }}>
                            <td className="sticky-col-match">
                              <Link href={`/matches/${g.battle_id}`} style={{ color: 'var(--text)' }}>
                                <div style={{ fontWeight: 600, fontSize: 13 }}>{g.series_name || g.room_name || '--'}</div>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' }}>
                                  {g.week_number ? `W${g.week_number}` : ''} {g.game_number ? `G${g.game_number}` : ''}
                                </div>
                              </Link>
                            </td>
                            <td className="sticky-col-hero">
                              <Link href={`/players/${encodeURIComponent(g.player_name)}`} style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}>
                                <PlayerPhoto photoUrl={g.photo_url} name={g.player_name} size={36} />
                                <div>
                                  <div style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)' }}>{g.player_name}</div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                    <TeamImg code={g.team_code} size={14} />
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)' }}>{g.team_code}</span>
                                  </div>
                                </div>
                              </Link>
                            </td>
                            <td style={{ whiteSpace: 'nowrap' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {g.skillid && <SkillImg skillid={g.skillid} size={24} />}
                                {g.rune_id && <RuneImg runeMap={g.rune_id} size={22} title={g.emblem_name} />}
                                {talents.map(([id, name], i) => <RuneImg key={i} runeMap={id} size={20} title={name} />)}
                              </div>
                            </td>
                            <td style={{ whiteSpace: 'nowrap', minWidth: 176, padding: '4px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                {items.map((eq, i) => <ItemImg key={i} equipId={eq} size={24} title={itemNames[i]} />)}
                              </div>
                            </td>
                            <td className="center">
                              <span title={g.role_lane || ''} aria-label={g.role_lane || ''} style={{ display: 'inline-flex', justifyContent: 'center' }}>
                                <RoleImg role={g.role_lane} size={14} />
                              </span>
                            </td>
                            <td className="center">
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: sideColor }}>{sideStr}</span>
                            </td>
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
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: g.is_winner ? 'var(--win)' : 'var(--loss)' }}>
                                {g.is_winner ? 'WIN' : 'LOSS'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {games.length === 0 && <tr><td colSpan={logExpanded ? 39 : 17} className="empty">// No games for this filter</td></tr>}
                    </tbody>
                  </table>
                  {games.length > 0 && (
                    <div style={{ textAlign: 'center', padding: '12px 0', borderTop: '1px solid var(--border)' }}>
                      <button onClick={() => setLogExpanded(!logExpanded)} className="filter-btn">
                        {logExpanded ? 'Show Less Details' : 'Show More Details'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </details>
    </div>
  );
}
