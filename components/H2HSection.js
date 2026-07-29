'use client';

import { useState, useMemo } from 'react';
import { num, pct, int } from '../lib/format';

export default function H2HSection({ standings = [], h2h = [], matchH2h = [] }) {
  const [metric, setMetric] = useState('games'); // 'games' | 'matches'
  const [scope, setScope] = useState('top8');   // 'top8' | 'all'
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState('totalGames'); // 'matchup', 'matchRecord', 'matchWinRate', 'gameRecord', 'gameWinRate', 'totalGames'
  const [sortDir, setSortDir] = useState('desc');
  const [selectedPair, setSelectedPair] = useState(null); // { c1, c2 }

  // Directed game wins lookup: "WINNER|LOSER" -> wins
  const gameWMap = useMemo(() => {
    const map = {};
    for (const r of h2h) {
      map[`${r.winner_country}|${r.loser_country}`] = num(r.wins);
    }
    return map;
  }, [h2h]);

  // Directed match wins lookup: "WINNER|LOSER" -> match wins
  const matchWMap = useMemo(() => {
    const map = {};
    for (const r of (matchH2h || [])) {
      map[`${r.winner_country}|${r.loser_country}`] = num(r.wins);
    }
    return map;
  }, [matchH2h]);

  // Active matrix lookup based on metric
  const activeWMap = metric === 'matches' ? matchWMap : gameWMap;

  // Standings sorted by total games played
  const sortedStandings = useMemo(() => {
    return [...standings].sort((a, b) => num(b.games) - num(a.games));
  }, [standings]);

  // Regions included in the matrix
  const matrixRegions = useMemo(() => {
    if (scope === 'top8') return sortedStandings.slice(0, 8);
    return sortedStandings;
  }, [sortedStandings, scope]);

  // Country dictionary by country_code for quick lookup
  const countryDict = useMemo(() => {
    const dict = {};
    for (const c of standings) {
      dict[c.country_code] = c;
    }
    return dict;
  }, [standings]);

  // Build all distinct pairwise matchups for the full list table
  const allPairwiseMatchups = useMemo(() => {
    const pairs = [];
    const codes = sortedStandings.map((c) => c.country_code);

    for (let i = 0; i < codes.length; i++) {
      for (let j = i + 1; j < codes.length; j++) {
        const c1Code = codes[i];
        const c2Code = codes[j];
        const c1Obj = countryDict[c1Code] || { country_code: c1Code, country: c1Code };
        const c2Obj = countryDict[c2Code] || { country_code: c2Code, country: c2Code };

        const c1GameWins = gameWMap[`${c1Code}|${c2Code}`] || 0;
        const c2GameWins = gameWMap[`${c2Code}|${c1Code}`] || 0;
        const totalGames = c1GameWins + c2GameWins;

        const c1MatchWins = matchWMap[`${c1Code}|${c2Code}`] || 0;
        const c2MatchWins = matchWMap[`${c2Code}|${c1Code}`] || 0;
        const totalMatches = c1MatchWins + c2MatchWins;

        if (totalGames > 0 || totalMatches > 0) {
          const gameWr1 = totalGames > 0 ? (c1GameWins / totalGames) * 100 : 0;
          const matchWr1 = totalMatches > 0 ? (c1MatchWins / totalMatches) * 100 : 0;

          pairs.push({
            c1: c1Obj,
            c2: c2Obj,
            c1GameWins,
            c2GameWins,
            totalGames,
            c1MatchWins,
            c2MatchWins,
            totalMatches,
            gameWr1,
            matchWr1,
          });
        }
      }
    }
    return pairs;
  }, [sortedStandings, countryDict, gameWMap, matchWMap]);

  // Filtered & sorted pairwise matchups
  const filteredPairs = useMemo(() => {
    let result = [...allPairwiseMatchups];

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (p) =>
          (p.c1.country && p.c1.country.toLowerCase().includes(q)) ||
          p.c1.country_code.toLowerCase().includes(q) ||
          (p.c2.country && p.c2.country.toLowerCase().includes(q)) ||
          p.c2.country_code.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let va = 0, vb = 0;
      if (sortCol === 'matchup') {
        const sa = `${a.c1.country_code} vs ${a.c2.country_code}`;
        const sb = `${b.c1.country_code} vs ${b.c2.country_code}`;
        return sortDir === 'asc' ? sa.localeCompare(sb) : sb.localeCompare(sa);
      } else if (sortCol === 'matchRecord') {
        va = a.totalMatches;
        vb = b.totalMatches;
      } else if (sortCol === 'matchWinRate') {
        va = Math.max(a.matchWr1, 100 - a.matchWr1);
        vb = Math.max(b.matchWr1, 100 - b.matchWr1);
      } else if (sortCol === 'gameRecord') {
        va = a.totalGames;
        vb = b.totalGames;
      } else if (sortCol === 'gameWinRate') {
        va = Math.max(a.gameWr1, 100 - a.gameWr1);
        vb = Math.max(b.gameWr1, 100 - b.gameWr1);
      } else if (sortCol === 'totalGames') {
        va = a.totalGames;
        vb = b.totalGames;
      }

      return sortDir === 'asc' ? va - vb : vb - va;
    });

    return result;
  }, [allPairwiseMatchups, search, sortCol, sortDir]);

  const handleSort = (col) => {
    if (sortCol === col) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortCol(col);
      setSortDir('desc');
    }
  };

  // Currently inspected pair stats
  const activePairDetails = useMemo(() => {
    if (!selectedPair) return null;
    const { c1, c2 } = selectedPair;
    const c1Obj = countryDict[c1] || { country_code: c1, country: c1 };
    const c2Obj = countryDict[c2] || { country_code: c2, country: c2 };

    const c1GameWins = gameWMap[`${c1}|${c2}`] || 0;
    const c2GameWins = gameWMap[`${c2}|${c1}`] || 0;
    const totalGames = c1GameWins + c2GameWins;

    const c1MatchWins = matchWMap[`${c1}|${c2}`] || 0;
    const c2MatchWins = matchWMap[`${c2}|${c1}`] || 0;
    const totalMatches = c1MatchWins + c2MatchWins;

    return {
      c1: c1Obj,
      c2: c2Obj,
      c1GameWins,
      c2GameWins,
      totalGames,
      c1MatchWins,
      c2MatchWins,
      totalMatches,
      gameWr1: totalGames > 0 ? (c1GameWins / totalGames) * 100 : 0,
      matchWr1: totalMatches > 0 ? (c1MatchWins / totalMatches) * 100 : 0,
    };
  }, [selectedPair, countryDict, gameWMap, matchWMap]);

  return (
    <div className="h2h-section">
      <div className="h2h-controls-bar">
        <div className="h2h-toggles">
          {/* Mode Toggle: Games vs Matches */}
          <div className="segmented-control" role="group" aria-label="Head to Head Metric">
            <button
              type="button"
              className={`segmented-btn ${metric === 'games' ? 'active' : ''}`}
              onClick={() => setMetric('games')}
            >
              GAME H2H
            </button>
            <button
              type="button"
              className={`segmented-btn ${metric === 'matches' ? 'active' : ''}`}
              onClick={() => setMetric('matches')}
            >
              MATCH H2H
            </button>
          </div>

          {/* Matrix Scope Toggle: Top 8 vs All */}
          <div className="segmented-control" role="group" aria-label="Matrix Scope">
            <button
              type="button"
              className={`segmented-btn ${scope === 'top8' ? 'active' : ''}`}
              onClick={() => setScope('top8')}
            >
              TOP 8
            </button>
            <button
              type="button"
              className={`segmented-btn ${scope === 'all' ? 'active' : ''}`}
              onClick={() => setScope('all')}
            >
              ALL REGIONS ({sortedStandings.length})
            </button>
          </div>
        </div>

        <p className="sub note-tight">
          {metric === 'games'
            ? `Game-level Head to Head (individual games won). Cell = row region's game wins over column region.`
            : `Match-level Head to Head (series won). Cell = row region's series wins over column region.`}
        </p>
      </div>

      {/* ── Matrix Table ── */}
      <div className="table-wrap tbl-sticky h2h-matrix-wrap">
        <table className="h2h">
          <thead>
            <tr>
              <th className="l corner">vs</th>
              {matrixRegions.map((c) => (
                <th key={c.country_code} title={c.country || c.country_code}>
                  <span className="flag-sm">{c.flag_emoji || ''}</span> {c.country_code}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrixRegions.map((row) => (
              <tr key={row.country_code}>
                <td className="l corner">
                  <span className="flag-sm">{row.flag_emoji || ''}</span> {row.country_code}
                </td>
                {matrixRegions.map((col) => {
                  if (row.country_code === col.country_code) {
                    return (
                      <td key={col.country_code} className="diag">
                        —
                      </td>
                    );
                  }
                  const a = activeWMap[`${row.country_code}|${col.country_code}`] || 0;
                  const b = activeWMap[`${col.country_code}|${row.country_code}`] || 0;
                  const total = a + b;
                  const isSelected =
                    selectedPair &&
                    ((selectedPair.c1 === row.country_code && selectedPair.c2 === col.country_code) ||
                      (selectedPair.c1 === col.country_code && selectedPair.c2 === row.country_code));

                  if (!total) {
                    return (
                      <td key={col.country_code} className="sub">
                        ·
                      </td>
                    );
                  }
                  const wr = (a / total) * 100;
                  return (
                    <td
                      key={col.country_code}
                      className={`${wr >= 50 ? 'pos' : 'neg'} ${isSelected ? 'cell-selected' : ''}`}
                      title={`${row.country_code} vs ${col.country_code}: ${a}–${b} (${metric})`}
                      style={{ cursor: 'pointer' }}
                      onClick={() =>
                        setSelectedPair({ c1: row.country_code, c2: col.country_code })
                      }
                    >
                      {a}
                      <span className="sub">–{b}</span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Matchup Detail Panel ── */}
      {activePairDetails && (
        <div className="h2h-detail-card">
          <div className="h2h-detail-header">
            <div className="h2h-detail-title">
              <span className="flag-md">{activePairDetails.c1.flag_emoji || ''}</span>
              <strong>{activePairDetails.c1.country || activePairDetails.c1.country_code}</strong>
              <span className="gold"> vs </span>
              <span className="flag-md">{activePairDetails.c2.flag_emoji || ''}</span>
              <strong>{activePairDetails.c2.country || activePairDetails.c2.country_code}</strong>
            </div>
            <button
              type="button"
              className="h2h-close-btn"
              onClick={() => setSelectedPair(null)}
              aria-label="Close detail"
            >
              ✕
            </button>
          </div>

          <div className="h2h-detail-grid">
            <div className="h2h-stat-box">
              <div className="h2h-stat-label">Match Series Record</div>
              <div className="h2h-stat-val gold">
                {activePairDetails.c1MatchWins} – {activePairDetails.c2MatchWins}
              </div>
              <div className="sub">
                {activePairDetails.totalMatches} matches · {pct(activePairDetails.matchWr1)} win rate for {activePairDetails.c1.country_code}
              </div>
            </div>

            <div className="h2h-stat-box">
              <div className="h2h-stat-label">Game Record</div>
              <div className="h2h-stat-val">
                {activePairDetails.c1GameWins} – {activePairDetails.c2GameWins}
              </div>
              <div className="sub">
                {activePairDetails.totalGames} games · {pct(activePairDetails.gameWr1)} win rate for {activePairDetails.c1.country_code}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Pairwise Full H2H List Table ── */}
      <div className="h2h-list-container">
        <div className="h2h-list-header">
          <div className="section-title">
            Full Head-to-Head List <span className="sub">({filteredPairs.length} matchups)</span>
          </div>

          <div className="h2h-search">
            <input
              type="text"
              placeholder="Filter by country (e.g. PH, ID)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h2h-search-input"
            />
            {search && (
              <button
                type="button"
                className="h2h-search-clear"
                onClick={() => setSearch('')}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="table-wrap tbl-sticky">
          <table className="h2h-list-table">
            <thead>
              <tr>
                <th className="l">
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => handleSort('matchup')}
                  >
                    Matchup{' '}
                    <span className="sort-ind">
                      {sortCol === 'matchup' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
                <th className="r">
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => handleSort('matchRecord')}
                  >
                    Matches{' '}
                    <span className="sort-ind">
                      {sortCol === 'matchRecord' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
                <th className="r">
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => handleSort('matchWinRate')}
                  >
                    Match Win%{' '}
                    <span className="sort-ind">
                      {sortCol === 'matchWinRate' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
                <th className="r">
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => handleSort('gameRecord')}
                  >
                    Games{' '}
                    <span className="sort-ind">
                      {sortCol === 'gameRecord' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
                <th className="r">
                  <button
                    type="button"
                    className="th-sort"
                    onClick={() => handleSort('gameWinRate')}
                  >
                    Game Win%{' '}
                    <span className="sort-ind">
                      {sortCol === 'gameWinRate' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                    </span>
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPairs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty" style={{ textAlign: 'center', padding: 24 }}>
                    No head-to-head matchups match your filter.
                  </td>
                </tr>
              ) : (
                filteredPairs.map((pair) => {
                  const isSelected =
                    selectedPair &&
                    ((selectedPair.c1 === pair.c1.country_code && selectedPair.c2 === pair.c2.country_code) ||
                      (selectedPair.c1 === pair.c2.country_code && selectedPair.c2 === pair.c1.country_code));

                  const leader =
                    pair.c1MatchWins > pair.c2MatchWins
                      ? pair.c1
                      : pair.c2MatchWins > pair.c1MatchWins
                      ? pair.c2
                      : null;

                  return (
                    <tr
                      key={`${pair.c1.country_code}-${pair.c2.country_code}`}
                      className={`h2h-row ${isSelected ? 'row-selected' : ''}`}
                      onClick={() =>
                        setSelectedPair({
                          c1: pair.c1.country_code,
                          c2: pair.c2.country_code,
                        })
                      }
                      style={{ cursor: 'pointer' }}
                    >
                      <td className="l corner">
                        <div className="h2h-matchup-cell">
                          <span className="flag-sm">{pair.c1.flag_emoji || ''}</span>
                          <span className="country-tag">{pair.c1.country_code}</span>
                          <span className="vs-tag">vs</span>
                          <span className="flag-sm">{pair.c2.flag_emoji || ''}</span>
                          <span className="country-tag">{pair.c2.country_code}</span>
                        </div>
                      </td>
                      <td className="r num">
                        {pair.c1MatchWins} – {pair.c2MatchWins}
                      </td>
                      <td className="r num">
                        {pair.totalMatches > 0 ? (
                          <span className={pair.c1MatchWins !== pair.c2MatchWins ? 'gold' : ''}>
                            {leader ? `${leader.country_code} (${pct(Math.max(pair.matchWr1, 100 - pair.matchWr1))})` : '50% Split'}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="r num">
                        {pair.c1GameWins} – {pair.c2GameWins}
                      </td>
                      <td className="r num">
                        {pair.totalGames > 0 ? pct(pair.gameWr1) : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
