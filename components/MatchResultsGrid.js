'use client';

import { useMemo, useState, useEffect } from 'react';
import TeamLogo from './TeamLogo';
import { img } from '../lib/images';
import MatchCard from './MatchCard';
import WildCardDecider from './WildCardDecider';

// Grid view for the Matches page — ported from the PH MatchResultsGrid's regular-
// season layout: series laid out as compact rows grouped by Week → Day, an info
// button opening the full MatchCard in a popover, plus the Wild Card Decider bracket
// below (the intl analogue of PH's playoff bracket). Teams are keyed by team_key +
// era code (identity-rules); no PH home/away collector-code matching.

function TeamMark({ meta, era, size = 24 }) {
  return (
    <TeamLogo src={meta?.team_logo_dark} fallbackSrc={img.team(era)} alt=""
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
  );
}

export default function MatchResultsGrid({
  series = [], teamByKey = {}, metaByEra = {}, wildCardGames = [], showDecider = false,
}) {
  const [active, setActive] = useState(null); // match_code of open popover
  const [hovered, setHovered] = useState(null); // era code highlighted across grid

  // Close popover on Escape.
  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  // Group series by Week → Day (ascending), like the PH regular-season grid.
  const weeks = useMemo(() => {
    const groups = {};
    for (const item of series) {
      const wk = item.info.week_number || 0;
      const gk = `W${wk}`;
      if (!groups[gk]) groups[gk] = { key: gk, label: wk ? `WEEK ${wk}` : 'OTHER', weekNum: wk, days: {} };
      const dnum = item.info.day_number || 99;
      const dk = `D${dnum}`;
      if (!groups[gk].days[dk]) groups[gk].days[dk] = { label: dnum !== 99 ? `DAY ${dnum}` : 'OTHER DAYS', dayNum: dnum, matches: [] };
      groups[gk].days[dk].matches.push(item);
    }
    const sorted = Object.values(groups).sort((a, b) => a.weekNum - b.weekNum);
    for (const g of sorted) {
      for (const d of Object.values(g.days)) {
        d.matches.sort((a, b) => (a.info.match_number || 0) - (b.info.match_number || 0));
      }
    }
    return sorted;
  }, [series]);

  const renderMatchRow = (item) => {
    const info = item.info;
    const aKey = info.team_a_key, bKey = info.team_b_key;
    const aEra = info.team_a_era || '—', bEra = info.team_b_era || '—';
    let aWins = 0, bWins = 0;
    for (const g of item.games) {
      if (!g.winner_key) continue;
      if (g.winner_key === aKey) aWins++;
      else if (g.winner_key === bKey) bWins++;
    }
    const aWon = aWins > bWins, bWon = bWins > aWins;
    const code = info.match_code || info.battle_id;
    const isOpen = active === code;

    return (
      <div key={code} className={`match-row ${aWon ? 'home-win' : ''} ${bWon ? 'away-win' : ''}`}>
        {/* Team A (left) */}
        <div
          className={`match-row-team team-home ${aWon ? 'winner' : 'loser'} ${hovered === aEra ? 'hover-highlight' : ''}`}
          onMouseEnter={() => setHovered(aEra)}
          onMouseLeave={() => setHovered(null)}
        >
          <span className="team-code">{aEra}</span>
          <TeamMark meta={teamByKey[aKey]} era={aEra} />
        </div>

        {/* Center score + info */}
        <div className="match-row-center" style={{ position: 'relative' }}>
          <div className="match-row-score-box">
            <span className={`score-num ${aWon ? 'winner' : 'loser'}`}>{aWins}</span>
            <button
              className={`match-info-btn ${isOpen ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); setActive(isOpen ? null : code); }}
              aria-label="Toggle match breakdown"
            >i</button>
            <span className={`score-num ${bWon ? 'winner' : 'loser'}`}>{bWins}</span>
          </div>
          {info.match_count && (
            <span className="match-bo" style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)' }}>
              {info.match_count}
            </span>
          )}
        </div>

        {/* Team B (right) */}
        <div
          className={`match-row-team team-away ${bWon ? 'winner' : 'loser'} ${hovered === bEra ? 'hover-highlight' : ''}`}
          onMouseEnter={() => setHovered(bEra)}
          onMouseLeave={() => setHovered(null)}
        >
          <TeamMark meta={teamByKey[bKey]} era={bEra} />
          <span className="team-code">{bEra}</span>
        </div>

        {/* Inline popover */}
        {isOpen && (
          <div className="match-popover">
            <div className="match-popover-header">
              <span className="match-popover-title">// MATCH DETAILS</span>
              <button className="match-popover-close" onClick={() => setActive(null)} aria-label="Close">&times;</button>
            </div>
            <div className="match-popover-body">
              <MatchCard info={item.info} games={item.games} match_mvp={item.match_mvp} teamByKey={teamByKey} />
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="results-grid-container">
        {weeks.map((group) => {
          const days = Object.values(group.days).sort((a, b) => a.dayNum - b.dayNum);
          return (
            <details key={group.key} className="results-week collapsible" open>
              <summary className="results-week-summary">
                <div className="results-week-head">
                  <span className="disclosure">▶</span>
                  <span className="results-week-title">{group.label}</span>
                  <span className="results-week-toggle-label">// Expand/Collapse</span>
                </div>
              </summary>
              <div className="collapsible-body results-week-body">
                {days.map((day) => (
                  <div key={day.label} className="results-day-block">
                    <div className="results-day-header">{day.label}</div>
                    <div className="results-day-matches">
                      {day.matches.map(renderMatchRow)}
                    </div>
                  </div>
                ))}
              </div>
            </details>
          );
        })}
        {series.length === 0 && (
          <div className="empty"><div>No matches found for the selected filter.</div></div>
        )}
      </div>

      {showDecider && (
        <details className="results-week collapsible full-width" open style={{ border: '1px solid var(--border)', background: 'var(--surface)', borderRadius: 4 }}>
          <summary className="results-week-summary">
            <div className="results-week-head">
              <span className="disclosure">▶</span>
              <span className="results-week-title">Decider Bracket</span>
              <span className="results-week-toggle-label">// Expand/Collapse</span>
            </div>
          </summary>
          <div className="collapsible-body results-week-body" style={{ padding: 16 }}>
            <WildCardDecider games={wildCardGames} metaByEra={metaByEra} />
          </div>
        </details>
      )}
    </div>
  );
}
