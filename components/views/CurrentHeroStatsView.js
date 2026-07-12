'use client';
import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { HeroImg, RoleImg, TeamImg, PlayerPhoto } from '../Images';
import FilterSidebar from '../FilterSidebar';
import HeroCard from '../HeroCard';
import HeroScatterChart from '../HeroScatterChart';
import { SkeletonHeroGrid, SkeletonTable } from '../LoadingSkeleton';
import SynergyTable from '../SynergyTable';

const ROLES = ['EXP LANE', 'JUNGLE', 'MID LANE', 'ROAM', 'GOLD LANE'];

function numVal(v) {
  if (v === null || v === undefined) return null;
  const n = parseFloat(v);
  return isNaN(n) ? null : n;
}

const ROLE_KEYS = [
  { role: 'EXP LANE', key: 'role_exp' }, { role: 'JUNGLE', key: 'role_jungle' }, { role: 'MID LANE', key: 'role_mid' },
  { role: 'ROAM', key: 'role_roam' }, { role: 'GOLD LANE', key: 'role_gold' },
];

function RoleDistribution({ h }) {
  const total = parseInt(h.games) || 0;
  const active = ROLE_KEYS.filter(({ key }) => parseInt(h[key]) > 0);
  if (!total || !active.length) return <span style={{ color: 'var(--muted2)', fontSize: 10 }}>—</span>;
  if (active.length === 1) {
    const { role } = active[0];
    return (
      <span title={role} aria-label={role} style={{ display: 'inline-flex', alignItems: 'center' }}>
        <RoleImg role={role} size={14} />
      </span>
    );
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 110 }}>
      {active.map(({ role, key }) => {
        const pct = Math.round(parseInt(h[key]) / total * 100);
        return (
          <div key={role} title={role} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <RoleImg role={role} size={11} />
            <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2 }}>
              <div style={{ width: pct + '%', height: '100%', background: 'var(--neutral2)', borderRadius: 2 }} />
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
          </div>
        );
      })}
    </div>
  );
}



