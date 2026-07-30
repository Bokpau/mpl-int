// MSC 2026 Wild Card bracket — the seeding constants and series/decider logic,
// shared by the Dashboard (server) and the Matches page Grid view (client) so there
// is ONE source of truth for the hardcoded seeding. Confirmed on Liquipedia
// (liquipedia.net/mobilelegends/MSC/2026/Wildcard). Everything here keys off the
// team's MSC 2026 ERA code (team_era_name.era_code) — what each team was called AT
// this edition, not its franchise display_code. Only Team Falcons differs: era
// "FLCM" (shown), franchise "FLCN".

// The two round-robin groups. There's no `group` column in the schema, so this is
// hardcoded rather than invented as a data pipeline for a one-off grouping. A 10th
// team, "Verso Time" (Group B, DQ'd 0-4), isn't in the roster data yet, so omitted.
export const WILD_CARD_GROUPS = {
  A: ['FUT', 'A7', 'MGLZ', 'KOG', 'VSG'],
  B: ['HUNS', 'FLCM', 'SNR', 'NM'],
};

// Decider seeding: Semifinal Match 1 on top, Match 2 below, Match 3 is the Grand
// Final. Real scores are overlaid from the DB when those series exist (qualifier-
// stage Bo3s played after the Gauntlet). Pairings are the two group winners vs the
// two Gauntlet qualifiers.
export const DECIDER = {
  semifinals: [
    { label: 'Match 1', a: 'HUNS', b: 'A7' },
    { label: 'Match 2', a: 'FUT', b: 'FLCM' },
  ],
  final: { label: 'Match 3 · Grand Final' },
};

// How many Bo3 series make up the Cross-Group Gauntlet (2 rounds × 2). Bo3 series
// beyond this many are the Decider (semifinals + grand final).
export const GAUNTLET_SERIES = 4;

// Roll the per-game match rows (from /api/intl/matches or /matches/rich) up into
// series keyed by match_code. Uses era codes + team_key for winner attribution.
export function buildSeries(matches) {
  const byMatch = new Map();
  for (const m of matches) {
    if (!m.match_code) continue;
    let s = byMatch.get(m.match_code);
    if (!s) {
      s = {
        match_code: m.match_code, stage: m.stage, stage_type: m.stage_type, match_name: m.match_name,
        season: m.season || m.edition || null,
        week_number: m.week_number, day_number: m.day_number, match_number: m.match_number,
        match_count: m.match_count,
        team_a: m.team_a_era || m.team_a, team_b: m.team_b_era || m.team_b,
        team_a_key: m.team_a_key, team_b_key: m.team_b_key,
        team_a_flag: m.team_a_flag, team_b_flag: m.team_b_flag,
        a_wins: 0, b_wins: 0, games: 0, played_at: m.played_at,
      };
      byMatch.set(m.match_code, s);
    }
    s.games++;
    // team_a/team_b on a match row are the game's BLUE/RED side (the derive stamps
    // team_a = camp 1), so they flip between games of the same series while the
    // series' own team_a/team_b stay fixed from game 1. Anything row-relative
    // (this row's team_a/team_b, win_camp) must therefore be mapped through the
    // row's orientation, or a side-swapped game gets credited to the wrong team
    // (MSC 2026 Knockout M1 read PRO 1-2 YG instead of 0-3).
    const rowFlipped = (m.team_a_key && s.team_a_key)
      ? m.team_a_key === s.team_b_key
      : (m.team_a_era || m.team_a) === s.team_b;
    const wKey = m.winner_key;
    const wEra = m.winner_era || m.winner;
    const wCamp = m.win_camp;
    // Series-absolute signals first (winner_key, then era code) — they identify
    // the team itself, so orientation is irrelevant.
    let side = null;
    if (wKey && s.team_a_key && wKey === s.team_a_key) side = 'a';
    else if (wKey && s.team_b_key && wKey === s.team_b_key) side = 'b';
    else if (wEra && wEra === s.team_a) side = 'a';
    else if (wEra && wEra === s.team_b) side = 'b';
    else {
      // Row-relative fallbacks: resolve against THIS row, then flip if the row
      // is side-swapped relative to the series.
      let rowSide = null;
      if (wKey && m.team_a_key && wKey === m.team_a_key) rowSide = 'a';
      else if (wKey && m.team_b_key && wKey === m.team_b_key) rowSide = 'b';
      else if (wEra && wEra === (m.team_a_era || m.team_a)) rowSide = 'a';
      else if (wEra && wEra === (m.team_b_era || m.team_b)) rowSide = 'b';
      else if (wCamp === 1) rowSide = 'a';
      else if (wCamp === 2) rowSide = 'b';
      if (rowSide) side = rowFlipped ? (rowSide === 'a' ? 'b' : 'a') : rowSide;
    }
    if (side === 'a') s.a_wins++;
    else if (side === 'b') s.b_wins++;
    if (String(m.played_at || '') > String(s.played_at || '')) s.played_at = m.played_at;
  }
  const out = [...byMatch.values()];
  for (const s of out) {
    // Determine required wins: match_count majority (e.g. Bo5 -> 3, Bo7 -> 4), or
    // 3 for Knockout (Bo5 default), or 1 for a single-game Wild Card Bo1, else 2 for Bo3.
    const reqWins = s.match_count
      ? Math.ceil(s.match_count / 2)
      : (s.stage === 'Knockout' ? 3 : (s.games <= 1 ? 1 : 2));
    // A series isn't over just because one side is ahead — only call a winner once
    // a side has actually clinched, or the in-progress Bo5 leaks a false winner into
    // downstream bracket slots (SF/3rd/GF resolve off a game 1 lead).
    const decided = s.a_wins >= reqWins || s.b_wins >= reqWins;
    s.winner_code = decided ? (s.a_wins > s.b_wins ? s.team_a : s.team_b) : null;
    s.winner_key = s.winner_code === s.team_a ? s.team_a_key : s.winner_code === s.team_b ? s.team_b_key : null;
  }
  return out;
}

// Overlay real Decider results onto the seeded semifinals + grand final. `allSeries`
// is buildSeries() output for the Wild Card. Bo3 series in chronological order are
// the Gauntlet (first GAUNTLET_SERIES) then the Decider (the rest).
export function computeDecider(allSeries = []) {
  const bo3Series = allSeries
    .filter((s) => s.games > 1)
    .sort((a, b) =>
      String(a.played_at || '').localeCompare(String(b.played_at || '')) ||
      String(a.match_code).localeCompare(String(b.match_code))
    );
  const deciderSeries = bo3Series.slice(GAUNTLET_SERIES);
  const findDecider = (a, b) => deciderSeries.find(
    (s) => (s.team_a === a && s.team_b === b) || (s.team_a === b && s.team_b === a)
  );
  const deciderSemis = DECIDER.semifinals.map((m) => ({ ...m, series: findDecider(m.a, m.b) || null }));
  const semiWinners = deciderSemis.map((x) => x.series?.winner_code).filter(Boolean);
  const finalSeries = deciderSeries.find(
    (s) => !DECIDER.semifinals.some((m) => (s.team_a === m.a && s.team_b === m.b) || (s.team_a === m.b && s.team_b === m.a))
  ) || null;
  const finalA = finalSeries?.team_a || (semiWinners.length === 2 ? semiWinners[0] : null);
  const finalB = finalSeries?.team_b || (semiWinners.length === 2 ? semiWinners[1] : null);
  const mainStageQualifier = finalSeries?.winner_code || null;
  return { deciderSemis, finalSeries, finalA, finalB, mainStageQualifier };
}
