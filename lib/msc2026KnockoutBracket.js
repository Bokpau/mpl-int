// MSC 2026 Knockout Stage bracket resolution & seeding logic.
// 8-team single elimination + 3rd Place match (SE3P shape).
// Top 4 of Group A and Top 4 of Group B advance.

export const KNOCKOUT_NODES = [
  { id: 'QF1', label: 'Quarterfinal 1', round: 'Quarterfinals', defaultA: 'VMS', defaultB: 'TS', seedA: { group: 'A', idx: 0 }, seedB: { group: 'B', idx: 3 } },
  { id: 'QF2', label: 'Quarterfinal 2', round: 'Quarterfinals', defaultA: 'AUR', defaultB: 'ONIC', seedA: { group: 'B', idx: 1 }, seedB: { group: 'A', idx: 2 } },
  { id: 'QF3', label: 'Quarterfinal 3', round: 'Quarterfinals', defaultA: 'VIT', defaultB: 'FLCN', seedA: { group: 'B', idx: 0 }, seedB: { group: 'A', idx: 3 } },
  { id: 'QF4', label: 'Quarterfinal 4', round: 'Quarterfinals', defaultA: 'YG', defaultB: 'PRO', seedA: { group: 'A', idx: 1 }, seedB: { group: 'B', idx: 2 } },

  { id: 'SF1', label: 'Semifinal 1', round: 'Semifinals', a: { win: 'QF1' }, b: { win: 'QF2' }, defaultA: 'W QF1', defaultB: 'W QF2' },
  { id: 'SF2', label: 'Semifinal 2', round: 'Semifinals', a: { win: 'QF3' }, b: { win: 'QF4' }, defaultA: 'W QF3', defaultB: 'W QF4' },

  { id: '3RD', label: '3rd Place Match', round: 'Third Place', a: { lose: 'SF1' }, b: { lose: 'SF2' }, defaultA: 'L SF1', defaultB: 'L SF2' },
  { id: 'GF',  label: 'Grand Final',    round: 'Grand Final', a: { win: 'SF1' },  b: { win: 'SF2' },  defaultA: 'W SF1', defaultB: 'W SF2' },
];

export function resolveKnockoutBracket(mainSeries = [], qualifiersA = [], qualifiersB = []) {
  // Filter Knockout series (matches with stage === 'Knockout' or match codes matching MSC20260715..MSC20260718)
  const knockoutSeries = mainSeries.filter(s =>
    s.stage === 'Knockout' ||
    (s.match_code && s.match_code.startsWith('MSC2026071'))
  );

  const used = new Set();
  const findSeries = (a, b) => {
    if (!a || !b) return null;
    return knockoutSeries.find((s) =>
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

  const getSeeded = (spec, side) => {
    const info = side === 'a' ? spec.seedA : spec.seedB;
    if (!info) return null;
    const list = info.group === 'A' ? qualifiersA : qualifiersB;
    return list[info.idx] || null;
  };

  for (const spec of KNOCKOUT_NODES) {
    const a = spec.seedA ? getSeeded(spec, 'a') : resolveRef(spec.a);
    const b = spec.seedB ? getSeeded(spec, 'b') : resolveRef(spec.b);
    const series = findSeries(a, b);
    if (series) used.add(series.match_code);

    let winner = null, loser = null, aScore = null, bScore = null;
    if (series) {
      winner = series.winner_code;
      if (winner) loser = winner === series.team_a ? series.team_b : winner === series.team_b ? series.team_a : null;
      const aIsSeriesA = series.team_a === a;
      aScore = aIsSeriesA ? series.a_wins : series.b_wins;
      bScore = aIsSeriesA ? series.b_wins : series.a_wins;
    }

    nodes[spec.id] = {
      id: spec.id,
      label: spec.label,
      round: spec.round,
      a, b,
      aLabel: a || spec.defaultA,
      bLabel: b || spec.defaultB,
      series, aScore, bScore, winner, loser,
    };
  }

  return KNOCKOUT_NODES.map((t) => nodes[t.id]);
}
