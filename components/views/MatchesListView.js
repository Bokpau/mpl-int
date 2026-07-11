'use client';

import { useState, useEffect, useMemo } from 'react';
import MatchCard from '../MatchCard';
import MatchResultsGrid from '../MatchResultsGrid';
import PageHead from '../PageHead';
import { getFormat } from '../../lib/tournamentFormats';
import { getMatchMeta } from '../../lib/matchRoundMap';

// Client Matches view — the intl port of the PH /matches list. Fetches the current
// edition's rich games once (all stages), then filters by stage (Wild Card / Main)
// and week client-side. `q` is the edition query string resolved server-side
// (e.g. "?scope=MSC&season=MSC%202026"); `label` is its heading eyebrow.
//
// Grid view is Phase 3 — this ships the List view + stats + filters.

function MatchSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="match-card">
          <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12 }}>
            <div className="skeleton" style={{ height: 14, width: 120, borderRadius: 2 }} />
            <div className="skeleton" style={{ height: 14, width: 80, borderRadius: 2 }} />
          </div>
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%' }} />
              <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div className="skeleton" style={{ width: 28, height: 36, borderRadius: 2 }} />
              <div className="skeleton" style={{ width: 20, height: 20, borderRadius: 2 }} />
              <div className="skeleton" style={{ width: 28, height: 36, borderRadius: 2 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="skeleton" style={{ width: 80, height: 22, borderRadius: 2 }} />
              <div className="skeleton" style={{ width: 42, height: 42, borderRadius: '50%' }} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const STAGES = [
  { k: 'all', l: 'All' },
  { k: 'qualifier', l: 'Wild Card' },
  { k: 'main', l: 'Main' },
];

export default function MatchesListView({ q = '', label = '' }) {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [eraTeams, setEraTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState('all');
  const [week, setWeek] = useState(null);
  const [histPhase, setHistPhase] = useState(null); // DB stage name filter for history editions
  const [view, setView] = useState('list');

  useEffect(() => {
    const saved = localStorage.getItem('intl-matches-view');
    if (saved === 'grid' || saved === 'list') setView(saved);
  }, []);
  const handleSetView = (v) => { setView(v); localStorage.setItem('intl-matches-view', v); };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    const sep = q ? '&' : '?';
    Promise.all([
      fetch(`/api/intl/matches/rich${q}`).then(r => r.json()).catch(() => []),
      fetch(`/api/intl/teams${q}`).then(r => r.json()).catch(() => []),
      fetch(`/api/intl/schedule${q}`).then(r => r.json()).catch(() => []),
      fetch(`/api/intl/era-teams${q}`).then(r => r.json()).catch(() => []),
    ]).then(([g, t, s, e]) => {
      if (!alive) return;
      setGames(Array.isArray(g) ? g : []);
      setTeams(Array.isArray(t) ? t : []);
      setSchedule(Array.isArray(s) ? s : []);
      setEraTeams(Array.isArray(e) ? e : []);
      setLoading(false);
    });
    return () => { alive = false; };
  }, [q]);

  const teamByKey = useMemo(() => {
    const m = {};
    for (const t of teams) if (t.team_key) m[t.team_key] = t;
    return m;
  }, [teams]);

  // Era-code -> { logo, flag } lookup for the brackets (keyed by era code). Seeded
  // from team_era_name (covers teams with no games yet — needed for the Main Group
  // Stage bracket seeds), then overlaid with per-game data for played teams.
  const metaByEra = useMemo(() => {
    const m = {};
    for (const t of eraTeams) {
      if (t.era_code) m[t.era_code] = { team_logo_dark: t.team_logo_dark, country_flag: t.country_flag };
    }
    for (const g of games) {
      for (const [era, key, flag] of [
        [g.team_a_era, g.team_a_key, g.team_a_flag],
        [g.team_b_era, g.team_b_key, g.team_b_flag],
      ]) {
        if (era && !m[era]?.team_logo_dark) m[era] = { team_logo_dark: teamByKey[key]?.team_logo_dark, country_flag: flag };
      }
    }
    return m;
  }, [games, teamByKey, eraTeams]);

  // All Wild Card games (unfiltered by week) — the Decider spans the whole stage.
  const wildCardGames = useMemo(() => games.filter(g => g.stage_type === 'qualifier'), [games]);
  // All Main-stage games (unfiltered by week) — the group bracket spans the whole
  // stage, so it needs every Main game regardless of the week chip.
  const mainGames = useMemo(() => games.filter(g => g.stage_type !== 'qualifier'), [games]);

  // Weeks present in the (stage-filtered) data, for the week chips.
  const weeks = useMemo(() => {
    const set = new Set();
    for (const g of games) {
      if (stage !== 'all' && g.stage_type !== stage) continue;
      if (g.week_number) set.add(g.week_number);
    }
    return [...set].sort((a, b) => a - b);
  }, [games, stage]);

  // Roll games up into series (by match_code), applying stage + week filters.
  const series = useMemo(() => {
    const grouped = {};
    for (const g of games) {
      if (stage !== 'all' && g.stage_type !== stage) continue;
      if (week !== null && g.week_number !== week) continue;
      const key = g.match_code || g.battle_id;
      if (!grouped[key]) grouped[key] = { info: g, games: [], match_mvp: null };
      grouped[key].games.push(g);
      if (g.match_mvp?.roleid) grouped[key].match_mvp = g.match_mvp;
    }
    return Object.values(grouped).sort((a, b) => {
      const wa = a.info.week_number || 0, wb = b.info.week_number || 0;
      const da = a.info.day_number || 0, db = b.info.day_number || 0;
      const ma = a.info.match_number || 0, mb = b.info.match_number || 0;
      return wb - wa || db - da || mb - ma;
    });
  }, [games, stage, week]);

  const stats = useMemo(() => {
    const matchesPlayed = series.length;
    const gamesPlayed = series.reduce((n, s) => n + s.games.length, 0);
    const relevant = stage === 'all' ? schedule : schedule.filter(s => {
      const p = String(s.phase || '').toLowerCase();
      return stage === 'qualifier' ? p.includes('wild') : !p.includes('wild');
    });
    const totalMatches = new Set(relevant.map(s => s.match_code).filter(Boolean)).size || relevant.length;
    return { matchesPlayed, gamesPlayed, remainingMatches: Math.max(0, totalMatches - matchesPlayed) };
  }, [series, schedule, stage]);

  const season = useMemo(() => games[0]?.season ?? null, [games]);
  const hasWildCard = wildCardGames.length > 0;

  // History mode: no week data in DB. Use per-stage phase chips instead of WC/Main/Week.
  const isHistoryMode = !loading && games.length > 0 && weeks.length === 0;

  // Ordered list of DB stages for history phase chips, chronological.
  const histPhases = useMemo(() => {
    if (!isHistoryMode) return [];
    const format = getFormat(season);
    const seen = new Set();
    const ordered = [];
    const sorted = [...games].sort((a, b) => String(a.played_at || '').localeCompare(String(b.played_at || '')));
    for (const g of sorted) {
      if (!seen.has(g.stage)) {
        seen.add(g.stage);
        const desc = format?.stages.find(s => s.db_stage === g.stage);
        ordered.push({ key: g.stage, label: desc?.label || g.stage });
      }
    }
    return ordered;
  }, [isHistoryMode, games, season]);

  // Reset stage to 'all' when switching to an edition that has no qualifier games.
  useEffect(() => {
    if (!loading && !hasWildCard && stage === 'qualifier') setStage('all');
  }, [loading, hasWildCard, stage]);

  const setStageReset = (k) => { setStage(k); setWeek(null); };

  // History-mode: group series by stage → day for the list view render.
  const histGroups = useMemo(() => {
    if (!isHistoryMode) return null;
    const src = histPhase ? series.filter(s => s.info.stage === histPhase) : series;

    // Parse local date (YYYYMMDD) and match index (M#) from match code.
    // e.g. 'M720260103M4' → { localDate: '20260103', idx: 4 }
    // This is the authoritative source for both day order and within-day order.
    function mcParse(mc) {
      const m = String(mc || '').match(/(\d{8})M(\d+)$/);
      return m ? { localDate: m[1], idx: parseInt(m[2]) } : { localDate: null, idx: 0 };
    }

    const augmented = src.map(s => ({ s, ...mcParse(s.info.match_code) }));
    augmented.sort((a, b) =>
      (a.localDate || '').localeCompare(b.localDate || '') || a.idx - b.idx
    );

    const format = getFormat(season);
    const stageOrder = [];
    const byStage = {};
    for (const { s } of augmented) {
      const key = s.info.stage || 'Unknown';
      if (!byStage[key]) { byStage[key] = []; stageOrder.push(key); }
      byStage[key].push(s);
    }

    return stageOrder.map(dbStage => {
      const stageSeries = byStage[dbStage];
      // Include merged stages so e.g. M5 "Finals" shows as "Grand Final".
      const desc = format?.stages.find(sd => sd.db_stage === dbStage);
      const stageLabel = desc?.label || dbStage;

      // Assign day numbers: sort unique local dates chronologically → Day 1, 2, 3…
      const mcParsed = stageSeries.map(s => ({ s, ...mcParse(s.info.match_code) }));
      const uniqueDates = [...new Set(mcParsed.map(x => x.localDate).filter(Boolean))].sort();
      const dateDayMap = {};
      uniqueDates.forEach((d, i) => { dateDayMap[d] = i + 1; });

      const byDay = {};
      for (const { s, localDate, idx } of mcParsed) {
        const d = dateDayMap[localDate] || 1;
        (byDay[d] = byDay[d] || []).push({ s, idx });
      }
      const days = Object.entries(byDay)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([dayNum, items]) => ({
          dayNum: Number(dayNum),
          series: items.sort((a, b) => a.idx - b.idx).map(x => x.s),
        }));

      return { dbStage, stageLabel, days };
    });
  }, [isHistoryMode, series, histPhase, season]);

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Matches">
        Every game of the current edition — scores, hero picks, and MVPs. Use the
        Stage filter for Wild Card or Main.
      </PageHead>

      {/* ── Stats bar ─────────────────────────────────────────────── */}
      <div className="matches-stats-bar" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { v: stats.matchesPlayed, l: 'Matches Played', c: 'var(--accent)', b: true },
          { v: stats.gamesPlayed, l: 'Games Played', c: 'var(--text)', b: true },
          { v: stats.remainingMatches, l: 'Remaining Matches', c: 'var(--blue)', b: false },
        ].map((s, i) => (
          <div key={s.l} style={{ textAlign: 'center', borderRight: i < 2 ? '1px solid var(--border)' : 'none' }}>
            <div style={{ fontSize: 24, fontFamily: 'var(--font-display)', fontWeight: 800, color: s.c, lineHeight: 1.1 }}>
              {loading ? '—' : s.v}
            </div>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted2)', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 6 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 16, padding: '16px 0 20px',
        borderBottom: '1px solid var(--border)', marginBottom: 24, alignItems: 'center',
      }}>
        {isHistoryMode ? (
          /* History: phase chips per DB stage, chronological */
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <button onClick={() => setHistPhase(null)} className={`filter-btn ${histPhase === null ? 'active' : ''}`}>All</button>
            {histPhases.map(p => (
              <button key={p.key} onClick={() => setHistPhase(p.key)} className={`filter-btn ${histPhase === p.key ? 'active' : ''}`}>
                {p.label}
              </button>
            ))}
          </div>
        ) : (
          /* Current edition: Wild Card / Main stage chips + Week chips */
          <>
            <div style={{ display: 'flex', gap: 4 }}>
              {STAGES.filter(t => t.k !== 'qualifier' || hasWildCard).map(t => (
                <button key={t.k} onClick={() => setStageReset(t.k)} className={`filter-btn ${stage === t.k ? 'active' : ''}`}>
                  {t.l}
                </button>
              ))}
            </div>
            {weeks.length > 0 && (
              <>
                <div style={{ width: 1, height: 20, background: 'var(--border2)' }} />
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  <button onClick={() => setWeek(null)} className={`filter-btn ${week === null ? 'active' : ''}`}>All</button>
                  {weeks.map(w => (
                    <button key={w} onClick={() => setWeek(w)} className={`filter-btn ${week === w ? 'active' : ''}`}>W{w}</button>
                  ))}
                </div>
              </>
            )}
          </>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
          <div className="view-toggle">
            <button className={`view-toggle-btn ${view === 'grid' ? 'active' : ''}`} onClick={() => handleSetView('grid')}>Grid</button>
            <button className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => handleSetView('list')}>List</button>
          </div>
        </div>
      </div>

      {/* ── Series list / grid ────────────────────────────────────── */}
      {loading ? <MatchSkeleton /> : view === 'grid' ? (
        <MatchResultsGrid
          series={series}
          teamByKey={teamByKey}
          metaByEra={metaByEra}
          wildCardGames={wildCardGames}
          mainGames={mainGames}
          stage={stage}
          season={season}
        />
      ) : isHistoryMode ? (
        /* History list: Phase → Day headers → MatchCards with round tags */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
          {histGroups && histGroups.map(({ dbStage, stageLabel, days }) => (
            <details key={dbStage} className="results-week collapsible full-width" open>
              <summary className="results-week-summary">
                <div className="results-week-head">
                  <span className="disclosure">▶</span>
                  <span className="results-week-title">{stageLabel}</span>
                  <span className="results-week-toggle-label">// Expand/Collapse</span>
                </div>
              </summary>
              <div className="collapsible-body results-week-body">
                {days.map(({ dayNum, series: daySeries }) => (
                  <div key={dayNum}>
                    <div className="results-day-header" style={{ margin: '12px 0 8px' }}>
                      DAY {dayNum}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {daySeries.map(({ info, games: gs, match_mvp }) => {
                        const roundTag = getMatchMeta(season, info.match_code)?.round ?? null;
                        return (
                          <MatchCard
                            key={info.match_code || info.battle_id}
                            info={info}
                            games={gs}
                            match_mvp={match_mvp}
                            teamByKey={teamByKey}
                            roundTag={roundTag}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          ))}
          {(!histGroups || histGroups.length === 0) && (
            <div className="empty"><div>No matches found for the selected filter.</div></div>
          )}
        </div>
      ) : (
        /* Current edition list: flat cards */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {series.map(({ info, games: gs, match_mvp }) => (
            <MatchCard
              key={info.match_code || info.battle_id}
              info={info}
              games={gs}
              match_mvp={match_mvp}
              teamByKey={teamByKey}
            />
          ))}
          {series.length === 0 && (
            <div className="empty"><div>No matches found for the selected filter.</div></div>
          )}
        </div>
      )}
    </div>
  );
}
