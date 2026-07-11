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
  // Day 3 (Dec 11): LB Round 1 ×2 (FF–BLCK, SYS–BG)
  // (verified against Liquipedia bracket + DB teams)
  'M520231211M1': { day: 3, round: 'LB Round 1' },
  'M520231211M2': { day: 3, round: 'LB Round 1' },
  // Day 4 (Dec 12): UB SF ×2 (DEVU–ONIC, APBR–GEEK)
  'M520231212M1': { day: 4, round: 'UB Semi-Final' },
  'M520231212M2': { day: 4, round: 'UB Semi-Final' },
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

// ── M4 ────────────────────────────────────────────────────────────────────────
const M4 = {
  // ── Group Stage (Jan 1–4 local, Jakarta UTC+7) ───────────────────────────
  // Jan 1: Group A (3 matches) + Group B (3 matches) = M1–M6
  'M420230101M1': { day: 1, round: 'Group Stage' },
  'M420230101M2': { day: 1, round: 'Group Stage' },
  'M420230101M3': { day: 1, round: 'Group Stage' },
  'M420230101M4': { day: 1, round: 'Group Stage' },
  'M420230101M5': { day: 1, round: 'Group Stage' },
  'M420230101M6': { day: 1, round: 'Group Stage' },
  // Jan 2: Group C (3 matches) + Group D (3 matches) = M1–M6
  'M420230102M1': { day: 2, round: 'Group Stage' },
  'M420230102M2': { day: 2, round: 'Group Stage' },
  'M420230102M3': { day: 2, round: 'Group Stage' },
  'M420230102M4': { day: 2, round: 'Group Stage' },
  'M420230102M5': { day: 2, round: 'Group Stage' },
  'M420230102M6': { day: 2, round: 'Group Stage' },
  // Jan 3: Group A day 2 (3) + Group B day 2 (3) + Group A Tiebreaker (3) = M1–M9
  'M420230103M1': { day: 3, round: 'Group Stage' },
  'M420230103M2': { day: 3, round: 'Group Stage' },
  'M420230103M3': { day: 3, round: 'Group Stage' },
  'M420230103M4': { day: 3, round: 'Group Stage' },
  'M420230103M5': { day: 3, round: 'Group Stage' },
  'M420230103M6': { day: 3, round: 'Group Stage' },
  'M420230103M7': { day: 3, round: 'Tiebreaker' },
  'M420230103M8': { day: 3, round: 'Tiebreaker' },
  'M420230103M9': { day: 3, round: 'Tiebreaker' },
  // Jan 4: Group C day 2 (3) + Group D day 2 (3) = M1–M6
  'M420230104M1': { day: 4, round: 'Group Stage' },
  'M420230104M2': { day: 4, round: 'Group Stage' },
  'M420230104M3': { day: 4, round: 'Group Stage' },
  'M420230104M4': { day: 4, round: 'Group Stage' },
  'M420230104M5': { day: 4, round: 'Group Stage' },
  'M420230104M6': { day: 4, round: 'Group Stage' },

  // ── Playoffs (Jan 7–14 local) ────────────────────────────────────────────
  // 16-team double-elim: 8 UB seeders (top 2 each group), 8 LB seeders (bottom 2)
  // Day 1 (Jan 7): UB QF ×2
  'M420230107M1': { day: 1, round: 'UB Quarter-Final' },
  'M420230107M2': { day: 1, round: 'UB Quarter-Final' },
  // Day 2 (Jan 8): UB QF ×2
  'M420230108M1': { day: 2, round: 'UB Quarter-Final' },
  'M420230108M2': { day: 2, round: 'UB Quarter-Final' },
  // Day 3 (Jan 9): LB R1 ×4 (8 initial LB seeders)
  'M420230109M1': { day: 3, round: 'LB Round 1' },
  'M420230109M2': { day: 3, round: 'LB Round 1' },
  'M420230109M3': { day: 3, round: 'LB Round 1' },
  'M420230109M4': { day: 3, round: 'LB Round 1' },
  // Day 4 (Jan 10): LB R2 ×4 (4 UB QF losers vs 4 LB R1 winners)
  'M420230110M1': { day: 4, round: 'LB Round 2' },
  'M420230110M2': { day: 4, round: 'LB Round 2' },
  'M420230110M3': { day: 4, round: 'LB Round 2' },
  'M420230110M4': { day: 4, round: 'LB Round 2' },
  // Day 5 (Jan 11): LB R3 ×1 (FCON–FF) + UB SF ×1 (RRQ–BLCK)
  // (verified against Liquipedia bracket + DB teams)
  'M420230111M1': { day: 5, round: 'LB Round 3' },
  'M420230111M2': { day: 5, round: 'UB Semi-Final' },
  // Day 6 (Jan 12): LB R3 ×1 (TV–RRQ BR) + UB SF ×1 (ONIC–ECHO)
  'M420230112M1': { day: 6, round: 'LB Round 3' },
  'M420230112M2': { day: 6, round: 'UB Semi-Final' },
  // Day 7 (Jan 13): LB QF ×2 (2 LB R3 winners + 2 UB SF losers) + UB Final ×1
  'M420230113M1': { day: 7, round: 'LB Quarter-Final' },
  'M420230113M2': { day: 7, round: 'LB Quarter-Final' },
  'M420230113M3': { day: 7, round: 'UB Final' },
  // Day 8 (Jan 14): LB SF ×1 + LB Final ×1
  'M420230114M1': { day: 8, round: 'LB Semi-Final' },
  'M420230114M2': { day: 8, round: 'LB Final' },

  // ── Finals (Jan 15 local) ────────────────────────────────────────────────
  'M420230115M1': { day: 1, round: 'Grand Final' },
};

