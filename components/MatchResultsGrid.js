'use client';

import { useState, useEffect, useMemo } from 'react';
import TeamLogo from './TeamLogo';
import { img } from '../lib/images';
import MatchCard from './MatchCard';
import { SeriesBox, QualifiedCol, SubHead, BracketCol } from './BracketBits';
import { buildSeries, computeDecider, DECIDER, GAUNTLET_SERIES } from '../lib/msc2026Bracket';

// Grid view for the Matches page. For the Wild Card it mirrors the Dashboard's
// bracket format, split into three collapsible sections classified the way BOK
// specified — Group Stage (Day 1–2, shown as match rows), Cross-Group Gauntlet
// (Day 3, series-box bracket) and Decider (Day 4, semis → grand final → Main Stage).
// An `i` on every match row / series box opens that series' full MatchCard. For the
// Main stage (no games yet) it falls back to a Week→Day match-row grid.

function TeamMark({ meta, era, size = 24 }) {
  return (
    <TeamLogo src={meta?.team_logo_dark} fallbackSrc={img.team(era)} alt=""
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
  );
}

function Section({ title, children }) {
  return (
    <details className="results-week collapsible full-width" open>
      <summary className="results-week-summary">
        <div className="results-week-head">
          <span className="disclosure">▶</span>
          <span className="results-week-title">{title}</span>
          <span className="results-week-toggle-label">// Expand/Collapse</span>
        </div>
      </summary>
      <div className="collapsible-body results-week-body">{children}</div>
    </details>
  );
}

