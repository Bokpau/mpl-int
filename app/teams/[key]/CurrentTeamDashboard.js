'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { img } from '../../../lib/images';
import { int, dec, pct, wrClass } from '../../../lib/format';
import { HeroImg, TeamImg, RoleImg, PlayerPhoto } from '../../../components/Images';
import TeamLogo from '../../../components/TeamLogo';
import ErrorBox from '../../../components/ErrorBox';
import { TeamStatsTimeline } from '../../../components/TeamStatsTimeline';
import { ObjectiveTimingChart } from '../../../components/ObjectiveTimingChart';
import { TeamKdaDistribution } from '../../../components/TeamKdaDistribution';
import SynergyTable from '../../../components/SynergyTable';

const ROLE_ORDER = ['EXP LANE', 'JUNGLE', 'MID LANE', 'ROAM', 'GOLD LANE'];

function fmtTime(s) {
  if (!s) return '--:--';
  const sec = Math.round(parseFloat(s));
  const m = Math.floor(sec / 60);
  const ss = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

const getPct = (wins, games) => (games > 0 ? Math.round((wins / games) * 100) : 0);

function StatCard({ label, value, rank, color, sub }) {
  return (
    <div className="card" style={{ padding: '14px 16px', minWidth: 120, flex: '1 1 120px' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,.6)', letterSpacing: '.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 800, color: color || 'var(--text)', lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,.55)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}



export default function CurrentTeamDashboard({ teamKey, scope, season, initial }) {
  // Filters state (matches PlayerStatsView.js)
  const [stage, setStage] = useState('');
  const [side, setSide] = useState('');
  const [result, setResult] = useState('');
  const [patch, setPatch] = useState('all');

  // Roster lists and rows states
  const [teamData, setTeamData] = useState(initial);
  const [draftData, setDraftData] = useState({ summary: null, heroes: [] });
  const [pickSlots, setPickSlots] = useState(null);
  const [draftHistory, setDraftHistory] = useState([]);
  const [patches, setPatches] = useState([]);

  // Loading/error states
  const [loading, setLoading] = useState(false);
  const [draftLoading, setDraftLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected hero filter inside Draft Stats
  const [draftHero, setDraftHero] = useState(null);
  const [draftSyn, setDraftSyn] = useState(null);
  const [draftPat, setDraftPat] = useState([]);
  const [draftMu, setDraftMu] = useState(null);
  const [draftFL, setDraftFL] = useState(false);

  // Team Data Analysis panels (collapsed by default; timeline opened by default)
  const [analysisPanels, setAnalysisPanels] = useState(() => new Set(['timeline']));
  const toggleAnalysis = (key) => setAnalysisPanels(prev => {
    const next = new Set(prev);
    next.has(key) ? next.delete(key) : next.add(key);
    return next;
  });
  const [subjectStats, setSubjectStats] = useState(null);
  const [teamsList, setTeamsList] = useState([]);
  const [cmpTeam, setCmpTeam] = useState(null);   // comparison team_key
  const [cmpData, setCmpData] = useState(null);
  const [vsOpps, setVsOpps] = useState([]);
  const [vsLoading, setVsLoading] = useState(false);

  // Fetch available patches for this tournament scope + season on mount
  useEffect(() => {
    fetch(`/api/intl/patches?scope=${scope}&season=${season}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(d => setPatches(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [scope, season]);

  // Build unified query params string for API requests
  const buildQ = useCallback((stageVal = stage, sideVal = side, resultVal = result, patchVal = patch) => {
    const p = new URLSearchParams();
    p.set('scope', scope);
    p.set('season', season);
    if (stageVal) p.set('stage', stageVal);
    if (sideVal) p.set('side', sideVal);
    if (resultVal) p.set('result', resultVal);
    if (patchVal && patchVal !== 'all') p.set('patch', patchVal);
    const s = p.toString();
    return s ? '?' + s : '';
  }, [scope, season, stage, side, result, patch]);

  // Main data refetch triggered by filter changes
  useEffect(() => {
    setLoading(true);
    setDraftLoading(true);
    setError(null);

    const q = buildQ();

    Promise.all([
      api.team(teamKey, q).catch(err => { throw err; }),
      api.teamDraft(teamKey, q).catch(() => null),
      api.teamDraftPickSlots(teamKey, q).catch(() => null),
      api.teamDraftHistory(teamKey, q).catch(() => []),
    ])
      .then(([tData, dData, slots, history]) => {
        setTeamData(tData);
        if (dData) {
          setDraftData({ summary: dData.summary || null, heroes: dData.heroes || [] });
        } else {
          setDraftData({ summary: null, heroes: [] });
        }
        setPickSlots(slots);
        setDraftHistory(history);
        setLoading(false);
        setDraftLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
        setDraftLoading(false);
      });
  }, [teamKey, stage, side, result, patch, buildQ]);

  // Fetch details for selected draft hero (synergy, patches, matchup)
  useEffect(() => {
    if (!draftHero) {
      setDraftSyn(null);
      setDraftPat([]);
      setDraftMu(null);
      return;
    }

    setDraftFL(true);
    const q = buildQ();
    const hid = draftHero.heroid;

    Promise.all([
      api.teamDraftSynergy(teamKey, hid, q).catch(() => null),
      api.teamDraftPatches(teamKey, hid, q).catch(() => []),
      api.teamDraftMatchup(teamKey, hid, q).catch(() => null),
    ]).then(([syn, pat, mu]) => {
      setDraftSyn(syn);
      setDraftPat(Array.isArray(pat) ? pat : []);
      setDraftMu(mu);
      setDraftFL(false);
    });
  }, [draftHero, teamKey, stage, side, result, patch, buildQ]);

  // Comparison panel: subject-team rich stats + the pickable team list.
  useEffect(() => {
    if (!analysisPanels.has('comparison')) return;
    const q = buildQ();
    api.teamAnalyticsStats(teamKey, q).then(setSubjectStats).catch(() => setSubjectStats(null));
    api.teams(q).then(d => setTeamsList(Array.isArray(d) ? d : [])).catch(() => setTeamsList([]));
  }, [analysisPanels, teamKey, buildQ]);

  // Comparison target's rich stats.
  useEffect(() => {
    if (!cmpTeam) { setCmpData(null); return; }
    api.teamAnalyticsStats(cmpTeam, buildQ()).then(setCmpData).catch(() => setCmpData(null));
  }, [cmpTeam, buildQ]);

  // vs-Opponents panel.
  useEffect(() => {
    if (!analysisPanels.has('vs_opponents')) return;
    setVsLoading(true);
    api.teamVsOpponents(teamKey, buildQ())
      .then(d => { setVsOpps(Array.isArray(d) ? d : []); setVsLoading(false); })
      .catch(() => { setVsOpps([]); setVsLoading(false); });
  }, [analysisPanels, teamKey, buildQ]);

  const isFiltered = stage !== '' || side !== '' || result !== '' || patch !== 'all';
  const resetFilters = () => {
    setStage('');
    setSide('');
    setResult('');
    setPatch('all');
  };

  const t = teamData?.totals || {};
  const roster = teamData?.roster || [];
  const winPct = t.games > 0 ? Math.round((t.wins / t.games) * 100) : 0;

  // Group Roster by lane and sort
  const sortedRoster = useMemo(() => {
    return [...roster].sort((a, b) => {
      const idxA = ROLE_ORDER.indexOf(a.role_lane || '');
      const idxB = ROLE_ORDER.indexOf(b.role_lane || '');
      return (idxA < 0 ? 9 : idxA) - (idxB < 0 ? 9 : idxB);
    });
  }, [roster]);

  // Match results grouping by opponent
  const oppMatchesMap = useMemo(() => {
    const map = {};
    if (draftHistory) {
      draftHistory.forEach(g => {
        const opp = g.opp_code;
        if (!map[opp]) map[opp] = [];
        // Group games by match_code
        let match = map[opp].find(m => m.match_code === g.match_code);
        if (!match) {
          match = {
            match_code: g.match_code,
            week: g.week_number,
            phase: g.phase,
            opp: opp,
            games: [],
            wins: 0,
            losses: 0,
          };
          map[opp].push(match);
        }
        match.games.push(g);
        if (g.team_won) match.wins++;
        else match.losses++;
      });
    }
    return map;
  }, [draftHistory]);

  return (
    <div className="container">
      {/* ── Crumb & Title ── */}
      <div className="crumb"><Link href="/teams">← Teams</Link></div>

      {/* ── Premium Masthead ── */}
      <div style={{
        background: 'linear-gradient(90deg, rgba(26,26,46,0.9) 0%, rgba(18,18,32,0.9) 100%)',
        borderLeft: '4px solid var(--accent)',
        borderRight: '1px solid var(--border)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '20px 24px',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', display: 'inline-flex' }}>
            <TeamLogo src={t.team_logo_dark} fallbackSrc={img.team(t.team_code)} alt="" className="big-avatar sq" style={{ width: 64, height: 64, objectFit: 'contain' }} />
          </div>
          
          <div style={{ flex: 1, minWidth: 200 }}>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: 'var(--text)', lineHeight: 1.1, margin: 0, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
              {t.team_name || t.team_code || teamKey}
            </h1>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{scope} {season}</span>
            </div>
          </div>

          {/* Inline mini metrics */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', minWidth: 65, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>GP</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>{t.games || 0}</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', minWidth: 65, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>Win%</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: winPct >= 50 ? 'var(--win)' : 'var(--loss)', marginTop: 2 }}>{winPct}%</div>
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 12px', minWidth: 65, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', textTransform: 'uppercase' }}>W-L</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 800, color: 'var(--text)', marginTop: 2 }}>
                <span style={{ color: 'var(--win)' }}>{t.wins || 0}W</span>–<span style={{ color: 'var(--loss)' }}>{(t.games || 0) - (t.wins || 0)}L</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters Section (unified with Current Player Stats) ── */}
      <div className="card" style={{ marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 16, padding: 18 }}>
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Stage */}
          <div className="filter-group">
            <label>Stage</label>
            <div className="seg">
              {[
                { val: '', label: 'Overall' },
                { val: 'qualifier', label: 'Wild Card' },
                { val: 'main', label: 'Main' }
              ].map(st => (
                <button key={st.val} className={stage === st.val ? 'on' : ''} onClick={() => setStage(st.val)}>
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Side */}
          <div className="filter-group">
            <label>Side</label>
            <div className="seg">
              {[
                { val: '', label: 'All' },
                { val: 'blue', label: 'Blue' },
                { val: 'red', label: 'Red' }
              ].map(s => (
                <button key={s.val} className={side === s.val ? 'on' : ''} onClick={() => setSide(s.val)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* W/L */}
          <div className="filter-group">
            <label>W/L</label>
            <div className="seg">
              {[
                { val: '', label: 'All' },
                { val: 'wins', label: 'Wins' },
                { val: 'losses', label: 'Losses' }
              ].map(r => (
                <button key={r.val} className={result === r.val ? 'on' : ''} onClick={() => setResult(r.val)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Patch */}
          {patches.length > 0 && (
            <div className="filter-group">
              <label>Patch</label>
              <select value={patch} onChange={e => setPatch(e.target.value)}>
                <option value="all">All Patches</option>
                {patches.map(p => (
                  <option key={p} value={p}>
                    Patch {p}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Reset Filters */}
        {isFiltered && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              onClick={resetFilters}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                padding: '4px 10px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                cursor: 'pointer',
                borderRadius: 4
              }}
            >
              × Reset filters
            </button>
          </div>
        )}
      </div>

      {error ? (
        <ErrorBox error={error} />
      ) : loading ? (
        <div className="skeleton-table">
          {Array.from({ length: 10 }).map((_, i) => (
            <div className="skeleton sk-row" key={i} />
          ))}
        </div>
      ) : (
        <>
          {/* ── 1. TEAM OVERVIEW ── */}
          <div className="section-title">Team Overview</div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
            <StatCard label="Games" value={int(t.games)} />
            <StatCard label="Wins" value={int(t.wins)} />
            <StatCard label="Win%" value={pct(t.win_rate)} color={wrClass(t.win_rate)} />
            <StatCard label="KDA" value={dec(t.kda)} color="var(--accent)" />
            <StatCard label="GPM" value={int(Math.round(t.gpm))} />
            <StatCard label="DPM" value={int(Math.round(t.dpm))} />
            <StatCard label="Lords" value={int(t.lords)} />
            <StatCard label="Turtles" value={int(t.turtles)} />
          </div>

          {/* ── 2. ROSTER ── */}
          <div className="section-title">Roster</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
            {sortedRoster.map(p => {
              const heroes = (teamData?.player_heroes?.[p.player_key] || []).slice(0, 5);
              return (
                <div key={p.player_key} className="card" style={{ padding: '14px 16px', flex: '1 1 200px', maxWidth: 280, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span title={p.role_lane} aria-label={p.role_lane} style={{ display: 'inline-flex' }}>
                      <RoleImg role={p.role_lane} size={20} />
                    </span>
                    <PlayerPhoto photoUrl={p.photo_url} name={p.player} size={48} />
                    <Link href={`/players/${p.player_key}`} style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', textDecoration: 'none' }}>
                      {p.player}
                    </Link>
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 14 }}>
                    <div>Games: <span style={{ color: 'var(--text)', fontWeight: 700 }}>{int(p.games)}</span></div>
                    <div>Win%: <span style={{ color: wrClass(getPct(p.wins, p.games)), fontWeight: 700 }}>{getPct(p.wins, p.games)}%</span></div>
                    <div>KDA: <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{dec(p.kda)}</span></div>
                  </div>
                  {heroes.length > 0 && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 10 }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,.5)', letterSpacing: '.06em', marginBottom: 6 }}>
                        TOP HEROES
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {heroes.map(h => {
                          const wr = getPct(h.wins, h.games);
                          return (
                            <div key={h.hero_id || h.hero_name} title={`${h.hero_name} — ${h.games}G ${h.wins}W-${h.games - h.wins}L (${wr}% WR)`}
                                 style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <div style={{
                                borderRadius: '50%', overflow: 'hidden', width: 26, height: 26,
                                boxShadow: `0 0 0 2px ${wr >= 50 ? 'var(--win)' : 'var(--loss)'}`
                              }}>
                                <HeroImg heroid={h.hero_id} size={26} style={{ display: 'block' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'rgba(255,255,255,.6)' }}>
                                {h.wins}W-{h.games - h.wins}L
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── 3. TEAM DATA ANALYSIS ── */}
          <div className="section-title">Team Data Analysis</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginBottom: 12 }}>
            // rich (MSC 2026) match data · toggle panels below
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }} role="group" aria-label="Analysis panels toggle">
            {[
              { key: 'timeline',     label: 'Per-Minute Stats Timeline' },
              { key: 'objectives',   label: 'Objective Timing Impact' },
              { key: 'comparison',   label: 'Team vs Team Comparison' },
              { key: 'vs_opponents', label: `${t.team_code || 'Team'} vs Opponents` },
              { key: 'kda_map',      label: 'K/D/A Map Distribution' },
            ].map(p => (
              <button key={p.key} onClick={() => toggleAnalysis(p.key)}
                className={`filter-btn${analysisPanels.has(p.key) ? ' active' : ''}`}
                aria-pressed={analysisPanels.has(p.key)}
                style={{ borderRadius: 2 }}>
                {p.label}
              </button>
            ))}
          </div>

          {analysisPanels.has('timeline') && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', marginBottom: 12 }}>PER-MINUTE STATS TIMELINE</div>
              <TeamStatsTimeline teamKey={teamKey} teamCode={t.team_code} buildQ={buildQ} />
            </div>
          )}

          {analysisPanels.has('objectives') && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', marginBottom: 12 }}>OBJECTIVE TIMING IMPACT</div>
              <ObjectiveTimingChart teamKey={teamKey} teamCode={t.team_code} buildQ={buildQ} totalGames={parseInt(t.games) || 0} />
            </div>
          )}

          {analysisPanels.has('comparison') && (() => {
            const fmt = (v, kind) => {
              if (v == null || v === '') return '—';
              const n = Number(v);
              if (Number.isNaN(n)) return '—';
              if (kind === 'int') return Math.round(n).toLocaleString();
              if (kind === 'd1') return n.toFixed(1);
              return n.toFixed(2);
            };
            const CMP_STATS = [
              { key: 'wins', label: 'Wins', hi: true, kind: 'int' },
              { key: 'avg_kills', label: 'Avg Kills', hi: true, kind: 'd2' },
              { key: 'avg_deaths', label: 'Avg Deaths', hi: false, kind: 'd2' },
              { key: 'avg_kda', label: 'Avg KDA', hi: true, kind: 'd2' },
              { key: 'avg_gpm', label: 'Avg GPM', hi: true, kind: 'int' },
              { key: 'avg_dpm', label: 'Avg DPM', hi: true, kind: 'int' },
              { key: 'avg_lords', label: 'Avg Lords', hi: true, kind: 'd2' },
              { key: 'avg_turtles', label: 'Avg Turtles', hi: true, kind: 'd2' },
              { key: 'avg_turrets', label: 'Avg Turrets', hi: true, kind: 'd2' },
              { key: 'avg_turtle_pct', label: 'Turtle Ctrl%', hi: true, kind: 'd1' },
              { key: 'avg_lord_pct', label: 'Lord Ctrl%', hi: true, kind: 'd1' },
              { key: 'avg_game_min', label: 'Avg Game (min)', hi: false, kind: 'd1' },
            ];
            const others = teamsList.filter(x => x.team_key !== teamKey);
            const cmpCode = teamsList.find(x => x.team_key === cmpTeam)?.team_code_era || cmpData?.team_code || '';
            return (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', marginBottom: 12 }}>TEAM VS TEAM COMPARISON</div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>Compare {t.team_code} vs:</span>
                  {others.length === 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>// no other teams</span>}
                  {others.map(x => (
                    <button key={x.team_key} onClick={() => setCmpTeam(prev => prev === x.team_key ? null : x.team_key)}
                      className={`filter-btn${cmpTeam === x.team_key ? ' active' : ''}`}
                      aria-pressed={cmpTeam === x.team_key}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 2 }}>
                      <TeamLogo src={x.team_logo_dark} fallbackSrc={img.team(x.team_code_era)} alt="" className="avatar sq" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600 }}>{x.team_code_era}</span>
                    </button>
                  ))}
                </div>

                {!cmpTeam ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>// pick a team to compare</div>
                ) : !cmpData || cmpData.games === 0 ? (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--muted)' }}>// no comparison data</div>
                ) : (
                  <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <div className="cmp-grid" style={{ marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <TeamLogo src={t.team_logo_dark} fallbackSrc={img.team(t.team_code)} alt="" className="avatar sq" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>{t.team_code}</span>
                      </div>
                      <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,.5)', fontWeight: 700 }}>vs</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'flex-end' }}>
                        <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>{cmpCode}</span>
                        <TeamLogo src={teamsList.find(x => x.team_key === cmpTeam)?.team_logo_dark} fallbackSrc={img.team(cmpCode)} alt="" className="avatar sq" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                      </div>
                    </div>
                    {CMP_STATS.map(s => {
                      const a = subjectStats ? Number(subjectStats[s.key]) : NaN;
                      const b = cmpData ? Number(cmpData[s.key]) : NaN;
                      const aValid = !Number.isNaN(a), bValid = !Number.isNaN(b);
                      const aBetter = aValid && bValid && a !== b && (s.hi ? a > b : a < b);
                      const bBetter = aValid && bValid && a !== b && (s.hi ? b > a : b < a);
                      const max = Math.max(aValid ? a : 0, bValid ? b : 0, 0.0001);
                      const mo = { fontFamily: 'var(--font-mono)' };
                      return (
                        <div key={s.key} className="cmp-grid" style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
                            <span style={{ ...mo, fontSize: 13, fontWeight: aBetter ? 800 : 600, color: aBetter ? 'var(--accent)' : 'var(--text)' }}>{fmt(a, s.kind)}</span>
                            <div className="cmp-bar" style={{ width: 90, height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${aValid ? (a / max) * 100 : 0}%`, marginLeft: 'auto', background: aBetter ? 'var(--accent)' : 'rgba(255,255,255,.3)', float: 'right' }} />
                            </div>
                          </div>
                          <div style={{ ...mo, textAlign: 'center', fontSize: 10, color: 'var(--muted)', letterSpacing: '.05em' }}>{s.label}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="cmp-bar" style={{ width: 90, height: 5, background: 'rgba(255,255,255,.06)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${bValid ? (b / max) * 100 : 0}%`, background: bBetter ? 'var(--accent)' : 'rgba(255,255,255,.3)' }} />
                            </div>
                            <span style={{ ...mo, fontSize: 13, fontWeight: bBetter ? 800 : 600, color: bBetter ? 'var(--accent)' : 'var(--text)' }}>{fmt(b, s.kind)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}

          {analysisPanels.has('vs_opponents') && (() => {
            const fmt = (v, kind) => {
              if (v == null || v === '') return '—';
              const n = Number(v);
              if (Number.isNaN(n)) return '—';
              if (kind === 'int') return Math.round(n).toLocaleString();
              if (kind === 'd1') return n.toFixed(1);
              return n.toFixed(2);
            };
            const VS_COLS = [
              { key: 'avg_kills', label: 'K', kind: 'd2' },
              { key: 'avg_deaths', label: 'D', kind: 'd2' },
              { key: 'avg_assists', label: 'A', kind: 'd2' },
              { key: 'avg_kda', label: 'KDA', kind: 'd2' },
              { key: 'avg_gpm', label: 'GPM', kind: 'int' },
              { key: 'avg_dpm', label: 'DPM', kind: 'int' },
              { key: 'avg_lords', label: 'Lords', kind: 'd2' },
              { key: 'avg_turtles', label: 'Turtles', kind: 'd2' },
              { key: 'avg_turrets', label: 'Turrets', kind: 'd2' },
              { key: 'first_blood_pct', label: 'FB%', kind: 'd1' },
            ];
            const mo = { fontFamily: 'var(--font-mono)' };
            return (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', marginBottom: 12 }}>{t.team_code} VS OPPONENTS</div>
                {vsLoading ? <div className="loading" /> : vsOpps.length === 0 ? (
                  <div style={{ ...mo, fontSize: 12, color: 'var(--muted)' }}>// No data</div>
                ) : (
                  <div className="table-wrap tbl-sticky" style={{ overflowX: 'auto' }}>
                    <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border)' }}>
                          <th style={{ ...mo, textAlign: 'left', padding: '8px 10px', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>Opponent</th>
                          <th style={{ ...mo, textAlign: 'center', padding: '8px 8px', fontSize: 11, color: 'var(--muted)' }}>W–L</th>
                          {VS_COLS.map(c => (
                            <th key={c.key} style={{ ...mo, textAlign: 'right', padding: '8px 8px', fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>{c.label}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {vsOpps.map(r => {
                          const wins = parseInt(r.wins) || 0;
                          const losses = (parseInt(r.games) || 0) - wins;
                          return (
                            <tr key={r.opp_code} style={{ borderBottom: '1px solid rgba(255,255,255,.05)' }}>
                              <td style={{ padding: '8px 10px', whiteSpace: 'nowrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <TeamLogo src={r.opp_logo_dark} fallbackSrc={img.team(r.opp_code)} alt={r.opp_code} className="avatar sq" style={{ width: 22, height: 22, objectFit: 'contain' }} />
                                  <span style={{ fontWeight: 700, fontSize: 13 }}>{r.opp_code}</span>
                                </div>
                              </td>
                              <td style={{ ...mo, textAlign: 'center', padding: '8px 8px', whiteSpace: 'nowrap' }}>
                                <span style={{ color: 'var(--win)' }}>{wins}</span>–<span style={{ color: 'var(--loss)' }}>{losses}</span>
                              </td>
                              {VS_COLS.map(c => (
                                <td key={c.key} style={{ ...mo, textAlign: 'right', padding: '8px 8px', whiteSpace: 'nowrap' }}>{fmt(r[c.key], c.kind)}</td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })()}

          {analysisPanels.has('kda_map') && (
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '.08em', marginBottom: 12 }}>K/D/A MAP DISTRIBUTION</div>
              <TeamKdaDistribution teamKey={teamKey} buildQ={buildQ} />
            </div>
          )}

          {/* ── 4. MATCH RESULTS ── */}
          <div className="section-title">Match Results</div>
          <div className="table-wrap" style={{ marginBottom: 32 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,.6)', width: 110 }}>Opponent</th>
                  <th style={{ textAlign: 'left', padding: '8px 10px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,.6)' }}>Series</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(oppMatchesMap).map(([opp, oppSeries]) => (
                  <tr key={opp} style={{ borderBottom: '1px solid var(--border)', verticalAlign: 'middle' }}>
                    <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <TeamLogo src={oppSeries[0]?.opp_logo_dark} fallbackSrc={img.team(opp)} alt={opp} className="avatar sq" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                        <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{opp}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px' }}>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                        {oppSeries.map(s => {
                          const won = s.wins > s.losses;
                          const lost = s.losses > s.wins;
                          const clr = won ? 'var(--win)' : lost ? 'var(--loss)' : 'rgba(255,255,255,.4)';
                          return (
                            <div key={s.match_code} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface)', border: '1px solid var(--border)', borderLeft: `3px solid ${clr}`, padding: '6px 10px' }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>W{s.week || '?'}</span>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 800, color: clr }}>{won ? 'WIN' : lost ? 'LOSS' : 'DRAW'}</span>
                              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800 }}>{s.wins}–{s.losses}</span>
                              <div style={{ display: 'flex', gap: 4 }}>
                                {s.games.map((g, gi) => (
                                  <Link key={gi} href={`/matches/${g.battle_id}`} style={{
                                    fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 600,
                                    color: g.team_won ? 'var(--win)' : 'var(--loss)',
                                    background: g.team_won ? 'rgba(0,230,118,.1)' : 'rgba(255,60,90,.1)',
                                    border: `1px solid ${g.team_won ? 'rgba(0,230,118,.3)' : 'rgba(255,60,90,.3)'}`,
                                    padding: '1px 6px', textDecoration: 'none', whiteSpace: 'nowrap',
                                  }}>
                                    G{g.game_number || gi + 1}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                ))}
                {Object.keys(oppMatchesMap).length === 0 && (
                  <tr>
                    <td colSpan="2" style={{ padding: 12, textAlign: 'center', color: 'var(--muted)' }}>No matches recorded under the current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── 5. SIDE SPLITS ── */}
          <div className="section-title">Side Splits</div>
          {draftLoading ? <div className="loading" /> : (() => {
            const summary = draftData.summary;
            if (!summary) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 32 }}>// No side splits data</div>;
            const mo2 = { fontFamily: 'var(--font-mono)' };

            const sides = [
              {
                label: 'BLUE SIDE',
                color: '#42a5f5',
                games: parseInt(summary.blue_games) || 0,
                wins: parseInt(summary.blue_wins) || 0,
                wr: summary.blue_win_pct,
                prioGames: parseInt(summary.blue_prio_games) || 0,
                prioWins: parseInt(summary.blue_prio_wins) || 0,
                prioWr: summary.blue_prio_win_pct,
              },
              {
                label: 'RED SIDE',
                color: '#ef5350',
                games: parseInt(summary.red_games) || 0,
                wins: parseInt(summary.red_wins) || 0,
                wr: summary.red_win_pct,
                prioGames: parseInt(summary.red_prio_games) || 0,
                prioWins: parseInt(summary.red_prio_wins) || 0,
                prioWr: summary.red_prio_win_pct,
              },
            ];

            return (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
                {sides.map(s => {
                  const losses = s.games - s.wins;
                  const prioLosses = s.prioGames - s.prioWins;
                  const wrColor = (s.wr ?? 0) >= 50 ? 'var(--win)' : 'var(--loss)';
                  const prioWrColor = (s.prioWr ?? 0) >= 50 ? 'var(--win)' : 'var(--loss)';
                  const barPct = s.games > 0 ? Math.round((s.wins / s.games) * 100) : 0;
                  const prioBarPct = s.prioGames > 0 ? Math.round((s.prioWins / s.prioGames) * 100) : 0;
                  return (
                    <div key={s.label} className="card" style={{ borderTop: `3px solid ${s.color}`, padding: '16px 20px' }}>
                      <div style={{ ...mo2, fontSize: 11, fontWeight: 700, color: s.color, letterSpacing: '.08em', marginBottom: 16 }}>
                        {s.label}
                      </div>

                      {/* Overall side stats */}
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ ...mo2, fontSize: 9, color: 'rgba(255,255,255,.4)', letterSpacing: '.07em', marginBottom: 8 }}>OVERALL</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 8 }}>
                          {[
                            { lbl: 'GP', val: s.games, clr: s.color },
                            { lbl: 'W', val: s.wins, clr: 'var(--win)' },
                            { lbl: 'L', val: losses, clr: 'var(--loss)' },
                            { lbl: 'WR', val: s.wr != null ? s.wr + '%' : '—', clr: wrColor },
                          ].map(stat => (
                            <div key={stat.lbl} style={{ textAlign: 'center' }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: stat.clr, lineHeight: 1 }}>{stat.val}</div>
                              <div style={{ ...mo2, fontSize: 8, color: 'rgba(255,255,255,.4)', letterSpacing: '.05em', marginTop: 3 }}>{stat.lbl}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: barPct + '%', background: s.color, borderRadius: 2 }} />
                        </div>
                      </div>

                      {/* Prio pick side stats */}
                      <div style={{ borderTop: '1px solid rgba(255,255,255,.07)', paddingTop: 14 }}>
                        <div style={{ ...mo2, fontSize: 9, color: 'var(--muted)', letterSpacing: '.07em', marginBottom: 8 }}>PRIO PICK</div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 6, marginBottom: 8 }}>
                          {[
                            { lbl: 'GP', val: s.prioGames, clr: s.color },
                            { lbl: 'W', val: s.prioWins, clr: 'var(--win)' },
                            { lbl: 'L', val: prioLosses, clr: 'var(--loss)' },
                            { lbl: 'WR', val: s.prioWr != null ? s.prioWr + '%' : '—', clr: prioWrColor },
                          ].map(stat => (
                            <div key={stat.lbl} style={{ textAlign: 'center' }}>
                              <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: stat.clr, lineHeight: 1 }}>{stat.val}</div>
                              <div style={{ ...mo2, fontSize: 8, color: 'rgba(255,255,255,.4)', letterSpacing: '.05em', marginTop: 3 }}>{stat.lbl}</div>
                            </div>
                          ))}
                        </div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,.08)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: prioBarPct + '%', background: 'rgba(255, 215, 0, 0.6)', borderRadius: 2 }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* ── 6. DRAFT STATS ── */}
          <div className="section-title">Draft Stats</div>
          {draftLoading ? <div className="loading" /> : (() => {
            const heroes = draftData.heroes || [];
            const mo = { fontFamily: 'var(--font-mono)' };

            const gs = (h, field) => {
              if (side === 'blue') return h[`b_${field}`] ?? 0;
              if (side === 'red') return h[`r_${field}`] ?? 0;
              return h[field] ?? 0;
            };

            const filteredHeroes = [...heroes]
              .filter(h => gs(h, 'picks') > 0 || gs(h, 'bans') > 0)
              .sort((a, b) => gs(b, 'presence') - gs(a, 'presence'));

            if (!filteredHeroes.length) return <div style={{ ...mo, fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 32 }}>// No draft data matching active filters</div>;

            const totalPicks = filteredHeroes.reduce((sum, h) => sum + gs(h, 'picks'), 0);
            const totalWins = filteredHeroes.reduce((sum, h) => sum + gs(h, 'wins'), 0);
            const pickWR = totalPicks > 0 ? Math.round((totalWins / totalPicks) * 100) : 0;

            return (
              <div style={{ marginBottom: 32 }}>
                <p style={{ ...mo, fontSize: 11, color: 'rgba(255,255,255,.5)', marginBottom: 12 }}>
                  // {t.team_code} draft pool — click a hero for synergy & matchup details
                </p>

                {/* Summary cards */}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
                  {[
                    { label: 'Unique Heroes Picked', value: filteredHeroes.filter(h => gs(h, 'picks') > 0).length, color: 'var(--accent)' },
                    { label: 'Total Picks', value: totalPicks, color: 'var(--text)' },
                    { label: 'Pick Win Rate', value: pickWR + '%', color: pickWR >= 50 ? 'var(--win)' : 'var(--loss)' },
                  ].map(s => (
                    <div key={s.label} className="card" style={{ borderLeft: `3px solid ${s.color}`, padding: '12px 16px', flex: '1 1 130px' }}>
                      <div style={{ ...mo, fontSize: 9, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em', marginBottom: 4 }}>{s.label.toUpperCase()}</div>
                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Hero pool table */}
                <div className="table-wrap tbl-sticky" style={{ overflowX: 'auto', marginBottom: 32 }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: 12, width: '100%' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 12px', ...mo, fontSize: 10, color: 'rgba(255,255,255,.5)' }}>Hero</th>
                        {['Picks', 'W', 'L', 'Win%', 'Prio Picks', 'Adj Picks', '1st Pick', '2 Picks', 'Prio Bans', 'Adj Bans', 'Bans'].map(c => (
                          <th key={c} style={{ textAlign: 'center', padding: '8px 10px', ...mo, fontSize: 10, color: 'rgba(255,255,255,.5)' }}>{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHeroes.map(h => {
                        const picks = gs(h, 'picks');
                        const wins = gs(h, 'wins');
                        const losses = gs(h, 'losses');
                        const wr = picks > 0 ? Math.round((wins / picks) * 100) : 0;
                        const isSelected = draftHero?.heroid === h.heroid;
                        return (
                          <tr key={h.heroid}
                            onClick={() => setDraftHero(prev => (prev?.heroid === h.heroid ? null : h))}
                            style={{ cursor: 'pointer', borderBottom: '1px solid var(--border)', background: isSelected ? 'rgba(255,215,0,0.05)' : 'transparent' }}>
                            <td style={{ padding: '8px 12px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <HeroImg heroid={h.heroid} size={30} />
                                <div>
                                  <div style={{ fontWeight: 700, fontSize: 13 }}>{h.hero_name}</div>
                                  {isSelected && <div style={{ ...mo, fontSize: 9, color: 'var(--accent)' }}>selected ▼</div>}
                                </div>
                              </div>
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--blue)' }}>{picks || '—'}</td>
                            <td style={{ textAlign: 'center', color: 'var(--win)' }}>{wins || '—'}</td>
                            <td style={{ textAlign: 'center', color: 'var(--loss)' }}>{losses || '—'}</td>
                            <td style={{ textAlign: 'center', fontWeight: 700, color: wr >= 50 ? 'var(--win)' : 'var(--loss)' }}>{picks > 0 ? wr + '%' : '—'}</td>
                            <td style={{ textAlign: 'center', color: 'rgba(100,210,120,.9)' }}>{gs(h, 'priority_pick') || '—'}</td>
                            <td style={{ textAlign: 'center', color: 'rgba(100,190,120,.7)' }}>{gs(h, 'adjusted_pick') || '—'}</td>
                            <td style={{ textAlign: 'center', color: 'rgba(160,230,255,.9)' }}>{gs(h, 'first_pick') || '—'}</td>
                            <td style={{ textAlign: 'center', color: 'rgba(110,185,255,.8)' }}>{gs(h, 'two_pick') || '—'}</td>
                            <td style={{ textAlign: 'center', color: 'rgba(255,200,0,.9)' }}>{gs(h, 'priority_ban') || '—'}</td>
                            <td style={{ textAlign: 'center', color: 'rgba(255,175,0,.7)' }}>{gs(h, 'adjusted_ban') || '—'}</td>
                            <td style={{ textAlign: 'center', color: 'rgba(255,200,0,.55)' }}>{gs(h, 'bans') || '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Interactive Synergy Panels ── */}
                {draftHero && (
                  <div className="card" style={{ padding: 20, marginBottom: 32, border: '1px solid var(--accent)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                      <HeroImg heroid={draftHero.heroid} size={40} />
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800 }}>{draftHero.hero_name} Details</span>
                      <button onClick={() => setDraftHero(null)}
                        style={{ ...mo, fontSize: 10, color: 'rgba(255,255,255,.5)', border: '1px solid var(--border)', padding: '2px 8px', cursor: 'pointer', background: 'transparent', marginLeft: 'auto' }}>
                        ✕ Close
                      </button>
                    </div>

                    {draftFL ? <div className="loading" /> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
                        {draftPat.length > 0 && (
                          <div>
                            <div style={{ ...mo, fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '.1em', marginBottom: 12 }}>PATCH DISTRIBUTION</div>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {draftPat.map(p => (
                                <div key={p.patch} className="card" style={{ padding: '10px 14px', minWidth: 110, flex: '1 1 110px' }}>
                                  <div style={{ ...mo, fontSize: 10, color: 'rgba(255,255,255,.5)', marginBottom: 6 }}>Patch {p.patch}</div>
                                  <div style={{ display: 'flex', gap: 12 }}>
                                    <div>
                                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'var(--blue)' }}>{p.picks}</div>
                                      <div style={{ ...mo, fontSize: 8, color: 'rgba(255,255,255,.4)' }}>PICKS</div>
                                    </div>
                                    <div>
                                      <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: 'rgba(255,200,0,.8)' }}>{p.bans}</div>
                                      <div style={{ ...mo, fontSize: 8, color: 'rgba(255,255,255,.4)' }}>BANS</div>
                                    </div>
                                    {p.win_rate !== null && (
                                      <div>
                                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: p.win_rate >= 50 ? 'var(--win)' : 'var(--loss)' }}>{p.win_rate}%</div>
                                        <div style={{ ...mo, fontSize: 8, color: 'rgba(255,255,255,.4)' }}>WIN%</div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
                          <div>
                            <div style={{ ...mo, fontSize: 10, color: 'var(--win)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 8 }}>
                              PLAYED WITH ({draftSyn?.played_with?.length || 0} heroes)
                            </div>
                            <SynergyTable rows={draftSyn?.played_with} caption="Synergy: Win rates when drafted together" />
                          </div>
                          <div>
                            <div style={{ ...mo, fontSize: 10, color: 'var(--loss)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 8 }}>
                              PLAYED AGAINST ({draftSyn?.played_against?.length || 0} heroes)
                            </div>
                            <SynergyTable rows={draftSyn?.played_against} caption="Matchup: Win rates when drafted against" />
                          </div>
                          <div>
                            <div style={{ ...mo, fontSize: 10, color: 'var(--accent)', fontWeight: 700, letterSpacing: '.08em', marginBottom: 4 }}>
                              ROLE VS ROLE {draftMu?.role ? '(' + draftMu.role + ')' : ''}
                            </div>
                            {draftMu && <p style={{ ...mo, fontSize: 9, color: 'rgba(255,255,255,.4)', marginBottom: 8 }}>// Win% = {draftHero.hero_name} team wins</p>}
                            <SynergyTable rows={draftMu?.matchups} caption="Role-specific matchup statistics" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── 7. PICK SLOT ROLE DISTRIBUTION ── */}
          {pickSlots && (() => {
            const slots = pickSlots[side === 'red' ? 'red' : side === 'blue' ? 'blue' : 'overall'] || {};
            const slotLabel = (i) => {
              if (side === 'blue') return ['P1 B', 'P2 B', 'P3 B', 'P4 B', 'P5 B'][i];
              if (side === 'red') return ['P1 R', 'P2 R', 'P3 R', 'P4 R', 'P5 R'][i];
              return `Pick ${i + 1}`;
            };
            const mo = { fontFamily: 'var(--font-mono)' };

            return (
              <div style={{ marginBottom: 32 }}>
                <div className="section-title">Pick Slot Role Distribution</div>
                <p style={{ ...mo, fontSize: 10, color: 'rgba(255,255,255,.4)', marginBottom: 14, letterSpacing: '.06em' }}>
                  // role assigned per pick slot — team's 1st through 5th pick each game
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
                  {[1, 2, 3, 4, 5].map((slot, i) => {
                    const data = slots[slot] || { total: 0 };
                    const total = data.total || 0;
                    const sorted = ROLE_ORDER
                      .map(r => ({ role: r, cnt: data[r] || 0 }))
                      .filter(r => r.cnt > 0)
                      .sort((a, b) => b.cnt - a.cnt);

                    return (
                      <div key={slot} className="card" style={{ padding: '12px 10px', borderTop: '3px solid var(--border2)' }}>
                        <div style={{ ...mo, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,.5)', letterSpacing: '.08em', marginBottom: 12, textAlign: 'center' }}>
                          {slotLabel(i)}
                          <span style={{ display: 'block', ...mo, fontSize: 9, color: 'rgba(255,255,255,.3)', marginTop: 2, fontWeight: 400 }}>
                            {total} games
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                          {sorted.map(({ role, cnt }) => {
                            const pctVal = total > 0 ? Math.round((cnt / total) * 100) : 0;
                            return (
                              <div key={role}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                  <span title={role} aria-label={role} style={{ display: 'inline-flex' }}>
                                    <RoleImg role={role} size={12} />
                                  </span>
                                  <span style={{ ...mo, fontSize: 9, color: 'rgba(255,255,255,.55)', fontWeight: 700 }}>{pctVal}%</span>
                                </div>
                                <div style={{ height: 5, background: 'rgba(255,255,255,.08)', borderRadius: 2 }}>
                                  <div style={{ height: '100%', width: pctVal + '%', background: 'var(--neutral2)', borderRadius: 2 }} />
                                </div>
                              </div>
                            );
                          })}
                          {sorted.length === 0 && (
                            <div style={{ ...mo, fontSize: 10, color: 'rgba(255,255,255,.3)', textAlign: 'center' }}>—</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ── 8. DRAFT HISTORY TIMELINE ── */}
          <div className="section-title">Draft History</div>
          {draftLoading ? <div className="loading" /> : draftHistory.length === 0 ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,.5)', marginBottom: 32 }}>// No draft history matching active filters</div>
          ) : (() => {
            const mo = { fontFamily: 'var(--font-mono)' };

            // Group games by week & match code
            const matchesList = [];
            draftHistory.forEach(g => {
              const key = g.match_code || g.battle_id;
              let match = matchesList.find(m => m.match_code === key);
              if (!match) {
                match = {
                  match_code: key,
                  week: g.week_number,
                  phase: g.phase,
                  opp: g.opp_code,
                  games: [],
                };
                matchesList.push(match);
              }
              match.games.push(g);
            });

            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24, marginBottom: 32 }}>
                {matchesList.map(match => (
                  <div key={match.match_code}>
                    {/* Match header */}
                    <div style={{ ...mo, fontSize: 10, color: 'rgba(255,255,255,.4)', letterSpacing: '.1em', fontWeight: 700, marginBottom: 10 }}>
                      W{match.week} · {match.phase?.toUpperCase()} · vs {match.opp}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {match.games.map(game => {
                        const teamSide = game.team_campid === 1 ? 'BLUE' : 'RED';
                        const sideClr = game.team_campid === 1 ? '#42a5f5' : '#ef5350';
                        const won = game.team_won;

                        const teamDraft = game.draft.filter(d => d.team_code === t.team_code);
                        const oppDraft = game.draft.filter(d => d.team_code !== t.team_code);

                        const teamBans = teamDraft.filter(d => d.action === 'ban').sort((a, b) => a.order_num - b.order_num);
                        const teamPicks = teamDraft.filter(d => d.action === 'pick').sort((a, b) => a.order_num - b.order_num);
                        const oppBans = oppDraft.filter(d => d.action === 'ban').sort((a, b) => a.order_num - b.order_num);
                        const oppPicks = oppDraft.filter(d => d.action === 'pick').sort((a, b) => a.order_num - b.order_num);

                        const timeline = [...game.draft].sort((a, b) => a.order_num - b.order_num);

                        return (
                          <div key={game.battle_id} className="card" style={{ borderLeft: `3px solid ${won ? 'var(--win)' : 'var(--loss)'}`, padding: '14px 16px' }}>
                            {/* Game header */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
                              <span style={{ ...mo, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.5)' }}>G{game.game_number}</span>
                              <span style={{ ...mo, fontSize: 12, fontWeight: 800, color: won ? 'var(--win)' : 'var(--loss)' }}>{won ? 'WIN' : 'LOSS'}</span>
                              <span style={{ ...mo, fontSize: 11, fontWeight: 700, color: sideClr }}>{teamSide} SIDE</span>
                              <span style={{ ...mo, fontSize: 11, color: 'rgba(255,255,255,.35)' }}>vs {game.opp_code}</span>
                            </div>

                            {/* Draft Grid */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                              {/* Bans */}
                              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 8, alignItems: 'start' }}>
                                <span style={{ ...mo, fontSize: 9, color: 'rgba(255,200,0,.7)', fontWeight: 700, letterSpacing: '.08em', paddingTop: 4 }}>BANS</span>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {teamBans.map((d, index) => (
                                    <div key={index} title={`#${d.order_num} ${d.hero_name}`} style={{ position: 'relative', opacity: 0.7, filter: 'grayscale(60%)' }}>
                                      <HeroImg heroid={d.heroid} size={30} />
                                      <span style={{ position: 'absolute', bottom: 0, right: 0, ...mo, fontSize: 7, fontWeight: 700, background: 'rgba(255,200,0,.85)', color: '#000', padding: '0 2px', lineHeight: '12px' }}>
                                        {d.order_num}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  {oppBans.map((d, index) => (
                                    <div key={index} title={`#${d.order_num} ${d.hero_name}`} style={{ position: 'relative', opacity: 0.5, filter: 'grayscale(80%)' }}>
                                      <HeroImg heroid={d.heroid} size={30} />
                                      <span style={{ position: 'absolute', bottom: 0, right: 0, ...mo, fontSize: 7, fontWeight: 700, background: 'rgba(255,200,0,.85)', color: '#000', padding: '0 2px', lineHeight: '12px' }}>
                                        {d.order_num}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Picks */}
                              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr', gap: 8, alignItems: 'start' }}>
                                <span style={{ ...mo, fontSize: 9, color: sideClr, fontWeight: 700, letterSpacing: '.08em', paddingTop: 4 }}>PICKS</span>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                  {teamPicks.map((d, index) => (
                                    <div key={index} title={`#${d.order_num} ${d.hero_name}`} style={{ position: 'relative' }}>
                                      <div style={{ borderRadius: 2, overflow: 'hidden', boxShadow: `0 0 0 2px ${sideClr}` }}>
                                        <HeroImg heroid={d.heroid} size={36} />
                                      </div>
                                      <span style={{ position: 'absolute', bottom: 0, right: 0, ...mo, fontSize: 7, fontWeight: 700, background: sideClr, color: '#000', padding: '0 2px', lineHeight: '12px' }}>
                                        {d.order_num}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                  {oppPicks.map((d, index) => (
                                    <div key={index} title={`#${d.order_num} ${d.hero_name}`} style={{ position: 'relative' }}>
                                      <div style={{ borderRadius: 2, overflow: 'hidden', boxShadow: `0 0 0 2px rgba(255,255,255,.3)` }}>
                                        <HeroImg heroid={d.heroid} size={36} />
                                      </div>
                                      <span style={{ position: 'absolute', bottom: 0, right: 0, ...mo, fontSize: 7, fontWeight: 700, background: 'rgba(255,255,255,.7)', color: '#000', padding: '0 2px', lineHeight: '12px' }}>
                                        {d.order_num}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Timeline strip */}
                              <div style={{ display: 'flex', gap: 2, marginTop: 4, flexWrap: 'wrap' }}>
                                {timeline.map(d => {
                                  const isTeam = d.team_code === t.team_code;
                                  const isBan = d.action === 'ban';
                                  const bg = isBan
                                    ? 'rgba(255,200,0,.12)'
                                    : isTeam ? `${sideClr}22` : 'rgba(255,255,255,.06)';
                                  const border = isBan
                                    ? 'rgba(255,200,0,.3)'
                                    : isTeam ? sideClr : 'rgba(255,255,255,.18)';
                                  return (
                                    <div key={d.order_num} title={`#${d.order_num} ${isBan ? 'BAN' : 'PICK'} · ${d.team_code} · ${d.hero_name}`}
                                      style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: 2,
                                        background: bg,
                                        border: `1px solid ${border}`,
                                        padding: '3px 4px',
                                        minWidth: 30
                                      }}>
                                      <span style={{ ...mo, fontSize: 7, color: 'rgba(255,255,255,.35)', lineHeight: 1 }}>{d.order_num}</span>
                                      <HeroImg heroid={d.heroid} size={20} />
                                      <span style={{ ...mo, fontSize: 7, color: isBan ? 'rgba(255,200,0,.7)' : isTeam ? sideClr : 'rgba(255,255,255,.45)', lineHeight: 1 }}>
                                        {isBan ? 'B' : 'P'}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}


        </>
      )}
    </div>
  );
}