// ── M1 ────────────────────────────────────────────────────────────────────────
const M1 = {
  // ── Group Stage (Nov 11–14 local, Manila UTC+8) ──────────────────────────
  // One group per day, 4 teams, RR Bo3 = 6 matches per day.
  // Group A: Nov 11
  'M120191111M1': { day: 1, round: 'Group Stage' },
  'M120191111M2': { day: 1, round: 'Group Stage' },
  'M120191111M3': { day: 1, round: 'Group Stage' },
  'M120191111M4': { day: 1, round: 'Group Stage' },
  'M120191111M5': { day: 1, round: 'Group Stage' },
  'M120191111M6': { day: 1, round: 'Group Stage' },
  // Group B: Nov 12
  'M120191112M1': { day: 2, round: 'Group Stage' },
  'M120191112M2': { day: 2, round: 'Group Stage' },
  'M120191112M3': { day: 2, round: 'Group Stage' },
  'M120191112M4': { day: 2, round: 'Group Stage' },
  'M120191112M5': { day: 2, round: 'Group Stage' },
  'M120191112M6': { day: 2, round: 'Group Stage' },
  // Group C: Nov 13
  'M120191113M1': { day: 3, round: 'Group Stage' },
  'M120191113M2': { day: 3, round: 'Group Stage' },
  'M120191113M3': { day: 3, round: 'Group Stage' },
  'M120191113M4': { day: 3, round: 'Group Stage' },
  'M120191113M5': { day: 3, round: 'Group Stage' },
  'M120191113M6': { day: 3, round: 'Group Stage' },
  // Group D: Nov 14
  'M120191114M1': { day: 4, round: 'Group Stage' },
  'M120191114M2': { day: 4, round: 'Group Stage' },
  'M120191114M3': { day: 4, round: 'Group Stage' },
  'M120191114M4': { day: 4, round: 'Group Stage' },
  'M120191114M5': { day: 4, round: 'Group Stage' },
  'M120191114M6': { day: 4, round: 'Group Stage' },

  // ── Playoffs (Nov 15–17 local) ────────────────────────────────────────────
  // Day 1 (Nov 15): UB SF ×2 + LB R1 ×2 + first LB QF (5 matches)
  'M120191115M1': { day: 1, round: 'UB Semi-Final' },
  'M120191115M2': { day: 1, round: 'UB Semi-Final' },
  'M120191115M3': { day: 1, round: 'LB Round 1' },
  'M120191115M4': { day: 1, round: 'LB Round 1' },
  'M120191115M5': { day: 1, round: 'LB Quarter-Final' },
  // Day 2 (Nov 16): LB QF ×1 + UB Final ×1 + LB SF ×1 (3 matches)
  'M120191116M1': { day: 2, round: 'LB Quarter-Final' },
  'M120191116M2': { day: 2, round: 'UB Final' },
  'M120191116M3': { day: 2, round: 'LB Semi-Final' },
  // Day 3 (Nov 17): LB Final
  'M120191117M1': { day: 3, round: 'LB Final' },

  // ── Finals (Nov 17 local) ─────────────────────────────────────────────────
  'M120191117M2': { day: 1, round: 'Grand Final' },
};

