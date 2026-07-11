// Static per-edition match round/day map.
// season → match_code → { day: N, round: 'Display Label' }
//
// 'day' is 1-indexed within the stage and resets each phase (per Liquipedia).
// 'round' is the bracket/round display label for individual match rows.
// Missing entries degrade gracefully: day falls back to date-derived numbering,
// round tag is omitted.
//
// All dates in match codes are local time (UTC+7); DB played_at is UTC (1 day behind).

const M7 = {
  // ── Wild Card (Jan 3–6 local / Jan 2–5 UTC) ─────────────────────────────
  // Days 1–3: Round Robin group stage  |  Day 4: Decider SF (both SF winners qualify)
  'M720260103M1': { day: 1, round: 'Group Stage' },
  'M720260103M2': { day: 1, round: 'Group Stage' },
  'M720260103M3': { day: 1, round: 'Group Stage' },
  'M720260103M4': { day: 1, round: 'Group Stage' },
  'M720260104M1': { day: 2, round: 'Group Stage' },
  'M720260104M2': { day: 2, round: 'Group Stage' },
  'M720260104M3': { day: 2, round: 'Group Stage' },
  'M720260104M4': { day: 2, round: 'Group Stage' },
  'M720260105M1': { day: 3, round: 'Group Stage' },
  'M720260105M2': { day: 3, round: 'Group Stage' },
  'M720260105M3': { day: 3, round: 'Group Stage' },
  'M720260105M4': { day: 3, round: 'Group Stage' },
  'M720260106M1': { day: 4, round: 'Decider' },
  'M720260106M2': { day: 4, round: 'Decider' },

  // ── Swiss Stage (Jan 10–17 local / Jan 9–16 UTC) ─────────────────────────
  // Round 1 (Day 1): Bo1 all 16 teams
  'M720260110M1': { day: 1, round: 'Round 1' },
  'M720260110M2': { day: 1, round: 'Round 1' },
  'M720260110M3': { day: 1, round: 'Round 1' },
  'M720260110M4': { day: 1, round: 'Round 1' },
  'M720260110M5': { day: 1, round: 'Round 1' },
  'M720260110M6': { day: 1, round: 'Round 1' },
  'M720260110M7': { day: 1, round: 'Round 1' },
  'M720260110M8': { day: 1, round: 'Round 1' },
  // Round 2 (Day 2): Bo1 High(1-0) + Low(0-1)
  'M720260111M1': { day: 2, round: 'Round 2' },
  'M720260111M2': { day: 2, round: 'Round 2' },
  'M720260111M3': { day: 2, round: 'Round 2' },
  'M720260111M4': { day: 2, round: 'Round 2' },
  'M720260111M5': { day: 2, round: 'Round 2' },
  'M720260111M6': { day: 2, round: 'Round 2' },
  'M720260111M7': { day: 2, round: 'Round 2' },
  'M720260111M8': { day: 2, round: 'Round 2' },
  // Round 3 (Days 3–4): Bo3 High(2-0)/Mid(1-1)/Low(0-2)
  'M720260112M1': { day: 3, round: 'Round 3' },
  'M720260112M2': { day: 3, round: 'Round 3' },
  'M720260112M3': { day: 3, round: 'Round 3' },
  'M720260112M4': { day: 3, round: 'Round 3' },
  'M720260113M1': { day: 4, round: 'Round 3' },
  'M720260113M2': { day: 4, round: 'Round 3' },
  'M720260113M3': { day: 4, round: 'Round 3' },
  'M720260113M4': { day: 4, round: 'Round 3' },
  // Round 4 (Days 5–6): Bo3 High(2-1)/Low(1-2)
  'M720260115M1': { day: 5, round: 'Round 4' },
  'M720260115M2': { day: 5, round: 'Round 4' },
  'M720260115M3': { day: 5, round: 'Round 4' },
  'M720260116M1': { day: 6, round: 'Round 4' },
  'M720260116M2': { day: 6, round: 'Round 4' },
  'M720260116M3': { day: 6, round: 'Round 4' },
  // Round 5 (Day 7): Bo3 elimination / 3-win advancement
  'M720260117M1': { day: 7, round: 'Round 5' },
  'M720260117M2': { day: 7, round: 'Round 5' },
  'M720260117M3': { day: 7, round: 'Round 5' },

  // ── Knockout Stage (Jan 18–23 local / Jan 17–22 UTC) ────────────────────
  // Day 1: UB QF ×4 (Bo3)
  'M720260118M1': { day: 1, round: 'UB Quarter-Final' },
  'M720260118M2': { day: 1, round: 'UB Quarter-Final' },
  'M720260118M3': { day: 1, round: 'UB Quarter-Final' },
  'M720260118M4': { day: 1, round: 'UB Quarter-Final' },
  // Day 2: UB SF ×2 (Bo5)
  'M720260121M1': { day: 2, round: 'UB Semi-Final' },
  'M720260121M2': { day: 2, round: 'UB Semi-Final' },
  // Day 3: UB Final ×1 + LB Round 1 ×2 (mixed day)
  'M720260122M1': { day: 3, round: 'LB Round 1' },
  'M720260122M2': { day: 3, round: 'LB Round 1' },
  'M720260122M3': { day: 3, round: 'UB Final' },
  // Day 4: LB QF ×2 (Bo5)
  'M720260123M1': { day: 4, round: 'LB Quarter-Final' },
  'M720260123M2': { day: 4, round: 'LB Quarter-Final' },

  // ── Finals (Jan 24–25 local / Jan 23–24 UTC) ────────────────────────────
  // Finals DB stage = LB SF + LB Final + Grand Final (all in same stage)
  // Day 1: LB SF + LB Final (mixed day)
  'M720260124M1': { day: 1, round: 'LB Semi-Final' },
  'M720260124M2': { day: 1, round: 'LB Final' },
  // Day 2: Grand Final (Bo7)
  'M720260125M1': { day: 2, round: 'Grand Final' },
};

