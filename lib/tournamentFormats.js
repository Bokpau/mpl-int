// Tournament format metadata for all MSC + M-Series editions.
//
// Each edition maps to an ordered list of stage descriptors. The Matches page
// uses this to pick the right layout primitive per stage instead of hardcoding
// MSC 2026's format for everything.
//
// stage_type values match what the DB returns per game:
//   'qualifier' → Wild Card / Swiss / Crossover stage
//   'main'      → Group Stage, Playoffs, Knockout, Finals
//
// layout values:
//   'table+rows'    — round-robin standings table + individual match rows
//   'double-elim'   — double-elimination bracket (upper + lower + GF)
//   'single-elim'   — single-elimination bracket
//   'swiss'         — Swiss-system rounds (M6/M7)
//   'match-rows'    — match rows only, no standings table (play-in / crossover)
//   'koth'          — King-of-the-Hill bracket (MSC 2026 Wild Card Gauntlet)
//   'decider'       — single decider match card
//   'gsl'           — GSL-style double-elim per group (MSC 2025/2026 Group Stage)
//
// bo: series length by round where known. 'varies' = multiple lengths in stage.
// teams: participant count entering the stage.
// groups: number of groups (for table+rows / gsl layouts).
// advances: how many teams exit into the next stage.

const FORMATS = {

  // ── MSC ────────────────────────────────────────────────────────────────────

  'MSC 2017': {
    stages: [
      {
        db_stage: 'Playoffs',
        db_stage_type: 'main',
        label: 'Playoffs',
        layout: 'double-elim',
        teams: 8,
        bo: { default: 'Bo3', final: 'Bo7' },
        note: 'No group stage. GF split to "Finals" in DB but same bracket.',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'double-elim',
        merged_into: 'Playoffs',
        note: 'Terminal match of the Playoffs bracket — render together.',
      },
    ],
  },

  'MSC 2018': {
    stages: [
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 10,
        groups: 2,
        bo: 'Bo1',
        advances: 4,
        note: '2 groups of 5, RR Bo1. Top 2 per group advance to Playoffs.',
      },
      {
        db_stage: 'Playoffs',
        db_stage_type: 'main',
        label: 'Playoffs',
        layout: 'single-elim',
        teams: 4,
        bo: { sf: 'Bo3', third: 'Bo5', final: 'Bo5' },
        note: 'SF + 3rd place match + GF. GF split to "Finals" in DB.',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'single-elim',
        merged_into: 'Playoffs',
        note: 'Terminal GF of single-elim bracket — render together.',
      },
    ],
  },

  'MSC 2019': {
    stages: [
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 12,
        groups: 4,
        bo: 'Bo3',
        advances: 8,
        note: '4 groups of 3, RR Bo3. Winner→UB, 2nd→play-in, 3rd→play-in.',
      },
      {
        db_stage: 'Playoffs',
        db_stage_type: 'main',
        label: 'Playoffs',
        layout: 'double-elim',
        teams: 8,
        bo: { early: 'Bo3', ub_lb_finals: 'Bo5', final: 'Bo5' },
        note: 'Includes play-in rounds. GF split to "Finals" in DB.',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'double-elim',
        merged_into: 'Playoffs',
        note: 'Terminal GF of double-elim bracket — render together.',
      },
    ],
  },

  'MSC 2021': {
    stages: [
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 12,
        groups: 4,
        bo: 'Bo3',
        advances: 8,
        note: '4 groups of 3, RR Bo3. Winner→UB, 2nd/3rd→play-in.',
      },
      {
        db_stage: 'Playoffs',
        db_stage_type: 'main',
        label: 'Playoffs',
        layout: 'double-elim',
        teams: 8,
        bo: { early: 'Bo3', ub_lb_finals: 'Bo5', final: 'Bo7' },
        note: 'Includes play-in. Bracket reset possible. GF split to "Finals".',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'double-elim',
        merged_into: 'Playoffs',
        note: 'Terminal GF of double-elim bracket — render together.',
      },
    ],
  },

  'MSC 2022': {
    stages: [
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 12,
        groups: 4,
        bo: 'Bo2',
        advances: 8,
        note: '4 groups of 3, RR Bo2 (draws allowed, 2-0/1-1/0-2). Top 2 per group advance.',
      },
      {
        db_stage: 'Playoffs',
        db_stage_type: 'main',
        label: 'Playoffs',
        layout: 'double-elim',
        teams: 8,
        bo: { ub_qf: 'Bo3', others: 'Bo5', final: 'Bo7' },
        note: 'GF split to "Finals" in DB.',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'double-elim',
        merged_into: 'Playoffs',
      },
    ],
  },

  'MSC 2023': {
    stages: [
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 12,
        groups: 4,
        bo: 'Bo3',
        advances: 8,
        note: '4 groups of 3, RR Bo3. Top 2 per group advance. No play-in.',
      },
      {
        db_stage: 'Playoffs',
        db_stage_type: 'main',
        label: 'Knockout',
        layout: 'single-elim',
        teams: 8,
        bo: { default: 'Bo5', final: 'Bo7' },
        note: 'FORMAT CHANGE: single-elim (not double-elim). GF split to "Finals".',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'single-elim',
        merged_into: 'Playoffs',
      },
    ],
  },

  'MSC 2024': {
    stages: [
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Groups',
        layout: 'table+rows',
        teams: 8,
        groups: 2,
        bo: 'Bo1',
        advances: 2,
        note: '2 groups of 4, RR Bo1. Top 1 per group → Decider.',
      },
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Decider',
        layout: 'decider',
        bo: 'Bo5',
        advances: 1,
        note: 'Single Bo5 match. Winner qualifies to Group Stage.',
      },
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 16,
        groups: 4,
        bo: 'Bo2',
        advances: 8,
        note: '4 groups of 4, RR Bo2. Top 2 per group advance.',
      },
      {
        db_stage: 'Knockout',
        db_stage_type: 'main',
        label: 'Knockout',
        layout: 'single-elim',
        teams: 8,
        bo: { default: 'Bo5', final: 'Bo7' },
        note: 'GF split to "Finals" in DB.',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'single-elim',
        merged_into: 'Knockout',
      },
    ],
  },

  'MSC 2025': {
    stages: [
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card',
        layout: 'gsl',
        teams: 8,
        groups: 2,
        bo: 'Bo3',
        advances: 4,
        note: 'Two GSL-style double-elim groups. Top 2 per group advance + decider slot. Verify exact bracket shape on Liquipedia.',
      },
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'gsl',
        teams: 16,
        groups: 2,
        bo: 'Bo3',
        advances: 8,
        note: 'Two GSL-style double-elim groups of 8. Top 4 per group advance. Game count (51) suggests ≤ full double-elim — verify shape.',
      },
      {
        db_stage: 'Knockout',
        db_stage_type: 'main',
        label: 'Knockout',
        layout: 'single-elim',
        teams: 8,
        bo: { default: 'Bo5', final: 'Bo7' },
        note: 'No separate Finals stage — GF folded into Knockout in DB.',
      },
    ],
  },

  'MSC 2026': {
    stages: [
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Groups',
        layout: 'table+rows',
        teams: 10,
        groups: 2,
        bo: 'Bo1',
        advances: 4,
        note: '2 groups of 5, RR Bo1. Top 2 per group advance to Gauntlet.',
      },
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Gauntlet',
        layout: 'koth',
        bo: 'Bo3',
        advances: 4,
        note: 'Cross-group King-of-the-Hill bracket. 4 qualifiers advance to Decider.',
      },
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Decider',
        layout: 'single-elim',
        teams: 4,
        bo: 'Bo3',
        advances: 2,
        note: 'SF + GF single-elim. 2 winners qualify to Main Stage.',
      },
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'gsl',
        teams: 16,
        groups: 2,
        bo: 'Bo3',
        advances: 8,
        note: 'Two GSL double-elim groups of 8 (M1-M10 per group). Top 4 per group advance.',
      },
      {
        db_stage: 'Knockout',
        db_stage_type: 'main',
        label: 'Knockout',
        layout: 'single-elim',
        teams: 8,
        bo: { default: 'Bo5', final: 'Bo7' },
      },
    ],
  },

  // ── M-Series ───────────────────────────────────────────────────────────────

  'M1': {
    stages: [
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 16,
        groups: 4,
        bo: 'Bo3',
        advances: 8,
        note: '4 groups of 4, RR Bo3. Winner→UB, Runner-up→LB.',
      },
      {
        db_stage: 'Playoffs',
        db_stage_type: 'main',
        label: 'Playoffs',
        layout: 'double-elim',
        teams: 8,
        bo: { early: 'Bo3', ub_lb_finals: 'Bo5', final: 'Bo7' },
        note: 'GF split to "Finals" in DB but same bracket.',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'double-elim',
        merged_into: 'Playoffs',
      },
    ],
  },

  'M2': {
    stages: [
      {
        db_stage: 'Regular Season',
        db_stage_type: 'main',
        label: 'Regular Season',
        layout: 'table+rows',
        teams: 12,
        groups: 4,
        bo: 'Bo3',
        advances: 8,
        note: '4 groups of 3, RR Bo3. Top 2 per group advance. 2nd/3rd→play-in.',
      },
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 12,
        groups: 4,
        bo: 'Bo3',
        advances: 8,
        note: '4 groups of 3, RR Bo3. Winner→UB. Play-in determines LB entrants.',
      },
      {
        db_stage: 'Playoffs',
        db_stage_type: 'main',
        label: 'Playoffs',
        layout: 'double-elim',
        teams: 8,
        bo: { early: 'Bo3', ub_lb_finals: 'Bo5', final: 'Bo7' },
        note: 'GF split to "Finals" in DB but same bracket.',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'double-elim',
        merged_into: 'Playoffs',
      },
    ],
  },

  'M3': {
    stages: [
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 16,
        groups: 4,
        bo: 'Bo1',
        advances: 8,
        note: '4 groups of 4, RR Bo1. Top 2→UB, Bottom 2→LB. Tiebreaker matches possible.',
      },
      {
        db_stage: 'Playoffs',
        db_stage_type: 'main',
        label: 'Playoffs',
        layout: 'double-elim',
        teams: 16,
        bo: { lb_r1_r2: 'Bo3', others: 'Bo5', final: 'Bo7' },
        note: '16-team double-elim (8 UB + 8 LB seeders). GF split to "Finals".',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'double-elim',
        merged_into: 'Playoffs',
      },
    ],
  },

  'M4': {
    stages: [
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 16,
        groups: 4,
        bo: 'Bo1',
        advances: 8,
        note: '4 groups of 4, RR Bo1. Top 2→UB, Bottom 2→LB. Tiebreaker matches possible.',
      },
      {
        db_stage: 'Knockout',
        db_stage_type: 'main',
        label: 'Knockout Stage',
        layout: 'double-elim',
        teams: 16,
        bo: { lb_r1_r2: 'Bo3', others: 'Bo5', final: 'Bo7' },
        note: '16-team double-elim (8 UB + 8 LB seeders). GF split to "Finals".',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'double-elim',
        merged_into: 'Knockout',
      },
    ],
  },

  'M5': {
    stages: [
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Groups',
        layout: 'table+rows',
        teams: 8,
        groups: 2,
        bo: 'Bo3',
        advances: 4,
        note: '2 groups of 4, RR Bo3. Top 2 per group (4 teams) → Crossover Matches.',
      },
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Crossover',
        layout: 'match-rows',
        bo: 'Bo5',
        advances: 2,
        note: '1st vs 1st, 2nd vs 2nd crossover matches (Bo5). 2 winners qualify to Group Stage.',
      },
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Group Stage',
        layout: 'table+rows',
        teams: 16,
        groups: 4,
        bo: 'Bo3',
        advances: 8,
        note: '4 groups of 4, RR Bo3. Top 2 per group advance to Knockout.',
      },
      {
        db_stage: 'Knockout',
        db_stage_type: 'main',
        label: 'Knockout Stage',
        layout: 'double-elim',
        teams: 8,
        bo: { default: 'Bo5', final: 'Bo7' },
        note: 'GF split to "Finals" in DB but same bracket.',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'double-elim',
        merged_into: 'Knockout',
      },
    ],
  },

  'M6': {
    stages: [
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Groups',
        layout: 'table+rows',
        teams: 8,
        groups: 2,
        bo: 'Bo3',
        advances: 2,
        note: '2 groups of 4, RR Bo3. Top 1 per group → Decider Stage.',
      },
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Decider',
        layout: 'decider',
        bo: 'Bo5',
        advances: 1,
        note: 'Single Bo5 match between 2 group winners. 1 winner qualifies to Swiss Stage.',
      },
      {
        db_stage: 'Swiss Round',
        db_stage_type: 'qualifier',
        label: 'Swiss Stage',
        layout: 'swiss',
        teams: 16,
        bo: { r1_r2: 'Bo1', r3_r4_r5: 'Bo3' },
        advances: 8,
        note: '5 rounds of Swiss. Teams eliminated at 0-3; teams at 3-0 advance early; others play until 3 wins or 3 losses. Top 8 advance to Knockout.',
      },
      {
        db_stage: 'Knockout',
        db_stage_type: 'main',
        label: 'Knockout Stage',
        layout: 'double-elim',
        teams: 8,
        bo: { ub_qf: 'Bo3', others: 'Bo5', final: 'Bo7' },
        note: 'No separate Finals stage — GF folded into Knockout in DB.',
      },
    ],
  },

  'M7': {
    stages: [
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Groups',
        layout: 'table+rows',
        teams: 8,
        groups: 2,
        bo: 'Bo3',
        advances: 4,
        note: '2 groups of 4, RR Bo3. Top 2 per group → Decider Stage.',
      },
      {
        db_stage: 'Wild Card',
        db_stage_type: 'qualifier',
        label: 'Wild Card Decider',
        layout: 'single-elim',
        teams: 4,
        bo: 'Bo5',
        advances: 2,
        note: 'SF + GF single-elim (Bo5). 2 winners qualify to Swiss Stage.',
      },
      {
        db_stage: 'Group Stage',
        db_stage_type: 'main',
        label: 'Swiss Stage',
        layout: 'swiss',
        teams: 16,
        bo: { r1_r2: 'Bo1', r3_r4_r5: 'Bo3' },
        advances: 8,
        note: '5 rounds of Swiss. Same rules as M6 Swiss. Top 8 advance to Knockout.',
      },
      {
        db_stage: 'Knockout',
        db_stage_type: 'main',
        label: 'Knockout Stage',
        layout: 'double-elim',
        teams: 8,
        bo: { ub_qf: 'Bo3', others: 'Bo5', final: 'Bo7' },
        note: 'Seeded by Swiss record. GF split to "Finals" in DB.',
      },
      {
        db_stage: 'Finals',
        db_stage_type: 'main',
        label: 'Grand Final',
        layout: 'double-elim',
        merged_into: 'Knockout',
      },
    ],
  },
};

// Look up format for a given season string. Returns null for unknown editions
// (fallback: render all stages as match-rows).
export function getFormat(season) {
  return FORMATS[season] || null;
}

// Return the ordered stage descriptors for a season, collapsing merged stages
// (Finals folded into parent bracket) so callers get one entry per render unit.
export function getStages(season) {
  const fmt = getFormat(season);
  if (!fmt) return null;
  return fmt.stages.filter((s) => !s.merged_into);
}

// Return stage descriptor matching a DB stage name + stage_type pair. A season
// may have multiple stages sharing the same db_stage (e.g. Wild Card Groups vs
// Wild Card Decider for MSC 2026 — both have db_stage='Wild Card'). Use index
// for disambiguation when needed.
export function findStage(season, dbStageName, dbStageType) {
  const fmt = getFormat(season);
  if (!fmt) return null;
  return fmt.stages.find(
    (s) => s.db_stage === dbStageName && s.db_stage_type === dbStageType
  ) || null;
}

export default FORMATS;