export default function MatchResultsGrid({
  series = [], teamByKey = {}, metaByEra = {}, wildCardGames = [], stage = 'all',
}) {
  const [active, setActive] = useState(null); // open match_code
  const isWildCard = stage !== 'main';

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const toggle = (mc) => setActive((a) => (a === mc ? null : mc));

  // match_code -> { info, games, match_mvp } for the popover MatchCard.
  const byCode = useMemo(() => {
    const src = isWildCard ? wildCardGames : series.flatMap((s) => s.games);
    const m = {};
    for (const g of src) {
      const c = g.match_code || g.battle_id;
      if (!m[c]) m[c] = { info: g, games: [], match_mvp: null };
      m[c].games.push(g);
      if (g.match_mvp?.roleid) m[c].match_mvp = g.match_mvp;
    }
    return m;
  }, [wildCardGames, series, isWildCard]);

  const popoverFor = (mc, align) => {
    const s = byCode[mc];
    if (!s) return null;
    // Series boxes are narrow, so a centered 680px popover overflows the viewport —
    // left-align it to the box instead. Full-width match rows stay centered.
    const style = align === 'left' ? { left: 0, right: 'auto', transform: 'none' } : undefined;
    return (
      <div className="match-popover" style={style}>
        <div className="match-popover-header">
          <span className="match-popover-title">// MATCH DETAILS</span>
          <button className="match-popover-close" onClick={() => setActive(null)} aria-label="Close">&times;</button>
        </div>
        <div className="match-popover-body">
          <MatchCard info={s.info} games={s.games} match_mvp={s.match_mvp} teamByKey={teamByKey} />
        </div>
      </div>
    );
  };

  // A compact match row (used by Group Stage + the Main fallback grid). `s` is a
  // buildSeries() series.
  const renderMatchRow = (s) => {
    const aKey = s.team_a_key, bKey = s.team_b_key;
    const aEra = s.team_a || '—', bEra = s.team_b || '—';
    const aWon = s.a_wins > s.b_wins, bWon = s.b_wins > s.a_wins;
    const mc = s.match_code;
    const open = active === mc;
    return (
      <div key={mc} className="match-row">
        <div className="match-row-team team-home">
          <span className="team-code">{aEra}</span>
          <TeamMark meta={teamByKey[aKey]} era={aEra} />
        </div>
        <div className="match-row-center" style={{ position: 'relative' }}>
          <div className="match-row-score-box">
            <span className={`score-num ${aWon ? 'winner' : 'loser'}`}>{s.a_wins}</span>
            <button className={`match-info-btn ${open ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggle(mc); }} aria-label="Toggle match breakdown">i</button>
            <span className={`score-num ${bWon ? 'winner' : 'loser'}`}>{s.b_wins}</span>
          </div>
          {s.match_count && (
            <span className="match-bo" style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)' }}>{s.match_count}</span>
          )}
        </div>
        <div className="match-row-team team-away">
          <TeamMark meta={teamByKey[bKey]} era={bEra} />
          <span className="team-code">{bEra}</span>
        </div>
        {open && popoverFor(mc)}
      </div>
    );
  };

  // A gauntlet/decider series box wired to the popover.
  const boxFor = (s, { title, compact } = {}) => (
    <SeriesBox key={s.match_code} title={title} teamMeta={metaByEra} compact={compact}
      aCode={s.team_a} bCode={s.team_b} aScore={s.a_wins} bScore={s.b_wins} winner={s.winner_code}
      matchCode={s.match_code} open={active === s.match_code} onToggle={() => toggle(s.match_code)}>
      {popoverFor(s.match_code, 'left')}
    </SeriesBox>
  );

  // ── Wild Card structure ─────────────────────────────────────────────────
  const wc = useMemo(() => {
    const all = buildSeries(wildCardGames);
    const groupSeries = all.filter((s) => s.games <= 1);
    const bo3 = all.filter((s) => s.games > 1).sort((a, b) =>
      String(a.played_at || '').localeCompare(String(b.played_at || '')) ||
      String(a.match_code).localeCompare(String(b.match_code)));
    const gauntlet = bo3.slice(0, GAUNTLET_SERIES);
    const byDay = {};
    for (const s of groupSeries) {
      const d = s.day_number || 99;
      (byDay[d] = byDay[d] || []).push(s);
    }
    const groupDays = Object.entries(byDay)
      .map(([d, arr]) => ({ day: Number(d), matches: arr.sort((a, b) => (a.match_number || 0) - (b.match_number || 0)) }))
      .sort((a, b) => a.day - b.day);
    return { groupDays, gauntletR1: gauntlet.slice(0, 2), gauntletR2: gauntlet.slice(2, 4), ...computeDecider(all) };
  }, [wildCardGames]);

  // ── Main fallback: Week → Day match-row grid ────────────────────────────
  const mainWeeks = useMemo(() => {
    if (isWildCard) return [];
    const all = buildSeries(series.flatMap((s) => s.games));
    const groups = {};
    for (const s of all) {
      const wk = s.week_number || 0, gk = `W${wk}`;
      if (!groups[gk]) groups[gk] = { key: gk, label: wk ? `WEEK ${wk}` : 'OTHER', weekNum: wk, days: {} };
      const dnum = s.day_number || 99, dk = `D${dnum}`;
      if (!groups[gk].days[dk]) groups[gk].days[dk] = { label: dnum !== 99 ? `DAY ${dnum}` : 'OTHER DAYS', dayNum: dnum, matches: [] };
      groups[gk].days[dk].matches.push(s);
    }
    return Object.values(groups).sort((a, b) => a.weekNum - b.weekNum);
  }, [series, isWildCard]);

  if (!isWildCard) {
    return (
      <div className="results-grid-container">
        {mainWeeks.map((group) => (
          <details key={group.key} className="results-week collapsible" open>
            <summary className="results-week-summary">
              <div className="results-week-head">
                <span className="disclosure">▶</span>
                <span className="results-week-title">{group.label}</span>
                <span className="results-week-toggle-label">// Expand/Collapse</span>
              </div>
            </summary>
            <div className="collapsible-body results-week-body">
              {Object.values(group.days).sort((a, b) => a.dayNum - b.dayNum).map((day) => (
                <div key={day.label} className="results-day-block">
                  <div className="results-day-header">{day.label}</div>
                  <div className="results-day-matches">{day.matches.map(renderMatchRow)}</div>
                </div>
              ))}
            </div>
          </details>
        ))}
        {mainWeeks.length === 0 && <div className="empty"><div>No matches found for the selected filter.</div></div>}
      </div>
    );
  }

  const hasDecider = wc.deciderSemis.some((m) => m.series) || wc.finalSeries || wc.finalA || wc.finalB;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Group Stage — Day 1 / Day 2 match rows */}
      {wc.groupDays.length > 0 && (
        <Section title="Group Stage">
          {wc.groupDays.map((d) => (
            <div key={d.day} className="results-day-block">
              <div className="results-day-header">DAY {d.day}</div>
              <div className="results-day-matches">{d.matches.map(renderMatchRow)}</div>
            </div>
          ))}
        </Section>
      )}

      {/* Cross-Group Gauntlet — Day 3 bracket */}
      {(wc.gauntletR1.length > 0 || wc.gauntletR2.length > 0) && (
        <Section title="Cross-Group Gauntlet">
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'start' }}>
            <BracketCol title="Round 1" series={wc.gauntletR1} renderBox={(s) => boxFor(s)} />
            <BracketCol title="Round 2" series={wc.gauntletR2} renderBox={(s) => boxFor(s)} />
          </div>
        </Section>
      )}

      {/* Decider — semifinals → grand final → Main Stage qualifier */}
      {hasDecider && (
        <Section title="Decider">
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SubHead>Wild Card Decider</SubHead>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {wc.deciderSemis.map((m) => (
                  m.series
                    ? boxFor(m.series, { title: m.label, compact: true })
                    : <SeriesBox key={m.label} title={m.label} teamMeta={metaByEra} compact aCode={m.a} bCode={m.b} scaffold />
                ))}
              </div>
              {wc.finalSeries
                ? boxFor(wc.finalSeries, { title: DECIDER.final.label, compact: true })
                : <SeriesBox title={DECIDER.final.label} teamMeta={metaByEra} compact aCode={wc.finalA} bCode={wc.finalB} scaffold />}
              <QualifiedCol title="To Main Stage" codes={wc.mainStageQualifier ? [wc.mainStageQualifier] : []} teamMeta={metaByEra} />
            </div>
            {!wc.finalSeries ? (
              <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
                Fills in as each series is played; the Grand Final winner qualifies for the Main Stage.
              </div>
            ) : null}
          </div>
        </Section>
      )}

      {wc.groupDays.length === 0 && !hasDecider && wc.gauntletR1.length === 0 && (
        <div className="empty"><div>No matches found for the selected filter.</div></div>
      )}
    </div>
  );
}