// ── M6 ────────────────────────────────────────────────────────────────────────
const M6 = {
  // ── Wild Card (Nov 21–24 local / Nov 20–23 UTC) ──────────────────────────
  // Days 1–3: Group Stage RR (Bo3)  |  Day 4: Decider Bo5 (winner qualifies)
  'M620241121M1': { day: 1, round: 'Group Stage' },
  'M620241121M2': { day: 1, round: 'Group Stage' },
  'M620241121M3': { day: 1, round: 'Group Stage' },
  'M620241121M4': { day: 1, round: 'Group Stage' },
  'M620241122M1': { day: 2, round: 'Group Stage' },
  'M620241122M2': { day: 2, round: 'Group Stage' },
  'M620241122M3': { day: 2, round: 'Group Stage' },
  'M620241122M4': { day: 2, round: 'Group Stage' },
  'M620241123M1': { day: 3, round: 'Group Stage' },
  'M620241123M2': { day: 3, round: 'Group Stage' },
  'M620241123M3': { day: 3, round: 'Group Stage' },
  'M620241123M4': { day: 3, round: 'Group Stage' },
  'M620241124M1': { day: 4, round: 'Decider' },

  // ── Swiss Stage (Nov 28 – Dec 5 local / Nov 27 – Dec 4 UTC) ─────────────
  // Rounds 3 and 4 each span 2 days (High/Mid/Low bracket halves)
  'M620241128M1': { day: 1, round: 'Round 1' },
  'M620241128M2': { day: 1, round: 'Round 1' },
  'M620241128M3': { day: 1, round: 'Round 1' },
  'M620241128M4': { day: 1, round: 'Round 1' },
  'M620241128M5': { day: 1, round: 'Round 1' },
  'M620241128M6': { day: 1, round: 'Round 1' },
  'M620241128M7': { day: 1, round: 'Round 1' },
  'M620241128M8': { day: 1, round: 'Round 1' },
  'M620241129M1': { day: 2, round: 'Round 2' },
  'M620241129M2': { day: 2, round: 'Round 2' },
  'M620241129M3': { day: 2, round: 'Round 2' },
  'M620241129M4': { day: 2, round: 'Round 2' },
  'M620241129M5': { day: 2, round: 'Round 2' },
  'M620241129M6': { day: 2, round: 'Round 2' },
  'M620241129M7': { day: 2, round: 'Round 2' },
  'M620241129M8': { day: 2, round: 'Round 2' },
  'M620241130M1': { day: 3, round: 'Round 3' },
  'M620241130M2': { day: 3, round: 'Round 3' },
  'M620241130M3': { day: 3, round: 'Round 3' },
  'M620241130M4': { day: 3, round: 'Round 3' },
  'M620241201M1': { day: 4, round: 'Round 3' },
  'M620241201M2': { day: 4, round: 'Round 3' },
  'M620241201M3': { day: 4, round: 'Round 3' },
  'M620241201M4': { day: 4, round: 'Round 3' },
  'M620241203M1': { day: 5, round: 'Round 4' },
  'M620241203M2': { day: 5, round: 'Round 4' },
  'M620241203M3': { day: 5, round: 'Round 4' },
  'M620241204M1': { day: 6, round: 'Round 4' },
  'M620241204M2': { day: 6, round: 'Round 4' },
  'M620241204M3': { day: 6, round: 'Round 4' },
  'M620241205M1': { day: 7, round: 'Round 5' },
  'M620241205M2': { day: 7, round: 'Round 5' },
  'M620241205M3': { day: 7, round: 'Round 5' },

  // ── Knockout Stage (Dec 7–15 local / Dec 6–14 UTC) ──────────────────────
  // GF folded into Knockout DB stage (no separate Finals stage)
  // Day 1: UB QF ×4 (Bo3)
  'M620241207M1': { day: 1, round: 'UB Quarter-Final' },
  'M620241207M2': { day: 1, round: 'UB Quarter-Final' },
  'M620241207M3': { day: 1, round: 'UB Quarter-Final' },
  'M620241207M4': { day: 1, round: 'UB Quarter-Final' },
  // Day 2: UB SF ×2 (Bo5)
  'M620241208M1': { day: 2, round: 'UB Semi-Final' },
  'M620241208M2': { day: 2, round: 'UB Semi-Final' },
  // Day 3: LB Round 1 ×2 (Bo5)
  'M620241210M1': { day: 3, round: 'LB Round 1' },
  'M620241210M2': { day: 3, round: 'LB Round 1' },
  // Day 4: UB Final ×1 + LB QF ×2 (mixed day, all Bo5)
  'M620241211M1': { day: 4, round: 'LB Quarter-Final' },
  'M620241211M2': { day: 4, round: 'LB Quarter-Final' },
  'M620241211M3': { day: 4, round: 'UB Final' },
  // Day 5: LB SF ×1 + LB Final ×1 (mixed day)
  'M620241214M1': { day: 5, round: 'LB Semi-Final' },
  'M620241214M2': { day: 5, round: 'LB Final' },
  // Day 6: Grand Final (Bo7)
  'M620241215M1': { day: 6, round: 'Grand Final' },
};

