'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { HeroImg, RoleImg, PlayerAvatar, PlayerPhoto } from '../Images';
import TeamLogo from '../TeamLogo';
import PageHead from '../PageHead';
import { img } from '../../lib/images';

const dash = (v) => (v !== null && v !== undefined && v !== 0) ? v : '—';
const ROLE_ORDER = ['EXP LANE', 'JUNGLE', 'MID LANE', 'ROAM', 'GOLD LANE'];

// Reusable synergy/matchup table
function HeroTable({ rows, emptyMsg }) {
  if (!rows || !rows.length) return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted2)', padding: '12px 0' }}>
      {emptyMsg || '// No data'}
    </div>
  );
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          {['#', 'Hero', 'GP', 'W', 'L', 'WR%'].map(col => (
            <th key={col} style={{
              textAlign: col === '#' || col === 'Hero' ? 'left' : 'center',
              padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted2)',
              borderBottom: '1px solid var(--border)', background: 'transparent', position: 'static'
            }}>{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((hero, i) => {
          const wr = hero.win_rate;
          const wpClr = wr >= 50 ? 'var(--win)' : 'var(--loss)';
          return (
            <tr key={hero.heroid} style={{ borderBottom: '1px solid var(--border)' }}>
              <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>{i + 1}</td>
              <td style={{ padding: '6px 8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <HeroImg heroid={hero.heroid} size={24} />
                  <span style={{ fontWeight: 600 }}>{hero.hero_name}</span>
                </div>
              </td>
              <td style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{hero.games}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'var(--font-mono)', color: 'var(--win)' }}>{hero.wins}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'var(--font-mono)', color: 'var(--loss)' }}>{hero.losses}</td>
              <td style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: wpClr }}>{wr}%</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default function DraftStatsView({ featured, eff, label }) {
  const scope = eff.scope || featured?.tournament_code || 'MSC';
  const season = eff.season || featured?.season || '2026';

  const [phase, setPhase] = useState('overall'); // 'overall', 'qualifier', 'main'
  const [patch, setPatch] = useState('all');
  const [side, setSide] = useState('overall'); // 'overall', 'blue', 'red'

  const [patches, setPatches] = useState([]);
  const [data, setData] = useState(null);
  const [teamPicks, setTeamPicks] = useState({});
  const [mostPlayed, setMostPlayed] = useState({});
  const [heroRoles, setHeroRoles] = useState({});
  const [teams, setTeams] = useState([]);

  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState('presence');
  const [asc, setAsc] = useState(false);

  // Hero filter section
  const [selectedHero, setSelected] = useState(null);
  const [synergy, setSynergy] = useState(null);
  const [heroPatchesList, setHeroPatchesList] = useState([]); // selected hero patch distribution stats
  const [matchup, setMatchup] = useState(null);
  const [filterLoading, setFilterLoading] = useState(false);
  const [modalData, setModalData] = useState(null); // { title: string, heroes: Array }

  // Fetch available patches list for the featured tournament on mount
  useEffect(() => {
    fetch(`/api/intl/patches?scope=${scope}&season=${season}`)
      .then(r => r.json())
      .then(d => setPatches(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [scope, season]);

  // Build unified query parameters string
  const buildQ = (overrideSide = side) => {
    const p = [];
    p.push(`scope=${scope}`);
    p.push(`season=${season}`);
    if (phase !== 'overall') p.push(`stage=${phase}`);
    if (patch !== 'all') p.push(`patch=${encodeURIComponent(patch)}`);
    if (overrideSide !== 'overall') p.push(`side=${overrideSide}`);
    return p.length ? '?' + p.join('&') : '';
  };

  // Main data fetch (triggers on any global filter changes)
  useEffect(() => {
    setLoading(true);
    const q = buildQ();

    Promise.all([
      fetch(`/api/intl/stats/draft${q}`).then(r => r.json()).catch(() => null),
      fetch(`/api/intl/stats/draft/team-picks${q}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/intl/stats/draft/most-played-by${q}`).then(r => r.json()).catch(() => ({})),
      fetch(`/api/intl/stats/draft/hero-roles${q}`).then(r => r.json()).catch(() => ({})),
    ]).then(([draftData, picks, mp, hr]) => {
      if (draftData) {
        setData(draftData);
        setTeams(draftData.teams || []);
      } else {
        setData(null);
        setTeams([]);
      }
      setTeamPicks(picks || {});
      setMostPlayed(mp || {});
      setHeroRoles(hr && typeof hr === 'object' ? hr : {});
      setLoading(false);
    });
  }, [side, phase, patch, scope, season]);

  // Hero filter fetch (selectedHero or global filters changes)
  useEffect(() => {
    if (!selectedHero) { setSynergy(null); setHeroPatchesList([]); setMatchup(null); return; }
    setFilterLoading(true);

    const qp = [];
    qp.push(`scope=${scope}`);
    qp.push(`season=${season}`);
    if (side !== 'overall') qp.push(`side=${side}`);
    if (phase !== 'overall') qp.push(`stage=${phase}`);
    if (patch !== 'all') qp.push(`patch=${encodeURIComponent(patch)}`);
    
    const qs = qp.length ? ('?' + qp.join('&')) : '';
    const hid = selectedHero.heroid;

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

  const toggleSort = (col) => {
    if (sort === col) setAsc(prev => !prev);
    else { setSort(col); setAsc(false); }
  };

  const heroes = data?.heroes || [];
  const totalGames = data?.total_games || 0;

  const sorted = [...heroes].sort((a, b) => {
    const raw_va = a[sort], raw_vb = b[sort];
    const va = raw_va == null ? (asc ? Infinity : -Infinity) : isNaN(Number(raw_va)) ? raw_va : Number(raw_va);
    const vb = raw_vb == null ? (asc ? Infinity : -Infinity) : isNaN(Number(raw_vb)) ? raw_vb : Number(raw_vb);
    if (typeof va === 'string') return asc ? va.localeCompare(vb) : vb.localeCompare(va);
    if (va === vb) return Number(b.presence || 0) - Number(a.presence || 0);
    return asc ? va - vb : vb - va;
  });

  const Th = ({ col, label, title, left, sticky }) => {
    const isSorted = sort === col;
    const sortOrder = isSorted ? (asc ? 'ascending' : 'descending') : 'none';
    return (
      <th
        aria-sort={sortOrder}
        className={`${left ? 'l ' : ''}${sortableClass(col)} ${isSorted ? 'sorted' : ''} ${sticky ? 'sticky-col-player' : ''}`.trim()}
        style={{
          whiteSpace: 'nowrap',
          padding: 0,
        }}
      >
        <button
          type="button"
          className="th-sort"
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
            textAlign: left ? 'left' : 'center',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: left ? 'flex-start' : 'center',
            gap: 4
          }}
        >
          {label}
          <span className="sort-ind" aria-hidden="true">
            {isSorted ? (asc ? '▲' : '▼') : ''}
          </span>
        </button>
      </th>
    );
  };

  const sortableClass = (col) => {
    return col !== 'roles' ? 'sortable' : '';
  };

  const ThStatic = ({ label, title, style: s }) => (
    <th title={title} style={{ whiteSpace: 'nowrap', textAlign: 'center', cursor: 'default', ...s }}>{label}</th>
  );

  const SectionHeader = ({ label, color, borderColor }) => (
    <th style={{
      background: color, borderLeft: `2px solid ${borderColor}`, color: borderColor,
      fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '.1em',
      textAlign: 'center', whiteSpace: 'nowrap', padding: '6px 10px', cursor: 'default', textTransform: 'uppercase'
    }}>
      {label}
    </th>
  );

  const picked = heroes.filter(h => Number(h.picks) > 0).length;
  const banned = heroes.filter(h => Number(h.bans) > 0).length;
  const notBanned = heroes.filter(h => Number(h.picks) > 0 && Number(h.bans) === 0);
  const notPicked = heroes.filter(h => Number(h.bans) > 0 && Number(h.picks) === 0);

  const filterLabel = () => {
    const parts = [];
    if (phase !== 'overall') parts.push(phase === 'qualifier' ? 'Wildcard' : 'Main');
    if (patch !== 'all') parts.push(`Patch ${patch}`);
    if (side !== 'overall') parts.push(`${side.toUpperCase()} Side`);
    return parts.length ? parts.join(' · ') : 'All Games';
  };

  return (
    <div className="container" style={{ paddingBottom: 40 }}>
      {/* ── Masthead ── */}
      <PageHead eyebrow={label} title="Draft Stats">
        Draft presence, pick/ban counts, side stats, and matchups for {filterLabel()}.
      </PageHead>

      {/* ── Top Filters ── */}
      <div className="filterbar-wrap" style={{ marginBottom: 24 }}>
        <div className="filterbar">
          <div className="filter-group">
            <label>Phase</label>
            <div className="seg">
              <button type="button" className={phase === 'overall' ? 'on' : ''} onClick={() => setPhase('overall')}>Overall</button>
              <button type="button" className={phase === 'qualifier' ? 'on' : ''} onClick={() => setPhase('qualifier')}>Wildcard</button>
              <button type="button" className={phase === 'main' ? 'on' : ''} onClick={() => setPhase('main')}>Main</button>
            </div>
          </div>

          <div className="filter-group">
            <label>Patch</label>
            <select value={patch} onChange={(e) => setPatch(e.target.value)}>
              <option value="all">All Patches</option>
              {patches.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Side</label>
            <div className="seg">
              <button type="button" className={side === 'overall' ? 'on' : ''} onClick={() => setSide('overall')}>Overall</button>
              <button type="button" className={side === 'blue' ? 'on' : ''} onClick={() => setSide('blue')}>Blue</button>
              <button type="button" className={side === 'red' ? 'on' : ''} onClick={() => setSide('red')}>Red</button>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="empty">Loading stats...</div>
      ) : heroes.length === 0 ? (
        <div className="empty">No draft data found for this selection.</div>
      ) : (
        <>
          {/* Hero Pool Summary */}
          <div style={{ display: 'flex', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
            <div className="card" style={{ flex: '1 1 180px', padding: '14px 18px' }}>
              <div className="k" style={{ marginBottom: 6 }}>Unique Heroes Picked</div>
              <div className="v" style={{ fontWeight: 800, color: 'var(--text)' }}>{picked}</div>
            </div>
            <div className="card" style={{ flex: '1 1 180px', padding: '14px 18px' }}>
              <div className="k" style={{ marginBottom: 6 }}>Unique Heroes Banned</div>
              <div className="v" style={{ fontWeight: 800, color: 'var(--text)' }}>{banned}</div>
            </div>
            <div className="card" style={{ flex: '1 1 180px', padding: '14px 18px' }}>
              <div className="k" style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Picked, Not Banned</span>
                <button
                  type="button"
                  onClick={() => setModalData({ title: 'Picked, Not Banned Heroes', heroes: notBanned })}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 0 }}
                >
                  ⓘ
                </button>
              </div>
              <div className="v" style={{ fontWeight: 800, color: 'var(--text)' }}>{notBanned.length}</div>
            </div>
            <div className="card" style={{ flex: '1 1 180px', padding: '14px 18px' }}>
              <div className="k" style={{ marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Banned, Not Picked</span>
                <button
                  type="button"
                  onClick={() => setModalData({ title: 'Banned, Not Picked Heroes', heroes: notPicked })}
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 13, padding: 0 }}
                >
                  ⓘ
                </button>
              </div>
              <div className="v" style={{ fontWeight: 800, color: 'var(--text)' }}>{notPicked.length}</div>
            </div>
          </div>

          {/* Quick bar-list summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[
              { title: 'Most Picked', key: 'picks', color: 'var(--accent)' },
              { title: 'Most Banned', key: 'bans', color: 'var(--neutral2)' },
              { title: 'Most Contested', key: 'presence', color: 'var(--muted)' },
            ].map(l => {
              const top = [...heroes].filter(h => Number(h[l.key]) > 0).sort((a, b) => Number(b[l.key]) - Number(a[l.key])).slice(0, 8);
              const max = Number(top[0]?.[l.key]) || 1;
              return (
                <div key={l.key} className="card" style={{ padding: '16px' }}>
                  <div className="section-header" style={{ fontSize: 13, marginBottom: 12, textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--accent)', letterSpacing: '0.05em' }}>
                    {l.title}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {top.map((h, i) => {
                      const v = Number(h[l.key]);
                      const pctVal = Math.round(v / max * 100);
                      return (
                        <div key={h.heroid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', width: 14, textAlign: 'right' }}>{i + 1}</span>
                          <HeroImg heroid={h.heroid} size={24} />
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
                    {top.length === 0 && <span style={{ color: 'var(--muted2)', fontSize: 11 }}>none</span>}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Draft Table */}
          <div className="table-wrap" style={{ margin: '22px 0', overflowX: 'auto', position: 'relative' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr>
                  <Th col="hero_name" label="Hero" title="Hero name" left sticky />
                  <Th col="picks" label="Picks" title="Times picked" />
                  <Th col="bans" label="Bans" title="Times banned" />
                  <Th col="presence" label="Presence" title="Picks + Bans total" />
                  <Th col="pick_rate" label="Pick%" title="Picks / total games × 100" />
                  <Th col="ban_rate" label="Ban%" title="Bans / total games × 100" />
                  <Th col="presence_rate" label="Pres%" title="Presence / total games × 100" />
                  <Th col="pick_wins" label="W" title="Wins when picked" />
                  <Th col="win_rate" label="Win%" title="Win rate when picked" />
                  <Th col="avg_kda" label="Avg KDA" title="Average KDA when picked" />
                  <Th col="avg_kp" label="Avg KP%" title="Average kill participation" />
                  <Th col="avg_damage" label="Avg Dmg" title="Average damage dealt" />
                  <Th col="avg_gpm" label="Avg GPM" title="Average gold per minute" />
                  <ThStatic label="Roles" title="Role distribution of picks" style={{ minWidth: 120, background: 'var(--surface2)' }} />
                  
                  {teams.length > 0 && (
                    <>
                      <SectionHeader label="Team Draft Stats" color="rgba(255,215,0,0.06)" borderColor="var(--accent)" />
                      {teams.map(tc => (
                        <ThStatic key={tc} label={tc} title={`${tc} — picks and Win%`}
                          style={{ background: 'var(--surface2)', minWidth: 72 }} />
                      ))}
                    </>
                  )}
                  
                  <SectionHeader label="Most Played By" color="rgba(77,166,255,0.06)" borderColor="var(--blue)" />
                  <ThStatic label="Player" style={{ background: 'var(--surface2)', minWidth: 140 }} />
                  <ThStatic label="Team" style={{ background: 'var(--surface2)' }} />
                  <ThStatic label="GP" style={{ background: 'var(--surface2)' }} />
                  <ThStatic label="W" style={{ background: 'var(--surface2)' }} />
                  <ThStatic label="Win%" style={{ background: 'var(--surface2)' }} />
                </tr>
              </thead>
              <tbody>
                {sorted.map(h => {
                  const wpColor = h.win_rate >= 50 ? 'var(--win)' : h.win_rate > 0 ? 'var(--loss)' : 'var(--muted2)';
                  const mp = mostPlayed[h.heroid];
                  const mpWpColor = mp && mp.win_rate >= 50 ? 'var(--win)' : mp && mp.win_rate > 0 ? 'var(--loss)' : 'var(--muted2)';
                  const tp = teamPicks[h.heroid] || {};
                  const rd = heroRoles[h.heroid];
                  return (
                    <tr key={h.heroid} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td className="sticky-col-player">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 150 }}>
                          <HeroImg heroid={h.heroid} size={32} />
                          <span style={{ fontWeight: 600 }}>{h.hero_name}</span>
                        </div>
                      </td>
                      <td className="num center" style={{ color: 'var(--accent)' }}>{dash(h.picks)}</td>
                      <td className="num center" style={{ color: 'var(--muted2)' }}>{dash(h.bans)}</td>
                      <td className="num center" style={{ fontWeight: 700 }}>{dash(h.presence)}</td>
                      <td className="num center">{h.pick_rate ? h.pick_rate + '%' : '—'}</td>
                      <td className="num center">{h.ban_rate ? h.ban_rate + '%' : '—'}</td>
                      <td className="num center">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
                          <div className="bar" style={{ width: 36, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                            <div className="bar-fill" style={{ height: '100%', width: (h.presence_rate || 0) + '%', background: (h.presence_rate || 0) >= 70 ? 'var(--win)' : 'var(--accent)' }} />
                          </div>
                          {h.presence_rate ? h.presence_rate + '%' : '—'}
                        </div>
                      </td>
                      <td className="num center" style={{ color: 'var(--win)' }}>{dash(h.pick_wins)}</td>
                      <td className="num center" style={{ fontWeight: 700, color: wpColor }}>{h.win_rate ? h.win_rate + '%' : '—'}</td>
                      <td className="num center" style={{ color: 'var(--accent)' }}>{dash(h.avg_kda)}</td>
                      <td className="num center">{h.avg_kp ? h.avg_kp + '%' : '—'}</td>
                      <td className="num center">{h.avg_damage ? Math.round(h.avg_damage).toLocaleString() : '—'}</td>
                      <td className="num center">{h.avg_gpm ? Math.round(h.avg_gpm) : '—'}</td>

                      {/* Role distribution */}
                      <td style={{ padding: '6px 10px', minWidth: 120 }}>
                        {rd && rd.total > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                            {ROLE_ORDER.filter(r => rd[r] > 0).map(r => {
                              const pctVal = Math.round(rd[r] / rd.total * 100);
                              return (
                                <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <RoleImg role={r} size={11} />
                                  <div style={{ flex: 1, height: 5, background: 'var(--border)', borderRadius: 3 }}>
                                    <div style={{ width: pctVal + '%', height: '100%', background: 'var(--muted)', borderRadius: 3 }} />
                                  </div>
                                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted2)', minWidth: 28, textAlign: 'right' }}>{pctVal}%</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : <span style={{ color: 'var(--muted2)', fontSize: 10 }}>—</span>}
                      </td>

                      {/* Team Draft Stats */}
                      {teams.length > 0 && (
                        <>
                          <td style={{ borderLeft: '2px solid var(--accent)', background: 'rgba(255,215,0,0.02)', width: 1, padding: 0 }} />
                          {teams.map(tc => {
                            const t = tp[tc];
                            if (!t || t.picks === 0) return <td key={tc} className="num center" style={{ color: 'var(--muted2)', background: 'rgba(255,215,0,0.01)', fontSize: 11 }}>—</td>;
                            const winPct = t.picks > 0 ? Math.round(t.wins / t.picks * 100) : 0;
                            return (
                              <td key={tc} className="num center" style={{ background: 'rgba(255,215,0,0.02)', whiteSpace: 'nowrap', padding: '6px 10px' }}>
                                <span style={{ fontWeight: 700, fontSize: 13 }}>{t.picks}</span>
                                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: winPct >= 50 ? 'var(--win)' : 'var(--loss)', fontWeight: 700, marginTop: 1 }}>{winPct}%</div>
                              </td>
                            );
                          })}
                        </>
                      )}

                      {/* Most Played By */}
                      <td style={{ borderLeft: '2px solid var(--blue)', background: 'transparent', width: 1, padding: 0 }} />
                      <td style={{ padding: '6px 10px' }}>
                        {mp ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PlayerPhoto photoUrl={mp.photo_url} name={mp.player_name} size={36} />
                            {mp.player_key ? (
                              <Link href={`/players/${encodeURIComponent(mp.player_key)}`} style={{ fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', fontSize: 13, textDecoration: 'none' }}>
                                {mp.player_name}
                              </Link>
                            ) : (
                              <span style={{ fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', fontSize: 13 }}>{mp.player_name}</span>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                      <td className="center" style={{ padding: '6px 10px' }}>
                        {mp ? (
                          <Link href={`/teams/${mp.team_code}`} style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', textDecoration: 'none' }}>
                            <TeamLogo src={mp.team_logo} fallbackSrc={img.team(mp.team_code)} size={20} style={{ width: 20, height: 20, objectFit: 'contain' }} />
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--accent)', letterSpacing: '.06em' }}>{mp.team_code}</span>
                          </Link>
                        ) : '—'}
                      </td>
                      <td className="num center" style={{ background: 'rgba(0,168,255,0.02)' }}>{mp ? mp.games : '—'}</td>
                      <td className="num center" style={{ color: 'var(--win)', background: 'rgba(0,168,255,0.02)' }}>{mp ? mp.wins : '—'}</td>
                      <td className="num center" style={{ fontWeight: 700, color: mpWpColor, background: 'rgba(0,168,255,0.02)' }}>
                        {mp && mp.win_rate !== null ? mp.win_rate + '%' : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ── Hero Filter Section ── */}
          <div style={{ marginTop: 40 }} id="hero-filter">
            <div className="section-header" style={{ textTransform: 'uppercase', fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 14, letterSpacing: '0.05em', marginBottom: 6 }}>
              Hero Filter
            </div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', marginBottom: 16, letterSpacing: '.06em' }}>
              // Select a hero below to view patch distribution, synergy, and role matchups
            </p>

            {/* Side filter removed as it is redundant with the main filter */}

            {/* Hero buttons */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24, padding: '16px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8 }}>
              {heroes.filter(h => h.picks > 0).sort((a, b) => b.picks - a.picks).map(h => {
                const isSelected = selectedHero?.heroid === h.heroid;
                return (
                  <button key={h.heroid}
                    type="button"
                    onClick={() => setSelected(prev => prev?.heroid === h.heroid ? null : h)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px',
                      background: isSelected ? 'rgba(255,215,0,0.07)' : 'var(--surface)',
                      border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--border)'),
                      borderRadius: 6,
                      cursor: 'pointer',
                      transition: 'border-color var(--dur-fast) var(--ease), background var(--dur-fast) var(--ease)'
                    }}>
                    <HeroImg heroid={h.heroid} size={22} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: isSelected ? 700 : 500, color: isSelected ? 'var(--accent)' : 'var(--text)', whiteSpace: 'nowrap' }}>
                      {h.hero_name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>{h.picks}</span>
                  </button>
                );
              })}
            </div>

            {/* Hero detail panels */}
            {selectedHero && (
              <div style={{ padding: '24px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12 }}>
                {/* Hero header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                  <HeroImg heroid={selectedHero.heroid} size={40} />
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800 }}>{selectedHero.hero_name}</span>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    style={{
                      fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)',
                      background: 'none', border: '1px solid var(--border)', borderRadius: 4,
                      padding: '4px 10px', cursor: 'pointer', marginLeft: 12,
                      transition: 'color var(--dur-fast) var(--ease), border-color var(--dur-fast) var(--ease)'
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

                    {/* B+C. Played With | Played Against | Role vs Role — 3 columns */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 24 }}>
                      {/* Played With */}
                      <div className="card" style={{ padding: '16px', background: 'var(--surface)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--win)', letterSpacing: '.08em', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                          Played With ({synergy?.played_with?.length || 0} heroes)
                        </div>
                        <HeroTable rows={synergy?.played_with} emptyMsg="// No team synergy data" />
                      </div>

                      {/* Played Against */}
                      <div className="card" style={{ padding: '16px', background: 'var(--surface)' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--loss)', letterSpacing: '.08em', marginBottom: 12, fontWeight: 700, textTransform: 'uppercase' }}>
                          Played Against ({synergy?.played_against?.length || 0} heroes)
                        </div>
                        <HeroTable rows={synergy?.played_against} emptyMsg="// No matchup data" />
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
                        <HeroTable
                          rows={matchup?.matchups}
                          emptyMsg="// No role matchup data"
                        />
                      </div>
                    </div>

                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
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
                  <div key={h.heroid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 6 }}>
                    <HeroImg heroid={h.heroid} size={24} />
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