// ── M2 ────────────────────────────────────────────────────────────────────────
const M2 = {
  // ── Group Stage (Jan 18–19 local, Singapore UTC+8) ───────────────────────
  // Groups A+B on Jan 18, Groups C+D on Jan 19. RR Bo3.
  'M220210118M1': { day: 1, round: 'Group Stage' },
  'M220210118M2': { day: 1, round: 'Group Stage' },
  'M220210118M3': { day: 1, round: 'Group Stage' },
  'M220210118M4': { day: 1, round: 'Group Stage' },
  'M220210118M5': { day: 1, round: 'Group Stage' },
  'M220210118M6': { day: 1, round: 'Group Stage' },
  'M220210119M1': { day: 2, round: 'Group Stage' },
  'M220210119M2': { day: 2, round: 'Group Stage' },
  'M220210119M3': { day: 2, round: 'Group Stage' },
  'M220210119M4': { day: 2, round: 'Group Stage' },
  'M220210119M5': { day: 2, round: 'Group Stage' },
  'M220210119M6': { day: 2, round: 'Group Stage' },

  // ── Play-in (Jan 20 local, db_stage "Regular Season") ────────────────────
  'M220210120M1': { day: 1, round: 'Play-in' },
  'M220210120M2': { day: 1, round: 'Play-in' },
  'M220210120M3': { day: 1, round: 'Play-in' },
  'M220210120M4': { day: 1, round: 'Play-in' },

  // ── Playoffs (Jan 22–24 local) ────────────────────────────────────────────
  // Day 1 (Jan 22): LB R1 ×2 + UB SF ×2
  // (M1/M2 = LB R1: 10S–AE, TDK–EVOS SG; M3/M4 = UB SF: BG–BREN, OMG–RRQ,
  //  verified against Liquipedia bracket + DB teams)
  'M220210122M1': { day: 1, round: 'LB Round 1' },
  'M220210122M2': { day: 1, round: 'LB Round 1' },
  'M220210122M3': { day: 1, round: 'UB Semi-Final' },
  'M220210122M4': { day: 1, round: 'UB Semi-Final' },
  // Day 2 (Jan 23): LB QF ×2 + UB Final ×1 + LB SF ×1
  'M220210123M1': { day: 2, round: 'LB Quarter-Final' },
  'M220210123M2': { day: 2, round: 'LB Quarter-Final' },
  'M220210123M3': { day: 2, round: 'UB Final' },
  'M220210123M4': { day: 2, round: 'LB Semi-Final' },
  // Day 3 (Jan 24): LB Final
  'M220210124M1': { day: 3, round: 'LB Final' },

  // ── Finals (Jan 24 local) ─────────────────────────────────────────────────
  'M220210124M2': { day: 1, round: 'Grand Final' },
};