// ── M5 ────────────────────────────────────────────────────────────────────────
const M5 = {
  // ── Wild Card (Nov 23–26 local) ─────────────────────────────────────────────
  // Day 1 (Nov 23): 4 matches — 2 per group
  'M520231123M1': { day: 1, round: 'Group Stage' },
  'M520231123M2': { day: 1, round: 'Group Stage' },
  'M520231123M3': { day: 1, round: 'Group Stage' },
  'M520231123M4': { day: 1, round: 'Group Stage' },
  // Day 2 (Nov 24): 2 matches — 1 per group
  'M520231124M1': { day: 2, round: 'Group Stage' },
  'M520231124M2': { day: 2, round: 'Group Stage' },
  // Day 3 (Nov 25): 6 matches — final round robin matches (3 per group)
  'M520231125M1': { day: 3, round: 'Group Stage' },
  'M520231125M2': { day: 3, round: 'Group Stage' },
  'M520231125M3': { day: 3, round: 'Group Stage' },
  'M520231125M4': { day: 3, round: 'Group Stage' },
  'M520231125M5': { day: 3, round: 'Group Stage' },
  'M520231125M6': { day: 3, round: 'Group Stage' },
  // Day 4 (Nov 26): Crossover (1st vs other 2nd, Bo5)
  'M520231126M1': { day: 4, round: 'Crossover' },
  'M520231126M2': { day: 4, round: 'Crossover' },

  // ── Group Stage (Dec 2–7 local) ──────────────────────────────────────────────
  // 4 matches per day (one per group), round-robin Bo3
  'M520231202M1': { day: 1, round: 'Group Stage' },
  'M520231202M2': { day: 1, round: 'Group Stage' },
  'M520231202M3': { day: 1, round: 'Group Stage' },
  'M520231202M4': { day: 1, round: 'Group Stage' },
  'M520231203M1': { day: 2, round: 'Group Stage' },
  'M520231203M2': { day: 2, round: 'Group Stage' },
  'M520231203M3': { day: 2, round: 'Group Stage' },
  'M520231203M4': { day: 2, round: 'Group Stage' },
  'M520231204M1': { day: 3, round: 'Group Stage' },
  'M520231204M2': { day: 3, round: 'Group Stage' },
  'M520231204M3': { day: 3, round: 'Group Stage' },
  'M520231204M4': { day: 3, round: 'Group Stage' },
  'M520231205M1': { day: 4, round: 'Group Stage' },
  'M520231205M2': { day: 4, round: 'Group Stage' },
  'M520231205M3': { day: 4, round: 'Group Stage' },
  'M520231205M4': { day: 4, round: 'Group Stage' },
  'M520231206M1': { day: 5, round: 'Group Stage' },
  'M520231206M2': { day: 5, round: 'Group Stage' },
  'M520231206M3': { day: 5, round: 'Group Stage' },
  'M520231206M4': { day: 5, round: 'Group Stage' },
  'M520231207M1': { day: 6, round: 'Group Stage' },
  'M520231207M2': { day: 6, round: 'Group Stage' },
  'M520231207M3': { day: 6, round: 'Group Stage' },
  'M520231207M4': { day: 6, round: 'Group Stage' },

  // ── Knockout (Dec 9–16 local) ────────────────────────────────────────────────
  // UB QF split across 2 days (2 matches each), then UB SF, LB R1, LB QF
  // Day 6 is a mixed day: LB SF + UB Final + LB Final
  // Day 1 (Dec 9): UB QF ×2
  'M520231209M1': { day: 1, round: 'UB Quarter-Final' },
  'M520231209M2': { day: 1, round: 'UB Quarter-Final' },
  // Day 2 (Dec 10): UB QF ×2
  'M520231210M1': { day: 2, round: 'UB Quarter-Final' },
  'M520231210M2': { day: 2, round: 'UB Quarter-Final' },
  // Day 3 (Dec 11): UB SF ×2
  'M520231211M1': { day: 3, round: 'UB Semi-Final' },
  'M520231211M2': { day: 3, round: 'UB Semi-Final' },
  // Day 4 (Dec 12): LB Round 1 ×2
  'M520231212M1': { day: 4, round: 'LB Round 1' },
  'M520231212M2': { day: 4, round: 'LB Round 1' },
  // Day 5 (Dec 15): LB QF ×2
  'M520231215M1': { day: 5, round: 'LB Quarter-Final' },
  'M520231215M2': { day: 5, round: 'LB Quarter-Final' },
  // Day 6 (Dec 16): LB SF + UB Final + LB Final (mixed)
  'M520231216M1': { day: 6, round: 'LB Semi-Final' },
  'M520231216M2': { day: 6, round: 'UB Final' },
  'M520231216M3': { day: 6, round: 'LB Final' },

  // ── Finals (Dec 17 local) ─────────────────────────────────────────────────
  'M520231217M1': { day: 1, round: 'Grand Final' },
};

const MAPS = { M5, M6, M7 };

// Return { day, round } for a match, or null if no static entry.
export function getMatchMeta(season, matchCode) {
  return MAPS[season]?.[matchCode] ?? null;
}
