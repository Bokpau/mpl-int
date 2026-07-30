// MSC 2026 Knockout Stage bracket resolution & seeding logic.
// 8-team single elimination + 3rd Place match (SE3P shape).
// Top 4 of Group A and Top 4 of Group B advance.

// The quarterfinal draw is fixed by the schedule, NOT by a seed formula over the
// group standings (MSC 2026 QF3 pairs two Group A teams), so the pairings are
// listed as they are drawn. Deriving them from qualifier order produced phantom
// matchups that no series could match.
export const KNOCKOUT_NODES = [
  { id: 'QF1', label: 'Quarterfinal 1', round: 'Quarterfinals', defaultA: 'VMS', defaultB: 'TS' },
  { id: 'QF2', label: 'Quarterfinal 2', round: 'Quarterfinals', defaultA: 'AUR', defaultB: 'ONIC' },
  { id: 'QF3', label: 'Quarterfinal 3', round: 'Quarterfinals', defaultA: 'VIT', defaultB: 'FLCN' },
  { id: 'QF4', label: 'Quarterfinal 4', round: 'Quarterfinals', defaultA: 'YG', defaultB: 'PRO' },

  { id: 'SF1', label: 'Semifinal 1', round: 'Semifinals', a: { win: 'QF1' }, b: { win: 'QF2' }, defaultA: 'W QF1', defaultB: 'W QF2' },
  { id: 'SF2', label: 'Semifinal 2', round: 'Semifinals', a: { win: 'QF3' }, b: { win: 'QF4' }, defaultA: 'W QF3', defaultB: 'W QF4' },

  { id: '3RD', label: '3rd Place Match', round: 'Third Place', a: { lose: 'SF1' }, b: { lose: 'SF2' }, defaultA: 'L SF1', defaultB: 'L SF2' },
  { id: 'GF',  label: 'Grand Final',    round: 'Grand Final', a: { win: 'SF1' },  b: { win: 'SF2' },  defaultA: 'W SF1', defaultB: 'W SF2' },
];

// `mcById` maps node id → the scheduled match_code for that slot (from
// knockoutBracketLayout). A code is an exact, order-independent handle on the
// series, so it beats matching on the team pairing: the pairing used to be
// derived from group-standings seeds, which produced matchups no series could
// match, so no quarterfinal ever resolved and the SF/3rd/GF slots stayed frozen
// on their "W QF3" placeholders.
export function resolveKnockoutBracket(mainSeries = [], mcById = {}) {
  // Stage-tagged rows when the feed provides them, so the pairing fallback can
  // never match a Group Stage series between the same two teams.
  const tagged = mainSeries.filter((s) => s.stage === 'Knockout');
  const knockoutSeries = tagged.length
    ? tagged
    : mainSeries.filter((s) => (s.match_code && s.match_code.startsWith('MSC202607')) || s.match_count >= 5);
  const byMc = {};
  for (const s of mainSeries) if (s.match_code) byMc[s.match_code] = s;
  const used = new Set();
  const findSeries = (a, b) => {
    if (!a || !b) return null;
    return knockoutSeries.find((s) =>
      !used.has(s.match_code) &&
      (s.stage === 'Knockout' || s.match_count >= 5) &&
      ((s.team_a === a && s.team_b === b) || (s.team_a === b && s.team_b === a))
    ) || knockoutSeries.find((s) =>
      !used.has(s.match_code) &&
      ((s.team_a === a && s.team_b === b) || (s.team_a === b && s.team_b === a))
    ) || null;
  };

  const nodes = {};
  const resolveRef = (ref) => {
    if (!ref) return null;
    const n = nodes[ref.win || ref.lose];
    if (!n) return null;
    return ref.win ? n.winner : n.loser;
  };

  for (const spec of KNOCKOUT_NODES) {
    // Entry-round nodes (no feeder) carry their drawn teams in defaultA/defaultB;
    // downstream nodes get theirs from the feeder result, and their defaults are
    // placeholder text ("W QF1"), never a team code.
    const isEntry = !spec.a && !spec.b;
    const rawA = isEntry ? spec.defaultA : resolveRef(spec.a);
    const rawB = isEntry ? spec.defaultB : resolveRef(spec.b);
    const a = rawA || null;
    const b = rawB || null;

    // Scheduled code first, pairing lookup only as a fallback (slots with no
    // code yet, or a code the results feed has not filled in).
    const series = byMc[mcById[spec.id]] || findSeries(a, b);
    if (series) used.add(series.match_code);

    // A played series is the source of truth for who is in the slot — it
    // overrides seeds and feeder refs, which are only predictions.
    let finalA = a, finalB = b;
    if (series) {
      const matchesSlot = (a === series.team_a && b === series.team_b) || (a === series.team_b && b === series.team_a);
      if (!matchesSlot) { finalA = series.team_a; finalB = series.team_b; }
    }

    let winner = null, loser = null, aScore = null, bScore = null;
    if (series) {
      winner = series.winner_code;
      if (winner) loser = winner === series.team_a ? series.team_b : winner === series.team_b ? series.team_a : null;
      const aIsSeriesA = series.team_a === finalA;
      aScore = aIsSeriesA ? series.a_wins : series.b_wins;
      bScore = aIsSeriesA ? series.b_wins : series.a_wins;
    }

    nodes[spec.id] = {
      id: spec.id,
      label: spec.label,
      round: spec.round,
      a: finalA, b: finalB,
      aLabel: finalA || spec.defaultA,
      bLabel: finalB || spec.defaultB,
      series, aScore, bScore, winner, loser,
    };
  }

  return KNOCKOUT_NODES.map((t) => nodes[t.id]);
}