// ── M3 ────────────────────────────────────────────────────────────────────────
const M3 = {
  // ── Group Stage (Dec 6–9 local, Singapore UTC+8) ─────────────────────────
  // Each group plays all its RR matches on a single day (Bo1).
  // Group A: Dec 6 — 6 regular + 2 tiebreaker (3-way tie at 1-2).
  'M320211206M1': { day: 1, round: 'Group Stage' },
  'M320211206M2': { day: 1, round: 'Group Stage' },
  'M320211206M3': { day: 1, round: 'Group Stage' },
  'M320211206M4': { day: 1, round: 'Group Stage' },
  'M320211206M5': { day: 1, round: 'Group Stage' },
  'M320211206M6': { day: 1, round: 'Group Stage' },
  'M320211206M7': { day: 1, round: 'Tiebreaker' },
  'M320211206M8': { day: 1, round: 'Tiebreaker' },
  // Group B: Dec 7 — 6 matches
  'M320211207M1': { day: 2, round: 'Group Stage' },
  'M320211207M2': { day: 2, round: 'Group Stage' },
  'M320211207M3': { day: 2, round: 'Group Stage' },
  'M320211207M4': { day: 2, round: 'Group Stage' },
  'M320211207M5': { day: 2, round: 'Group Stage' },
  'M320211207M6': { day: 2, round: 'Group Stage' },
  // Group C: Dec 8 — 6 matches
  'M320211208M1': { day: 3, round: 'Group Stage' },
  'M320211208M2': { day: 3, round: 'Group Stage' },
  'M320211208M3': { day: 3, round: 'Group Stage' },
  'M320211208M4': { day: 3, round: 'Group Stage' },
  'M320211208M5': { day: 3, round: 'Group Stage' },
  'M320211208M6': { day: 3, round: 'Group Stage' },
  // Group D: Dec 9 — 6 matches
  'M320211209M1': { day: 4, round: 'Group Stage' },
  'M320211209M2': { day: 4, round: 'Group Stage' },
  'M320211209M3': { day: 4, round: 'Group Stage' },
  'M320211209M4': { day: 4, round: 'Group Stage' },
  'M320211209M5': { day: 4, round: 'Group Stage' },
  'M320211209M6': { day: 4, round: 'Group Stage' },

  // ── Playoffs (Dec 11–18 local) ────────────────────────────────────────────
  // 16-team double-elim: 8 UB seeders, 8 LB seeders. LB R1/R2 Bo3, GF Bo7.
  // Round labels verified against Liquipedia bracket + DB teams per match code.
  // Day 1 (Dec 11): UB QF ×2
  'M320211211M1': { day: 1, round: 'UB Quarter-Final' },
  'M320211211M2': { day: 1, round: 'UB Quarter-Final' },
  // Day 2 (Dec 12): UB QF ×2 (+ M320211212M3, a duplicate RRQ–TDK game not on
  // Liquipedia — data artifact, no round label so it stays out of the bracket)
  'M320211212M1': { day: 2, round: 'UB Quarter-Final' },
  'M320211212M2': { day: 2, round: 'UB Quarter-Final' },
  'M320211212M3': { day: 2 },
  // Day 3 (Dec 13): LB R1 ×4
  'M320211213M1': { day: 3, round: 'LB Round 1' },
  'M320211213M2': { day: 3, round: 'LB Round 1' },
  'M320211213M3': { day: 3, round: 'LB Round 1' },
  'M320211213M4': { day: 3, round: 'LB Round 1' },
  // Day 4 (Dec 14): LB R2 ×4
  'M320211214M1': { day: 4, round: 'LB Round 2' },
  'M320211214M2': { day: 4, round: 'LB Round 2' },
  'M320211214M3': { day: 4, round: 'LB Round 2' },
  'M320211214M4': { day: 4, round: 'LB Round 2' },
  // Day 5 (Dec 15): LB R3 ×1 + UB SF ×1 (ONIC PH–RRQ)
  'M320211215M1': { day: 5, round: 'LB Round 3' },
  'M320211215M2': { day: 5, round: 'UB Semi-Final' },
  // Day 6 (Dec 16): LB R3 ×1 (NAVI–TDK) + UB SF ×1 (BTK–EVOS SG)
  'M320211216M1': { day: 6, round: 'LB Round 3' },
  'M320211216M2': { day: 6, round: 'UB Semi-Final' },
  // Day 7 (Dec 17): LB QF ×2 (RRQ–BLCK, EVOS SG–TDK)
  'M320211217M1': { day: 7, round: 'LB Quarter-Final' },
  'M320211217M2': { day: 7, round: 'LB Quarter-Final' },
  // Day 8 (Dec 18): UB Final (BTK–ONIC PH) + LB SF (BLCK–EVOS SG) + LB Final (BTK–BLCK)
  'M320211218M1': { day: 8, round: 'UB Final' },
  'M320211218M2': { day: 8, round: 'LB Semi-Final' },
  'M320211218M3': { day: 8, round: 'LB Final' },

  // ── Finals (Dec 19 local) ─────────────────────────────────────────────────
  'M320211219M1': { day: 1, round: 'Grand Final' },
};

const MAPS = { M1, M2, M3, M4, M5, M6, M7 };

// Return { day, round } for a match, or null if no static entry.
export function getMatchMeta(season, matchCode) {
  return MAPS[season]?.[matchCode] ?? null;
}
