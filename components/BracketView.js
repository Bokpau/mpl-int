'use client';

import { useMemo } from 'react';
import { getMatchMeta } from '../lib/matchRoundMap';
import { SeriesBox, BracketCol } from './BracketBits';

// Canonical column ordering for upper and lower bracket rounds.
const UB_ROUNDS = ['UB Quarter-Final', 'UB Semi-Final', 'UB Final'];
const LB_ROUNDS = ['LB Round 1', 'LB Round 2', 'LB Round 3', 'LB Quarter-Final', 'LB Semi-Final', 'LB Final'];

// Double-elimination bracket view. Renders UB rounds on top, LB rounds + GF on bottom.
// Uses match codes → round labels from matchRoundMap; missing labels are silently skipped.
export default function BracketView({ series, season, teamByKey = {}, toggle, active }) {
  // era-code → team metadata (logo/flag) for SeriesBox.
  const metaByEra = useMemo(() => {
    const m = {};
    for (const s of series) {
      if (s.team_a && s.team_a_key && teamByKey[s.team_a_key]) m[s.team_a] = teamByKey[s.team_a_key];
      if (s.team_b && s.team_b_key && teamByKey[s.team_b_key]) m[s.team_b] = teamByKey[s.team_b_key];
    }
    return m;
  }, [series, teamByKey]);

  // Group series by round label; sort each group by match_code for stable order.
  const byRound = useMemo(() => {
    const map = {};
    for (const s of series) {
      const round = getMatchMeta(season, s.match_code)?.round;
      if (!round) continue;
      (map[round] = map[round] || []).push(s);
    }
    for (const r of Object.keys(map)) {
      map[r].sort((a, b) => String(a.match_code).localeCompare(String(b.match_code)));
    }
    return map;
  }, [series, season]);

  const ubRounds  = UB_ROUNDS.filter(r => byRound[r]?.length);
  const lbRounds  = LB_ROUNDS.filter(r => byRound[r]?.length);
  const gfSeries  = byRound['Grand Final'] || [];

  const boxFor = (s) => (
    <SeriesBox
      key={s.match_code}
      teamMeta={metaByEra}
      aCode={s.team_a}   bCode={s.team_b}
      aScore={s.a_wins}  bScore={s.b_wins}
      winner={s.winner_code}
      matchCode={s.match_code}
      open={active === s.match_code}
      onToggle={() => toggle(s.match_code)}
    />
  );

  const sectionLabel = (text) => (
    <div style={{
      fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--accent)',
      fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em',
      marginBottom: 10,
    }}>
      {text}
    </div>
  );

  return (
    <div style={{ overflowX: 'auto', padding: '4px 12px 16px' }}>
      <div style={{ minWidth: 'max-content', display: 'flex', flexDirection: 'column', gap: 28 }}>

        {/* Upper Bracket */}
        {ubRounds.length > 0 && (
          <div>
            {sectionLabel('Upper Bracket')}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {ubRounds.map(round => (
                <div key={round} style={{ width: 168 }}>
                  <BracketCol title={round} series={byRound[round]} renderBox={boxFor} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lower Bracket + Grand Final */}
        {(lbRounds.length > 0 || gfSeries.length > 0) && (
          <div>
            {sectionLabel('Lower Bracket')}
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              {lbRounds.map(round => (
                <div key={round} style={{ width: 168 }}>
                  <BracketCol title={round} series={byRound[round]} renderBox={boxFor} />
                </div>
              ))}
              {gfSeries.length > 0 && (
                <div key="gf" style={{ width: 168, marginLeft: 12, borderLeft: '1px solid var(--border)', paddingLeft: 20 }}>
                  <BracketCol title="Grand Final" series={gfSeries} renderBox={boxFor} />
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
