'use client';

import { useState, useEffect, useMemo } from 'react';
import MatchCard from '../MatchCard';
import MatchResultsGrid from '../MatchResultsGrid';
import PageHead from '../PageHead';

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

  const setStageReset = (k) => { setStage(k); setWeek(null); };

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
        <div style={{ display: 'flex', gap: 4 }}>
          {STAGES.map(t => (
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
      ) : (
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