export default function CurrentHeroStatsView({ featured, eff, label }) {
  const router = useRouter();

  const scope = eff.scope || featured?.tournament_code || 'MSC';
  const season = eff.season || featured?.season || '2026';

  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [phase, setPhase] = useState('overall'); // 'overall', 'Wild Card', 'Main'
  const [side, setSide] = useState('overall');
  const [patch, setPatch] = useState(null);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');

  const [heroes, setHeroes] = useState([]);
  const [patches, setPatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftMap, setDraftMap] = useState({});
  const [heroRoles, setHeroRoles] = useState({});
  const [teams, setTeams] = useState([]);
  const [teamPicks, setTeamPicks] = useState({});
  const [mostPlayed, setMostPlayed] = useState({});

  const [sort, setSort] = useState('games');
  const [asc, setAsc] = useState(false);

  // Hero filter detail section
  const [selectedHero, setSelected] = useState(null);
  const [synergy, setSynergy] = useState(null);
  const [heroPatchesList, setHeroPatchesList] = useState([]);
  const [matchup, setMatchup] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [modalData, setModalData] = useState(null); // { title: string, heroes: Array }

  const [teamLogoMap, setTeamLogoMap] = useState({});

  // Fetch available patches and team logos
  useEffect(() => {
    fetch(`/api/intl/patches?scope=${scope}&season=${season}`)
      .then(r => r.json())
      .then(d => setPatches(Array.isArray(d) ? d : []))
      .catch(() => { });

    fetch(`/api/intl/era-teams?scope=${scope}&season=${season}`)
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) {
          const map = {};
          d.forEach(t => {
            if (t.era_code && t.team_logo_dark) {
              map[t.era_code] = t.team_logo_dark;
            }
          });
          setTeamLogoMap(map);
        }
      })
      .catch(() => { });
  }, [scope, season]);

  // Main stats fetch
  useEffect(() => {
    setLoading(true);
    const params = [];
    params.push(`scope=${scope}`);
    params.push(`season=${season}`);
    if (phase !== 'overall') {
      params.push(`stage=${phase === 'Wild Card' ? 'qualifier' : 'main'}`);
    }
    if (side !== 'overall') params.push(`side=${side}`);
    if (patch !== null && patch !== 'all') params.push(`patch=${encodeURIComponent(patch)}`);
    if (roleFilter !== 'ALL') params.push(`role=${encodeURIComponent(roleFilter)}`);
    if (teamFilter !== 'ALL') params.push(`team=${encodeURIComponent(teamFilter)}`);

    const q = params.length ? '?' + params.join('&') : '';

    Promise.all([
      fetch(`/api/intl/heroes${q}`).then(r => r.json()).catch(() => []),
      fetch(`/api/intl/stats/draft${q}`).then(r => r.json()).catch(() => null),
      fetch(`/api/intl/stats/draft/hero-roles${q}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/intl/stats/draft/team-picks${q}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/intl/stats/draft/most-played-by${q}`).then(r => r.json()).catch(() => ({})),
    ]).then(([heroesData, draftData, hr, picks, mp]) => {
      // Map properties to match PH variables
      const rows = (Array.isArray(heroesData) ? heroesData : []).map(h => {
        const hRoles = hr[h.hero_id] || {};
        return {
          ...h,
          win_pct: h.win_rate != null ? Math.round(parseFloat(h.win_rate)) : 0,
          games: parseInt(h.picks) || 0,
          wins: parseInt(h.wins) || 0,
          avg_kda: h.kda,
          avg_gpm: h.gpm,
          avg_dpm: h.dpm,
          total_mvps: h.mvps,
          total_savages: h.savages,
          players_played: h.players,
          // Merge role counts
          role_exp: hRoles['EXP LANE'] || 0,
          role_jungle: hRoles['JUNGLE'] || 0,
          role_mid: hRoles['MID LANE'] || 0,
          role_roam: hRoles['ROAM'] || 0,
          role_gold: hRoles['GOLD LANE'] || 0,
          primary_role: Object.keys(hRoles).filter(k => k !== 'total').sort((a,b) => hRoles[b] - hRoles[a])[0] || '',
        };
      });

      setHeroes(rows);
      setHeroRoles(hr || {});
      setTeamPicks(picks || {});
      setMostPlayed(mp || {});

      if (draftData) {
        setTeams(draftData.teams || []);
        const rowsDraft = Array.isArray(draftData.heroes) ? draftData.heroes : [];
        setDraftMap(Object.fromEntries(rowsDraft.map(h => [h.heroid, h])));
      } else {
        setTeams([]);
        setDraftMap({});
      }

      setLoading(false);
    }).catch(() => setLoading(false));
  }, [phase, side, patch, roleFilter, teamFilter, scope, season]);

  // Fetch details for selected hero analysis
  useEffect(() => {
    if (!selectedHero) { setSynergy(null); setHeroPatchesList([]); setMatchup(null); return; }
    setFilterLoading(true);

    const qp = [];
    qp.push(`scope=${scope}`);
    qp.push(`season=${season}`);
    if (side !== 'overall') qp.push(`side=${side}`);
    if (phase !== 'overall') qp.push(`stage=${phase === 'Wild Card' ? 'qualifier' : 'main'}`);
    if (patch !== null && patch !== 'all') qp.push(`patch=${encodeURIComponent(patch)}`);
    const qs = qp.length ? ('?' + qp.join('&')) : '';
    const hid = selectedHero.hero_id;

    Promise.all([
      fetch(`/api/intl/stats/draft/hero-synergy/${hid}${qs}`).then(r => r.json()).catch(() => null),
      fetch(`/api/intl/stats/draft/hero-patches/${hid}${qs}`).then(r => r.json()).catch(() => []),
      fetch(`/api/intl/stats/draft/role-matchup/${hid}${qs}`).then(r => r.json()).catch(() => null),
    ]).then(([syn, pat, mu]) => {
      setSynergy(syn);
      setHeroPatchesList(Array.isArray(pat) ? pat : []);
      setMatchup(mu);
      setFilterLoading(false);
    });
  }, [selectedHero, side, phase, patch, scope, season]);

  const filteredHeroes = useMemo(() => {
    let list = heroes;
    if (roleFilter !== 'ALL' || teamFilter !== 'ALL') {
      list = list.filter(h => (parseInt(h.games) || 0) > 0);
    }
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(h => (h.hero_name || '').toLowerCase().includes(q) || (h.primary_role || '').toLowerCase().includes(q));
  }, [heroes, searchQuery, roleFilter, teamFilter]);

  const scatterData = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return heroes.map(h => {
      const d = draftMap[h.hero_id] || {};
      const active = !q
        || (h.hero_name || '').toLowerCase().includes(q)
        || (h.primary_role || '').toLowerCase().includes(q);
      return {
        heroid: h.hero_id,
        hero_name: h.hero_name,
        games: parseInt(h.games) || 0,
        wins: parseInt(h.wins) || 0,
        win_pct: h.win_pct ?? 0,
        bans: parseInt(d.bans) || 0,
        presence: parseInt(d.presence) || 0,
        active,
      };
    });
  }, [heroes, draftMap, searchQuery]);

  const sortedTable = useMemo(() => [...filteredHeroes].sort((a, b) => {
    const va = numVal(a[sort]) ?? (asc ? Infinity : -Infinity);
    const vb = numVal(b[sort]) ?? (asc ? Infinity : -Infinity);
    return asc ? va - vb : vb - va;
  }), [filteredHeroes, sort, asc]);

  const toggleSort = (col) => { if (sort === col) setAsc(p => !p); else { setSort(col); setAsc(false); } };

  const withRanks = useMemo(() => {
    const sortFn = (a, b) => {
      const va = numVal(a.games) ?? -Infinity;
      const vb = numVal(b.games) ?? -Infinity;
      return vb - va;
    };
    const overallSorted = [...heroes].sort(sortFn);
    const overallRankMap = Object.fromEntries(overallSorted.map((h, i) => [h.hero_id, i + 1]));
    const roleRankMap = {};
    if (roleFilter === 'ALL') {
      for (const role of ROLES) {
        const roleSorted = heroes.filter(h => h.primary_role === role).sort(sortFn);
        roleSorted.forEach((h, i) => { roleRankMap[h.hero_id] = i + 1; });
      }
    }
    return heroes.map(h => ({
      ...h,
      overall_rank: overallRankMap[h.hero_id] ?? null,
      role_rank: roleFilter === 'ALL' ? (roleRankMap[h.hero_id] ?? null) : (overallRankMap[h.hero_id] ?? null)
    }));
  }, [heroes, roleFilter]);

  const gridHeroes = useMemo(() =>
    [...filteredHeroes].sort((a, b) => (parseInt(b.games) || 0) - (parseInt(a.games) || 0)),
    [filteredHeroes]);

  const tableWithRanks = useMemo(() => {
    const rankMap = Object.fromEntries(withRanks.map(h => [h.hero_id, h]));
    return sortedTable.map(h => rankMap[h.hero_id] || h);
  }, [sortedTable, withRanks]);

  const Th = ({ col, label, title }) => {
    const isSorted = sort === col;
    const sortOrder = isSorted ? (asc ? 'ascending' : 'descending') : 'none';
    return (
      <th
        aria-sort={sortOrder}
        className={`center ${isSorted ? (asc ? 'sort-asc' : 'sort-desc') : ''}`.trim()}
        style={{ whiteSpace: 'nowrap', padding: 0 }}
      >
        <button
          type="button"
          onClick={() => toggleSort(col)}
          title={title}
          style={{
            width: '100%',
            height: '100%',
            padding: '12px 14px',
            background: 'none',
            border: 'none',
            color: 'inherit',
            font: 'inherit',
            cursor: 'pointer',
            textAlign: 'center',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {label}
        </button>
      </th>
    );
  };

  const filterLabel = () => {
    const parts = [];
    if (phase !== 'overall') parts.push(phase);
    if (side !== 'overall') parts.push(side === 'blue' ? 'Blue Side' : 'Red Side');
    if (patch !== null && patch !== 'all') parts.push(`Patch ${patch}`);
    if (roleFilter !== 'ALL') parts.push(roleFilter);
    if (teamFilter !== 'ALL') parts.push(teamFilter);
    return parts.length ? parts.join(', ') : 'All Games';
  };

  const rankNumStyle = (rank) => ({
    fontFamily: 'var(--font-display)', fontWeight: 800,
    fontSize: rank === 1 ? 18 : 13,
    color: rank === 1 ? 'var(--accent)' : rank === 2 ? '#c0c0c0' : rank === 3 ? '#cd7f32' : 'var(--muted2)',
  });

  const uniquePicks = heroes.filter(h => Number(h.games) > 0).length;
  const uniqueBans = Object.values(draftMap).filter(h => Number(h.bans) > 0).length;
  const notBanned = heroes.filter(h => Number(h.games) > 0 && Number(draftMap[h.hero_id]?.bans || 0) === 0);
  const notPicked = Object.values(draftMap).filter(h => Number(h.bans) > 0 && Number(h.picks || 0) === 0).map(x => ({ heroid: x.heroid, hero_name: x.hero_name }));

  return (
    <div className="page container" style={{ paddingBottom: 40 }}>

      {/* ── Masthead ── */}
      <div className="masthead">
        <div className="masthead-kicker">
          // {label} — {filterLabel()} — {heroes.length} heroes
        </div>
        <h1 className="masthead-title">Hero <span className="gold">Stats</span></h1>
      </div>

      <div className="page-layout">

        {/* ── Left sidebar ── */}
        <FilterSidebar
          phase={phase} setPhase={setPhase}
          side={side} setSide={setSide}
          patch={patch} setPatch={setPatch} patches={patches}
          roleFilter={roleFilter} setRoleFilter={setRoleFilter}
          teamFilter={teamFilter} setTeamFilter={setTeamFilter} teams={teams}
          teamLogoMap={teamLogoMap}
        />

        {/* ── Main content ── */}
        <div className="sidebar-content">

          {/* Search and Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <div className="search-bar" style={{ flex: '1', maxWidth: 340 }}>
              <svg width="14" height="14" fill="none" stroke="var(--muted2)" strokeWidth={2} viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" aria-label="Search heroes" placeholder="Search heroes..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{ color: 'var(--muted2)', fontSize: 14, lineHeight: 1 }}>✕</button>}
            </div>
            <div className="view-toggle">
              <button
                className={`view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                Grid
              </button>
              <button
                className={`view-toggle-btn${viewMode === 'table' ? ' active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                Table
              </button>
            </div>
          </div>

          {/* Quick Summary Cards */}
          {!loading && heroes.length > 0 && (
            <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
              <div className="card" style={{ flex: '1 1 180px', padding: '14px 18px' }}>
                <div className="k" style={{ marginBottom: 6, color: 'var(--muted2)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Unique Heroes Picked</div>
                <div className="v" style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{uniquePicks}</div>
              </div>
              <div className="card" style={{ flex: '1 1 180px', padding: '14px 18px' }}>
                <div className="k" style={{ marginBottom: 6, color: 'var(--muted2)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>Unique Heroes Banned</div>
                <div className="v" style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{uniqueBans}</div>
              </div>
              <div className="card" style={{ flex: '1 1 180px', padding: '14px 18px' }}>
                <div className="k" style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted2)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  <span>Picked, Not Banned</span>
                  <button
                    type="button"
                    onClick={() => setModalData({ title: 'Picked, Not Banned Heroes', heroes: notBanned })}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 0 }}
                  >
                    ⓘ
                  </button>
                </div>
                <div className="v" style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{notBanned.length}</div>
              </div>
              <div className="card" style={{ flex: '1 1 180px', padding: '14px 18px' }}>
                <div className="k" style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'var(--muted2)', fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                  <span>Banned, Not Picked</span>
                  <button
                    type="button"
                    onClick={() => setModalData({ title: 'Banned, Not Picked Heroes', heroes: notPicked })}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 0 }}
                  >
                    ⓘ
                  </button>
                </div>
                <div className="v" style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>{notPicked.length}</div>
              </div>
            </div>
          )}

          {/* Quick bar-list summary */}
          {!loading && heroes.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { title: 'Most Picked', fetchKey: 'picks', displayKey: 'games', color: 'var(--accent)' },
                { title: 'Most Banned', fetchKey: 'bans', displayKey: 'bans', color: 'var(--neutral2)' },
                { title: 'Most Contested', fetchKey: 'presence', displayKey: 'presence', color: 'var(--muted)' },
              ].map(l => {
                const draftRows = Object.values(draftMap);
                const sortedList = l.fetchKey === 'picks'
                  ? [...heroes].filter(h => Number(h.games) > 0).sort((a,b) => b.games - a.games)
                  : [...draftRows].filter(h => Number(h[l.fetchKey]) > 0).sort((a,b) => b[l.fetchKey] - a[l.fetchKey]);
                const top = sortedList.slice(0, 5);
                const max = Number(top[0]?.[l.displayKey === 'presence' ? 'presence' : l.displayKey === 'bans' ? 'bans' : 'games']) || 1;
                return (
                  <div key={l.title} className="card" style={{ padding: '16px' }}>
                    <div className="section-header" style={{ fontSize: 12, marginBottom: 12, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.05em' }}>
                      {l.title}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {top.map((h, i) => {
                        const isHero = l.fetchKey === 'picks';
                        const heroid = isHero ? h.hero_id : h.heroid;
                        const v = Number(isHero ? h.games : h[l.displayKey]);
                        const pctVal = Math.round(v / max * 100);
                        return (
                          <div key={heroid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', width: 14, textAlign: 'right' }}>{i + 1}</span>
                            <HeroImg heroid={heroid} size={24} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.hero_name}</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: l.color, marginLeft: 6 }}>{v}</span>
                              </div>
                              <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: pctVal + '%', background: l.color, borderRadius: 3 }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {top.length === 0 && <span style={{ color: 'var(--muted2)', fontSize: 11 }}>// none</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Win Rate Scatter Chart */}
          {!loading && heroes.length > 0 && (
            <>
              <div className="section-header">
                Draft map
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', fontWeight: 400, marginLeft: 8, textTransform: 'lowercase' }}>
                  games vs presence / bans / wins
                </span>
              </div>
              <div className="card" style={{ marginBottom: 24, padding: 16 }}>
                <HeroScatterChart data={scatterData} limit={30} />
              </div>
            </>
          )}

          {loading ? (
            viewMode === 'grid' ? <SkeletonHeroGrid count={24} /> : <SkeletonTable rows={10} cols={8} />
          ) : (
            <>
              {/* ── Grid View ── */}
              {viewMode === 'grid' && (
                <>
                  <div className="section-header" style={{ marginBottom: 12 }}>
                    Hero Grid
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', fontWeight: 400, marginLeft: 8 }}>{gridHeroes.length} heroes</span>
                  </div>
                  {gridHeroes.length === 0
                    ? <div className="empty">// No heroes match your filters</div>
                    : (
                      <div className="hero-grid">
                        {gridHeroes.map((h, i) => (
                          <HeroCard key={h.hero_id} hero={h} rank={i + 1} onClick={() => router.push(`/heroes/${h.hero_id}`)} />
                        ))}
                      </div>
                    )
                  }
                </>
              )}

              {/* ── Table View ── */}
              {viewMode === 'table' && (
                <>
                  <div className="section-header">Full Stats Table</div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', marginBottom: 12, letterSpacing: '.06em' }}>
                    // {filteredHeroes.length} heroes — click columns to sort
                  </p>
                  <div className="tbl-wrap" style={{ overflowX: 'auto', position: 'relative' }}>
                    <table className="tbl" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                      <caption className="sr-only">Hero statistics — {filterLabel()}</caption>
                      <thead>
                        <tr>
                          <th className="sticky-col-player no-sort" style={{ textAlign: 'left' }}>Hero</th>
                          <th className="no-sort" style={{ textAlign: 'left' }}>Role</th>
                          <th className="center no-sort" style={{ color: 'var(--accent)', fontSize: 10 }}>O.#</th>
                          <th className="center no-sort" style={{ color: 'var(--accent)', fontSize: 10 }}>{roleFilter !== 'ALL' ? `${roleFilter} #` : 'Role #'}</th>
                          <Th col="games" label="GP" title="Games" />
                          <Th col="wins" label="W" title="Wins" />
                          <Th col="win_pct" label="Win%" title="Win rate" />
                          <Th col="avg_kda" label="KDA" title="KDA" />
                          <Th col="avg_kp" label="KP%" title="Kill part." />
                          <Th col="avg_kills" label="Kills" title="Avg kills" />
                          <Th col="avg_deaths" label="Deaths" title="Avg deaths" />
                          <Th col="avg_assists" label="Assists" title="Avg assists" />
                          <Th col="avg_gpm" label="GPM" title="Gold/min" />
                          <Th col="avg_dpm" label="DPM" title="Dmg/min" />
                          <Th col="avg_dmg_share" label="Dmg%" title="Dmg share" />
                          <Th col="avg_gold_share" label="Gold%" title="Gold share" />
                          <Th col="avg_damage" label="Avg Dmg" title="Avg damage" />
                          <Th col="avg_damage_taken" label="Dmg Tkn" title="Dmg taken" />
                          <Th col="avg_cc_sec" label="CC(s)" title="Avg CC" />
                          <Th col="avg_turret_damage" label="Trt Dmg" title="Turret dmg" />
                          <Th col="avg_heal" label="Heal" title="Heal" />
                          <Th col="first_blood_pct" label="FB%" title="First blood" />
                          <Th col="turtle_pct" label="Trtl%" title="Turtle ctrl" />
                          <Th col="lord_pct" label="Lord%" title="Lord ctrl" />
                          <Th col="total_mvps" label="MVPs" title="MVPs" />
                          <Th col="total_savages" label="Savages" title="Savages" />
                          <Th col="players_played" label="Players" title="Unique players" />
                          <th className="sticky-col-right no-sort" />
                        </tr>
                      </thead>
                      <tbody>
                        {tableWithRanks.map(h => {
                          const wp = h.win_pct ?? 0;
                          return (
                            <tr key={h.hero_id} className="clickable" onClick={() => router.push(`/heroes/${h.hero_id}`)}>
                              <td className="sticky-col-player">
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 150 }}>
                                  <HeroImg heroid={h.hero_id} size={26} />
                                  <span style={{ fontWeight: 600, fontSize: 13 }}>{h.hero_name}</span>
                                </div>
                              </td>
                              <td style={{ padding: '6px 10px' }}>{roleFilter === 'ALL' ? <RoleDistribution h={h} /> : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, display: 'inline-flex' }}></span>}</td>
                              <td className="num center">{h.overall_rank ? <span style={rankNumStyle(h.overall_rank)}>#{h.overall_rank}</span> : <span style={{ color: 'var(--muted2)', fontSize: 10 }}>—</span>}</td>
                              <td className="num center">{h.role_rank ? <span style={{ ...rankNumStyle(h.role_rank), color: 'var(--muted)' }}>#{h.role_rank}</span> : <span style={{ color: 'var(--muted2)', fontSize: 10 }}>—</span>}</td>
                              <td className="num center">{h.games}</td>
                              <td className="num center" style={{ color: 'var(--win)' }}>{h.wins}</td>
                              <td className="num center" style={{ fontWeight: 700, color: wp >= 50 ? 'var(--win)' : 'var(--loss)' }}>{wp}%</td>
                              <td className="num center" style={{ color: 'var(--accent)', fontWeight: 700 }}>{h.avg_kda || '—'}</td>
                              <td className="num center">{h.avg_kp ? h.avg_kp + '%' : '—'}</td>
                              <td className="num center">{h.avg_kills || '—'}</td>
                              <td className="num center" style={{ color: 'var(--muted2)' }}>{h.avg_deaths || '—'}</td>
                              <td className="num center">{h.avg_assists || '—'}</td>
                              <td className="num center">{h.avg_gpm ? Math.round(h.avg_gpm).toLocaleString() : '—'}</td>
                              <td className="num center">{h.avg_dpm ? Math.round(h.avg_dpm).toLocaleString() : '—'}</td>
                              <td className="num center">{h.avg_dmg_share ? h.avg_dmg_share + '%' : '—'}</td>
                              <td className="num center">{h.avg_gold_share ? h.avg_gold_share + '%' : '—'}</td>
                              <td className="num center">{h.avg_damage ? Math.round(h.avg_damage).toLocaleString() : '—'}</td>
                              <td className="num center">{h.avg_damage_taken ? Math.round(h.avg_damage_taken).toLocaleString() : '—'}</td>
                              <td className="num center">{h.avg_cc_sec != null ? h.avg_cc_sec + 's' : '—'}</td>
                              <td className="num center">{h.avg_turret_damage ? Math.round(h.avg_turret_damage).toLocaleString() : '—'}</td>
                              <td className="num center">{h.avg_heal ? Math.round(h.avg_heal).toLocaleString() : '—'}</td>
                              <td className="num center">{h.first_blood_pct ? h.first_blood_pct + '%' : '—'}</td>
                              <td className="num center">{h.turtle_pct ? h.turtle_pct + '%' : '—'}</td>
                              <td className="num center">{h.lord_pct ? h.lord_pct + '%' : '—'}</td>
                              <td className="num center">{h.total_mvps || '—'}</td>
                              <td className="num center">{h.total_savages || '—'}</td>
                              <td className="num center">{h.players_played || '—'}</td>
                              <td className="sticky-col-right" style={{ textAlign: 'center', padding: '0 12px' }}>
                                <button onClick={(e) => { e.stopPropagation(); router.push(`/heroes/${h.hero_id}`); }} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', letterSpacing: '.08em', whiteSpace: 'nowrap', cursor: 'pointer' }}>DETAIL →</button>
                              </td>
                            </tr>
                          );
                        })}
                        {tableWithRanks.length === 0 && <tr><td colSpan={28} className="empty">No heroes for this filter</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </>
          )}

          {/* ── Hero detail drawer/panel ── */}
          {selectedHero && (
            <div style={{ marginTop: 40 }} id="hero-filter">
              <div style={{ padding: '24px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12 }}>
                {/* Hero header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <HeroImg heroid={selectedHero.hero_id} size={40} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>{selectedHero.hero_name}</span>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
                      background: 'none', border: '1px solid var(--border)', borderRadius: 4,
                      padding: '4px 10px', cursor: 'pointer', marginLeft: 12,
                      transition: 'color .15s, border-color .15s'
                    }}
                    onMouseEnter={(e) => { e.target.style.color = 'var(--text)'; e.target.style.borderColor = 'var(--border-strong)'; }}
                    onMouseLeave={(e) => { e.target.style.color = 'var(--muted)'; e.target.style.borderColor = 'var(--border)'; }}
                  >
                    ✕ Clear
                  </button>
                </div>

                {filterLoading ? (
                  <div style={{ textAlign: 'center', color: 'var(--muted2)', padding: '40px 0', fontFamily: 'var(--font-mono)' }}>
                    Loading hero detail analysis...
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

                    {/* A. Patch Distribution */}
                    {heroPatchesList.length > 0 && (
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.1em', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                          Patch Distribution
                        </div>
                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {heroPatchesList.map(p => (
                            <div key={p.patch} className="card" style={{
                              background: 'var(--surface)', border: '1px solid var(--border)',
                              padding: '12px 16px', minWidth: 130, flex: '0 0 auto',
                            }}>
                              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted2)', marginBottom: 8 }}>Patch {p.patch}</div>
                              <div style={{ display: 'flex', gap: 14 }}>
                                <div>
                                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--accent)' }}>{p.picks}</div>
                                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted2)' }}>PICKS</div>
                                </div>
                                <div>
                                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--muted)' }}>{p.bans}</div>
                                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted2)' }}>BANS</div>
                                </div>
                                {p.win_rate !== null && (
                                  <div>
                                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: p.win_rate >= 50 ? 'var(--win)' : 'var(--loss)' }}>{p.win_rate}%</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted2)' }}>WIN%</div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Synergy columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
                      {/* Played With */}
                      <div className="card" style={{ padding: '16px', background: 'var(--surface)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--win)', letterSpacing: '.08em', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                          Played With ({synergy?.played_with?.length || 0} heroes)
                        </div>
                        <SynergyTable rows={synergy?.played_with} emptyMsg="// No team synergy data" />
                      </div>

                      {/* Played Against */}
                      <div className="card" style={{ padding: '16px', background: 'var(--surface)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--loss)', letterSpacing: '.08em', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                          Played Against ({synergy?.played_against?.length || 0} heroes)
                        </div>
                        <SynergyTable rows={synergy?.played_against} emptyMsg="// No matchup data" />
                      </div>

                      {/* Role vs Role Matchup */}
                      <div className="card" style={{ padding: '16px', background: 'var(--surface)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '.08em', marginBottom: 4, fontWeight: 700, textTransform: 'uppercase' }}>
                          Role vs Role {matchup?.role ? '(' + matchup.role + ')' : ''}
                        </div>
                        {matchup?.matchups?.length > 0 && (
                          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted2)', marginBottom: 12 }}>
                            // Win% = {selectedHero.hero_name}'s team wins
                          </p>
                        )}
                        <SynergyTable
                          rows={matchup?.matchups}
                          emptyMsg="// No role matchup data"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          )}

        </div>{/* sidebar-content */}
      </div>{/* page-layout */}

      {/* Roster Picked / Banned list modals */}
      {modalData && (
        <div
          onClick={() => setModalData(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ width: 'min(480px, 100%)', maxHeight: '90vh', overflowY: 'auto', background: '#0b0b14', border: '1px solid var(--accent)', borderRadius: 4, boxShadow: '0 16px 36px rgba(0,0,0,0.85)' }}
          >
            <div className="match-popover-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', padding: '12px 16px' }}>
              <span className="match-popover-title" style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.06em' }}>
                // {modalData.title}
              </span>
              <button
                className="match-popover-close"
                onClick={() => setModalData(null)}
                aria-label="Close"
                style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 20, cursor: 'pointer' }}
              >
                &times;
              </button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 12 }}>
                {modalData.heroes.map(h => (
                  <div key={h.heroid || h.hero_id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
                    <HeroImg heroid={h.heroid || h.hero_id} size={24} />
                    <span style={{ fontSize: 12, fontWeight: 600 }}>{h.hero_name}</span>
                  </div>
                ))}
                {modalData.heroes.length === 0 && (
                  <span style={{ color: 'var(--muted2)', fontSize: 12 }}>No heroes in this category.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
