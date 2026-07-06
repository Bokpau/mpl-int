// MSC 2026 Main (EWC 26) Group Stage bracket — seeding + advancement logic,
// shared by the Dashboard (server) and the Matches page Grid view (client) so
// there is ONE source of truth. Two groups of 8, each a Bo3 double-elimination
// of 10 matches (labelled M1–M10 on the official bracket art); the top 4 of each
// group advance to the Knockout.
//
// IMPORTANT — the M1–M10 labels here are BRACKET POSITIONS, not the schedule's
// match codes. The API's match_code (e.g. MSC20260710M2) is just "the Nth match
// PLAYED that day", and each day mixes both groups, so the two numbering schemes
// never line up. We therefore never key advancement off match_code. Instead every
// node is resolved by matching the played series' TWO TEAM CODES — exactly like
// the Wild Card Decider (see computeDecider in lib/msc2026Bracket.js). That makes
// advancement automatic and immune to whatever numbers the schedule assigns.
//
// Everything keys off the team's MSC 2026 ERA code (era_code) — what each team is
// called AT this edition. Note the two Falcons are distinct teams: FLCN (PH, Group
// A M2) and FLCM (MENA, Group A M3). Seeds mirror the official Group A / Group B
// bracket art; True Rippers uses era code "TR" (shown as "TRX" on the art).

// The four seeded Upper-Round-1 pairings per group (the only hardcoded teams —
// everything past M4 is derived from results).
export const MAIN_GROUPS = {
  A: {
    M1: ['VIT', 'TR'],
    M2: ['FLCN', 'GZG'],
    M3: ['VMS', 'FLCM'],
    M4: ['TS', 'IG'],
  },
  B: {
    M1: ['YG', 'GK'],
    M2: ['SRG', 'PRO'],
    M3: ['ONIC', 'E7'],
    M4: ['TL', 'AUR'],
  },
};

// The double-elimination feeder tree (identical shape for both groups). `a`/`b`
// reference an upstream node's winner ({ win }) or loser ({ lose }). M1–M4 are the
// seeds and carry no feeders.
export const MAIN_TREE = [
  { id: 'M1', round: 'Upper R1' },
  { id: 'M2', round: 'Upper R1' },
  { id: 'M3', round: 'Upper R1' },
  { id: 'M4', round: 'Upper R1' },
  { id: 'M5', round: 'Upper R2', a: { win: 'M1' }, b: { win: 'M2' } },
  { id: 'M6', round: 'Upper R2', a: { win: 'M3' }, b: { win: 'M4' } },
  { id: 'M7', round: 'Lower R1', a: { lose: 'M1' }, b: { lose: 'M2' } },
  { id: 'M8', round: 'Lower R1', a: { lose: 'M3' }, b: { lose: 'M4' } },
  { id: 'M9', round: 'Lower R2', a: { lose: 'M6' }, b: { win: 'M7' } },
  { id: 'M10', round: 'Lower R2', a: { lose: 'M5' }, b: { win: 'M8' } },
];

// The four nodes whose winners advance to the Knockout.
export const MAIN_QUALIFIER_REFS = [
  { win: 'M5' }, { win: 'M6' }, { win: 'M9' }, { win: 'M10' },
];

// Human label for an unresolved feeder, e.g. { win: 'M1' } -> "W M1".
export function refLabel(ref) {
  if (!ref) return null;
  if (ref.win) return `W ${ref.win}`;
  if (ref.lose) return `L ${ref.lose}`;
  return null;
}

// Which group an era code belongs to (or null). Groups are disjoint, so a series
// between two same-group teams unambiguously belongs to that group — no `group`
// column is needed in the data.
export function groupOf(eraCode) {
  for (const [g, seeds] of Object.entries(MAIN_GROUPS)) {
    if (Object.values(seeds).some((pair) => pair.includes(eraCode))) return g;
  }
  return null;
}

// Resolve one group's bracket from all played Main-stage series (buildSeries()
// output). Walks M1→M10 in dependency order; each node finds the earliest
// not-yet-consumed series whose two teams match its (resolved) pairing, then flows
// the winner/loser downstream. Consuming each series once keeps a later rematch
// (e.g. a knockout meeting of the same two teams) from being grabbed by an earlier
// slot.
//
// Returns { nodes, qualifiers } where each node is:
//   { id, round, a, b, aLabel, bLabel, series, aScore, bScore, winner, loser }
// with a/b the resolved era codes (or null) and aLabel/bLabel the display fallback.
export function resolveMainGroup(groupKey, mainSeries = []) {
  const seeds = MAIN_GROUPS[groupKey];
  const teamSet = new Set(Object.values(seeds).flat());

  const groupSeries = mainSeries
    .filter((s) => teamSet.has(s.team_a) && teamSet.has(s.team_b))
    .sort((a, b) =>
      String(a.played_at || '').localeCompare(String(b.played_at || '')) ||
      String(a.match_code || '').localeCompare(String(b.match_code || ''))
    );

  const used = new Set();
  const findSeries = (a, b) => {
    if (!a || !b) return null;
    return groupSeries.find((s) =>
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

  for (const spec of MAIN_TREE) {
    const seeded = seeds[spec.id];
    const a = seeded ? seeded[0] : resolveRef(spec.a);
    const b = seeded ? seeded[1] : resolveRef(spec.b);
    const series = findSeries(a, b);
    if (series) used.add(series.match_code);

    let winner = null, loser = null, aScore = null, bScore = null;
    if (series) {
      winner = series.winner_code;
      if (winner) loser = winner === series.team_a ? series.team_b : winner === series.team_b ? series.team_a : null;
      // Score orientation follows this node's a/b, not the series' raw order.
      const aIsSeriesA = series.team_a === a;
      aScore = aIsSeriesA ? series.a_wins : series.b_wins;
      bScore = aIsSeriesA ? series.b_wins : series.a_wins;
    }

    nodes[spec.id] = {
      id: spec.id, round: spec.round,
      a, b,
      aLabel: a || (seeded ? seeded[0] : refLabel(spec.a)),
      bLabel: b || (seeded ? seeded[1] : refLabel(spec.b)),
      series, aScore, bScore, winner, loser,
    };
  }

  const qualifiers = MAIN_QUALIFIER_REFS.map(resolveRef).filter(Boolean);
  return { nodes: MAIN_TREE.map((t) => nodes[t.id]), qualifiers };
}
