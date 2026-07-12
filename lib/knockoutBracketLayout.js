// Static per-edition knockout bracket layouts (M1–M7, MSC 2025).
//
// Slot order, top/bottom team placement, and feeder links are transcribed from
// each edition's Liquipedia bracket page and cross-checked against DB series
// data (match_code → team era codes). The DB's team_a/team_b is alphabetical,
// NOT bracket position — `top`/`bottom` here are the authoritative display order.
//
// Four bracket shapes:
//   S    — M1/M2:      4-team UB (SF start) + 6-team LB
//   L    — M5/M6/M7:  8-team UB (QF start) + LB R1/QF/SF/F
//   XL   — M3/M4:     16-team double-elim (8 UB seeds, 8 LB seeds, LB R1–R3)
//   SE   — MSC 2024:  8-team single-elim QF→SF→GF (3 columns, no 3rd place)
//   SE3P — MSC 2025:  8-team single-elim QF→SF→GF + 3rd Place (4 columns)
//
// Shape slots are ids like 'ubqf0'…'ubqf3' (round id + top-to-bottom index).
// `feeds[slotIndex] = [topFeeder, bottomFeeder]` — slot ids in an earlier
// column whose winner flows into this match (null = drop-in from the other
// bracket / no drawn connector, matching Liquipedia's line style).
// SE shape uses section:'se' (no UB/LB split). The 'third' section (SE3P only)
// has no feeds — no connector lines drawn from SF losers to the 3rd place match.

const SHAPES = {
  // SE  — MSC 2024:  8-team single-elim QF→SF→GF (3 columns)
  SE: {
    columns: [
      { se: 'qf' },
      { se: 'sf' },
      { gf: true },
    ],
    rounds: {
      qf: { label: 'Quarterfinals', section: 'se', size: 4 },
      sf: { label: 'Semifinals',   section: 'se', size: 2, feeds: [['qf0','qf1'],['qf2','qf3']] },
      gf: { label: 'Grand Final',  section: 'gf', size: 1, feeds: [['sf0','sf1']] },
    },
  },
  // SE3P — MSC 2025:  8-team single-elim QF→SF→GF + 3rd Place (4 columns)
  SE3P: {
    columns: [
      { se: 'qf'    },
      { se: 'sf'    },
      { gf: true    },
      { third: true },
    ],
    rounds: {
      qf:    { label: 'Quarterfinals',     section: 'se',    size: 4 },
      sf:    { label: 'Semifinals',        section: 'se',    size: 2, feeds: [['qf0','qf1'],['qf2','qf3']] },
      gf:    { label: 'Grand Final',       section: 'gf',    size: 1, feeds: [['sf0','sf1']] },
      third: { label: 'Third Place Match', section: 'third', size: 1 },
    },
  },
  // ── Double Elimination (M-Series) ───────────────────────────────────────────
  S: {
    columns: [
      { ub: null,   lb: 'lbr1' },
      { ub: 'ubsf', lb: 'lbqf' },
      { ub: null,   lb: 'lbsf' },
      { ub: 'ubf',  lb: 'lbf' },
      { gf: true },
    ],
    rounds: {
      ubsf: { label: 'Upper Bracket Semifinals',    section: 'ub', size: 2 },
      ubf:  { label: 'Upper Bracket Final',         section: 'ub', size: 1, feeds: [['ubsf0', 'ubsf1']] },
      lbr1: { label: 'Lower Bracket Round 1',       section: 'lb', size: 2 },
      lbqf: { label: 'Lower Bracket Quarterfinals', section: 'lb', size: 2, feeds: [[null, 'lbr10'], [null, 'lbr11']] },
      lbsf: { label: 'Lower Bracket Semifinal',     section: 'lb', size: 1, feeds: [['lbqf0', 'lbqf1']] },
      lbf:  { label: 'Lower Bracket Final',         section: 'lb', size: 1, feeds: [[null, 'lbsf0']] },
      gf:   { label: 'Grand Final',                 section: 'gf', size: 1, feeds: [['ubf0', 'lbf0']] },
    },
  },
  L: {
    columns: [
      { ub: 'ubqf', lb: 'lbr1' },
      { ub: 'ubsf', lb: 'lbqf' },
      { ub: null,   lb: 'lbsf' },
      { ub: 'ubf',  lb: 'lbf' },
      { gf: true },
    ],
    rounds: {
      ubqf: { label: 'Upper Bracket Quarterfinals', section: 'ub', size: 4 },
      ubsf: { label: 'Upper Bracket Semifinals',    section: 'ub', size: 2, feeds: [['ubqf0', 'ubqf1'], ['ubqf2', 'ubqf3']] },
      ubf:  { label: 'Upper Bracket Final',         section: 'ub', size: 1, feeds: [['ubsf0', 'ubsf1']] },
      lbr1: { label: 'Lower Bracket Round 1',       section: 'lb', size: 2 },
      lbqf: { label: 'Lower Bracket Quarterfinals', section: 'lb', size: 2, feeds: [[null, 'lbr10'], [null, 'lbr11']] },
      lbsf: { label: 'Lower Bracket Semifinal',     section: 'lb', size: 1, feeds: [['lbqf0', 'lbqf1']] },
      lbf:  { label: 'Lower Bracket Final',         section: 'lb', size: 1, feeds: [[null, 'lbsf0']] },
      gf:   { label: 'Grand Final',                 section: 'gf', size: 1, feeds: [['ubf0', 'lbf0']] },
    },
  },
  XL: {
    columns: [
      { ub: null,   lb: 'lbr1' },
      { ub: 'ubqf', lb: 'lbr2' },
      { ub: null,   lb: 'lbr3' },
      { ub: 'ubsf', lb: 'lbqf' },
      { ub: null,   lb: 'lbsf' },
      { ub: 'ubf',  lb: 'lbf' },
      { gf: true },
    ],
    rounds: {
      ubqf: { label: 'Upper Bracket Quarterfinals', section: 'ub', size: 4 },
      ubsf: { label: 'Upper Bracket Semifinals',    section: 'ub', size: 2, feeds: [['ubqf0', 'ubqf1'], ['ubqf2', 'ubqf3']] },
      ubf:  { label: 'Upper Bracket Final',         section: 'ub', size: 1, feeds: [['ubsf0', 'ubsf1']] },
      lbr1: { label: 'Lower Bracket Round 1',       section: 'lb', size: 4 },
      lbr2: { label: 'Lower Bracket Round 2',       section: 'lb', size: 4, feeds: [[null, 'lbr10'], [null, 'lbr11'], [null, 'lbr12'], [null, 'lbr13']] },
      lbr3: { label: 'Lower Bracket Round 3',       section: 'lb', size: 2, feeds: [['lbr20', 'lbr21'], ['lbr22', 'lbr23']] },
      lbqf: { label: 'Lower Bracket Quarterfinals', section: 'lb', size: 2, feeds: [[null, 'lbr30'], [null, 'lbr31']] },
      lbsf: { label: 'Lower Bracket Semifinal',     section: 'lb', size: 1, feeds: [['lbqf0', 'lbqf1']] },
      lbf:  { label: 'Lower Bracket Final',         section: 'lb', size: 1, feeds: [[null, 'lbsf0']] },
      gf:   { label: 'Grand Final',                 section: 'gf', size: 1, feeds: [['ubf0', 'lbf0']] },
    },
  },
};

// season → { shape, bo (round id → 'BoN' header suffix), slots (slot id → match) }
const LAYOUTS = {
  M1: {
    shape: 'S',
    bo: { ubsf: 'Bo3', ubf: 'Bo5', lbr1: 'Bo3', lbqf: 'Bo3', lbsf: 'Bo3', lbf: 'Bo5', gf: 'Bo7' },
    slots: {
      ubsf0: { mc: 'M120191115M1', top: 'RRQ',  bottom: 'TDK' },
      ubsf1: { mc: 'M120191115M2', top: 'BG',   bottom: 'EVOS' },
      ubf0:  { mc: 'M120191116M2', top: 'RRQ',  bottom: 'EVOS' },
      lbr10: { mc: 'M120191115M3', top: 'VEC',  bottom: 'SS' },
      lbr11: { mc: 'M120191115M4', top: 'AXIS', bottom: '10S' },
      lbqf0: { mc: 'M120191115M5', top: 'BG',   bottom: 'SS' },
      lbqf1: { mc: 'M120191116M1', top: 'TDK',  bottom: '10S' },
      lbsf0: { mc: 'M120191116M3', top: 'BG',   bottom: 'TDK' },
      lbf0:  { mc: 'M120191117M1', top: 'RRQ',  bottom: 'TDK' },
      gf0:   { mc: 'M120191117M2', top: 'EVOS', bottom: 'RRQ' },
    },
  },
  M2: {
    shape: 'S',
    bo: { ubsf: 'Bo3', ubf: 'Bo5', lbr1: 'Bo3', lbqf: 'Bo3', lbsf: 'Bo3', lbf: 'Bo5', gf: 'Bo7' },
    slots: {
      ubsf0: { mc: 'M220210122M3', top: 'BG',   bottom: 'BREN' },
      ubsf1: { mc: 'M220210122M4', top: 'OMG',  bottom: 'RRQ' },
      ubf0:  { mc: 'M220210123M3', top: 'BG',   bottom: 'RRQ' },
      lbr10: { mc: 'M220210122M1', top: '10S',  bottom: 'AE' },
      lbr11: { mc: 'M220210122M2', top: 'TDK',  bottom: 'EVOS SG' },
      lbqf0: { mc: 'M220210123M1', top: 'OMG',  bottom: 'AE' },
      lbqf1: { mc: 'M220210123M2', top: 'BREN', bottom: 'TDK' },
      lbsf0: { mc: 'M220210123M4', top: 'AE',   bottom: 'BREN' },
      lbf0:  { mc: 'M220210124M1', top: 'RRQ',  bottom: 'BREN' },
      gf0:   { mc: 'M220210124M2', top: 'BG',   bottom: 'BREN' },
    },
  },
  M3: {
    shape: 'XL',
    bo: { ubqf: 'Bo5', ubsf: 'Bo5', ubf: 'Bo5', lbr1: 'Bo3', lbr2: 'Bo3', lbr3: 'Bo5', lbqf: 'Bo5', lbsf: 'Bo5', lbf: 'Bo5', gf: 'Bo7' },
    slots: {
      ubqf0: { mc: 'M320211211M1', top: 'BLCK',    bottom: 'BTK' },
      ubqf1: { mc: 'M320211211M2', top: 'BDL',     bottom: 'EVOS SG' },
      ubqf2: { mc: 'M320211212M1', top: 'ONIC PH', bottom: 'RSG' },
      ubqf3: { mc: 'M320211212M2', top: 'RRQ',     bottom: 'TDK' },
      ubsf0: { mc: 'M320211216M2', top: 'BTK',     bottom: 'EVOS SG' },
      ubsf1: { mc: 'M320211215M2', top: 'ONIC PH', bottom: 'RRQ' },
      ubf0:  { mc: 'M320211218M1', top: 'BTK',     bottom: 'ONIC PH' },
      lbr10: { mc: 'M320211213M1', top: 'SMG',     bottom: 'ONIC' },
      lbr11: { mc: 'M320211213M2', top: 'Keyd',    bottom: 'GX' },
      lbr12: { mc: 'M320211213M3', top: 'NAVI',    bottom: 'MVG' },
      lbr13: { mc: 'M320211213M4', top: 'RED',     bottom: 'SYS' },
      lbr20: { mc: 'M320211214M1', top: 'BLCK',    bottom: 'ONIC' },
      lbr21: { mc: 'M320211214M2', top: 'BDL',     bottom: 'Keyd' },
      lbr22: { mc: 'M320211214M3', top: 'RSG',     bottom: 'NAVI' },
      lbr23: { mc: 'M320211214M4', top: 'TDK',     bottom: 'SYS' },
      lbr30: { mc: 'M320211215M1', top: 'BLCK',    bottom: 'Keyd' },
      lbr31: { mc: 'M320211216M1', top: 'NAVI',    bottom: 'TDK' },
      lbqf0: { mc: 'M320211217M1', top: 'RRQ',     bottom: 'BLCK' },
      lbqf1: { mc: 'M320211217M2', top: 'EVOS SG', bottom: 'TDK' },
      lbsf0: { mc: 'M320211218M2', top: 'BLCK',    bottom: 'EVOS SG' },
      lbf0:  { mc: 'M320211218M3', top: 'BTK',     bottom: 'BLCK' },
      gf0:   { mc: 'M320211219M1', top: 'ONIC PH', bottom: 'BLCK' },
    },
  },
  M4: {
    shape: 'XL',
    bo: { ubqf: 'Bo5', ubsf: 'Bo5', ubf: 'Bo5', lbr1: 'Bo3', lbr2: 'Bo3', lbr3: 'Bo5', lbqf: 'Bo5', lbsf: 'Bo5', lbf: 'Bo5', gf: 'Bo7' },
    slots: {
      ubqf0: { mc: 'M420230107M1', top: 'FCON',   bottom: 'ONIC' },
      ubqf1: { mc: 'M420230107M2', top: 'ECHO',   bottom: 'THQ' },
      ubqf2: { mc: 'M420230108M1', top: 'TDK',    bottom: 'RRQ' },
      ubqf3: { mc: 'M420230108M2', top: 'RRQ BR', bottom: 'BLCK' },
      ubsf0: { mc: 'M420230112M2', top: 'ONIC',   bottom: 'ECHO' },
      ubsf1: { mc: 'M420230111M2', top: 'RRQ',    bottom: 'BLCK' },
      ubf0:  { mc: 'M420230113M3', top: 'ECHO',   bottom: 'BLCK' },
      lbr10: { mc: 'M420230109M1', top: 'RSG',    bottom: 'S11' },
      lbr11: { mc: 'M420230109M2', top: 'FF',     bottom: 'MDH' },
      lbr12: { mc: 'M420230109M3', top: 'TV',     bottom: 'BXF' },
      lbr13: { mc: 'M420230109M4', top: 'MVG',    bottom: 'OPY' },
      lbr20: { mc: 'M420230110M1', top: 'FCON',   bottom: 'S11' },
      lbr21: { mc: 'M420230110M2', top: 'THQ',    bottom: 'FF' },
      lbr22: { mc: 'M420230110M3', top: 'TDK',    bottom: 'TV' },
      lbr23: { mc: 'M420230110M4', top: 'RRQ BR', bottom: 'OPY' },
      lbr30: { mc: 'M420230111M1', top: 'FCON',   bottom: 'FF' },
      lbr31: { mc: 'M420230112M1', top: 'TV',     bottom: 'RRQ BR' },
      lbqf0: { mc: 'M420230113M1', top: 'RRQ',    bottom: 'FCON' },
      lbqf1: { mc: 'M420230113M2', top: 'ONIC',   bottom: 'TV' },
      lbsf0: { mc: 'M420230114M1', top: 'RRQ',    bottom: 'ONIC' },
      lbf0:  { mc: 'M420230114M2', top: 'ECHO',   bottom: 'RRQ' },
      gf0:   { mc: 'M420230115M1', top: 'BLCK',   bottom: 'ECHO' },
    },
  },
  M5: {
    shape: 'L',
    bo: { ubqf: 'Bo5', ubsf: 'Bo5', ubf: 'Bo5', lbr1: 'Bo5', lbqf: 'Bo5', lbsf: 'Bo5', lbf: 'Bo5', gf: 'Bo7' },
    slots: {
      ubqf0: { mc: 'M520231209M1', top: 'FF',   bottom: 'DEVU' },
      ubqf1: { mc: 'M520231209M2', top: 'ONIC', bottom: 'BLCK' },
      ubqf2: { mc: 'M520231210M1', top: 'APBR', bottom: 'SYS' },
      ubqf3: { mc: 'M520231210M2', top: 'GEEK', bottom: 'BG' },
      ubsf0: { mc: 'M520231212M1', top: 'DEVU', bottom: 'ONIC' },
      ubsf1: { mc: 'M520231212M2', top: 'APBR', bottom: 'GEEK' },
      ubf0:  { mc: 'M520231216M2', top: 'ONIC', bottom: 'APBR' },
      lbr10: { mc: 'M520231211M1', top: 'FF',   bottom: 'BLCK' },
      lbr11: { mc: 'M520231211M2', top: 'SYS',  bottom: 'BG' },
      lbqf0: { mc: 'M520231215M1', top: 'GEEK', bottom: 'BLCK' },
      lbqf1: { mc: 'M520231215M2', top: 'DEVU', bottom: 'SYS' },
      lbsf0: { mc: 'M520231216M1', top: 'BLCK', bottom: 'DEVU' },
      lbf0:  { mc: 'M520231216M3', top: 'APBR', bottom: 'BLCK' },
      gf0:   { mc: 'M520231217M1', top: 'ONIC', bottom: 'APBR' },
    },
  },
  M6: {
    shape: 'L',
    bo: { ubqf: 'Bo3', ubsf: 'Bo5', ubf: 'Bo5', lbr1: 'Bo5', lbqf: 'Bo5', lbsf: 'Bo5', lbf: 'Bo5', gf: 'Bo7' },
    slots: {
      ubqf0: { mc: 'M620241207M2', top: 'FNOP', bottom: 'SRG' },
      ubqf1: { mc: 'M620241207M1', top: 'FCON', bottom: 'NPFL' },
      ubqf2: { mc: 'M620241207M3', top: 'RRQ',  bottom: 'VMS' },
      ubqf3: { mc: 'M620241207M4', top: 'TS',   bottom: 'TLID' },
      ubsf0: { mc: 'M620241208M1', top: 'FNOP', bottom: 'FCON' },
      ubsf1: { mc: 'M620241208M2', top: 'RRQ',  bottom: 'TLID' },
      ubf0:  { mc: 'M620241211M3', top: 'FNOP', bottom: 'TLID' },
      lbr10: { mc: 'M620241210M2', top: 'SRG',  bottom: 'NPFL' },
      lbr11: { mc: 'M620241210M1', top: 'VMS',  bottom: 'TS' },
      lbqf0: { mc: 'M620241211M2', top: 'RRQ',  bottom: 'SRG' },
      lbqf1: { mc: 'M620241211M1', top: 'FCON', bottom: 'TS' },
      lbsf0: { mc: 'M620241214M1', top: 'SRG',  bottom: 'TS' },
      lbf0:  { mc: 'M620241214M2', top: 'TLID', bottom: 'SRG' },
      gf0:   { mc: 'M620241215M1', top: 'FNOP', bottom: 'TLID' },
    },
  },
  M7: {
    shape: 'L',
    bo: { ubqf: 'Bo3', ubsf: 'Bo5', ubf: 'Bo5', lbr1: 'Bo5', lbqf: 'Bo5', lbsf: 'Bo5', lbf: 'Bo5', gf: 'Bo7' },
    slots: {
      ubqf0: { mc: 'M720260118M4', top: 'AE',   bottom: 'ONIC' },
      ubqf1: { mc: 'M720260118M1', top: 'TLPH', bottom: 'RORA' },
      ubqf2: { mc: 'M720260118M3', top: 'SRG',  bottom: 'TS' },
      ubqf3: { mc: 'M720260118M2', top: 'AUR',  bottom: 'YG' },
      ubsf0: { mc: 'M720260121M2', top: 'AE',   bottom: 'RORA' },
      ubsf1: { mc: 'M720260121M1', top: 'SRG',  bottom: 'AUR' },
      ubf0:  { mc: 'M720260122M3', top: 'RORA', bottom: 'SRG' },
      lbr10: { mc: 'M720260122M2', top: 'ONIC', bottom: 'TLPH' },
      lbr11: { mc: 'M720260122M1', top: 'TS',   bottom: 'YG' },
      lbqf0: { mc: 'M720260123M1', top: 'AUR',  bottom: 'TLPH' },
      lbqf1: { mc: 'M720260123M2', top: 'AE',   bottom: 'TS' },
      lbsf0: { mc: 'M720260124M1', top: 'TLPH', bottom: 'AE' },
      lbf0:  { mc: 'M720260124M2', top: 'SRG',  bottom: 'AE' },
      gf0:   { mc: 'M720260125M1', top: 'RORA', bottom: 'AE' },
    },
  },
  // ── MSC editions ───────────────────────────────────────────────────────────
  'MSC 2017': {
    shape: 'L',
    bo: { ubqf: 'Bo3', ubsf: 'Bo3', ubf: 'Bo3', lbr1: 'Bo3', lbqf: 'Bo3', lbsf: 'Bo3', lbf: 'Bo3', gf: 'Bo5' },
    // Slot order and top/bottom verified against Liquipedia bracket page.
    // GF is in the DB 'Finals' stage (merged into 'Playoffs' by tournamentFormats.js).
    slots: {
      ubqf0: { mc: 'MSC20170901M1', top: 'Team Saiyan',    bottom: 'Salty Salad'    },
      ubqf1: { mc: 'MSC20170901M2', top: 'Solid Gaming',   bottom: 'MyA Junior'     },
      ubqf2: { mc: 'MSC20170901M3', top: 'IDNS',           bottom: 'Elite8 Esports' },
      ubqf3: { mc: 'MSC20170901M4', top: 'Impunity',       bottom: 'Saints Indo'    },
      ubsf0: { mc: 'MSC20170902M3', top: 'Salty Salad',    bottom: 'Solid Gaming'   },
      ubsf1: { mc: 'MSC20170902M4', top: 'IDNS',           bottom: 'Impunity'       },
      ubf0:  { mc: 'MSC20170903M2', top: 'Salty Salad',    bottom: 'IDNS'           },
      lbr10: { mc: 'MSC20170902M1', top: 'Team Saiyan',    bottom: 'MyA Junior'     },
      lbr11: { mc: 'MSC20170902M2', top: 'Elite8 Esports', bottom: 'Saints Indo'    },
      lbqf0: { mc: 'MSC20170902M6', top: 'Impunity',       bottom: 'Team Saiyan'    },
      lbqf1: { mc: 'MSC20170902M5', top: 'Solid Gaming',   bottom: 'Saints Indo'    },
      lbsf0: { mc: 'MSC20170903M1', top: 'Impunity',       bottom: 'Solid Gaming'   },
      lbf0:  { mc: 'MSC20170903M3', top: 'IDNS',           bottom: 'Solid Gaming'   },
      gf0:   { mc: 'MSC20170903M4', top: 'Salty Salad',    bottom: 'IDNS'           },
    },
  },
  'MSC 2019': {
    shape: 'S',
    bo: { ubsf: 'Bo3', ubf: 'Bo3', lbr1: 'Bo3', lbqf: 'Bo3', lbsf: 'Bo3', lbf: 'Bo3', gf: 'Bo5' },
    // Slot order and top/bottom verified against Liquipedia bracket page.
    // GF is in the DB 'Finals' stage (merged into 'Playoffs' by tournamentFormats.js).
    slots: {
      ubsf0: { mc: 'MSC20190622M1', top: 'AA',            bottom: 'Louvre Esports' },
      ubsf1: { mc: 'MSC20190622M2', top: 'IDNS',          bottom: 'ONIC'           },
      ubf0:  { mc: 'MSC20190623M2', top: 'Louvre Esports', bottom: 'ONIC'          },
      lbr10: { mc: 'MSC20190622M3', top: 'GEEK',          bottom: 'EVOS SG'        },
      lbr11: { mc: 'MSC20190622M4', top: 'OverClockers',  bottom: 'BREN'           },
      lbqf0: { mc: 'MSC20190622M5', top: 'AA',            bottom: 'EVOS SG'        },
      lbqf1: { mc: 'MSC20190622M6', top: 'IDNS',          bottom: 'OverClockers'   },
      lbsf0: { mc: 'MSC20190623M1', top: 'AA',            bottom: 'OverClockers'   },
      lbf0:  { mc: 'MSC20190624M1', top: 'Louvre Esports', bottom: 'AA'            },
      gf0:   { mc: 'MSC20190624M2', top: 'ONIC',          bottom: 'Louvre Esports' },
    },
  },
  'MSC 2021': {
    shape: 'S',
    bo: { ubsf: 'Bo3', ubf: 'Bo5', lbr1: 'Bo3', lbqf: 'Bo3', lbsf: 'Bo3', lbf: 'Bo5', gf: 'Bo7' },
    // Slot order and top/bottom verified against Liquipedia bracket page.
    // GF is in the DB 'Finals' stage (merged into 'Playoffs' by tournamentFormats.js).
    slots: {
      ubsf0: { mc: 'MSC20210611M3', top: 'RSG MY', bottom: 'BLCK' },
      ubsf1: { mc: 'MSC20210611M4', top: 'EVOS',   bottom: 'EXE'  },
      ubf0:  { mc: 'MSC20210612M3', top: 'BLCK',   bottom: 'EVOS' },
      lbr10: { mc: 'MSC20210611M1', top: 'BTR',    bottom: 'TDK'  },
      lbr11: { mc: 'MSC20210611M2', top: 'IMP',    bottom: 'EVOS SG' },
      lbqf0: { mc: 'MSC20210612M1', top: 'RSG MY', bottom: 'BTR'  },
      lbqf1: { mc: 'MSC20210612M2', top: 'EXE',    bottom: 'IMP'  },
      lbsf0: { mc: 'MSC20210612M4', top: 'RSG MY', bottom: 'EXE'  },
      lbf0:  { mc: 'MSC20210613M1', top: 'EVOS',   bottom: 'EXE'  },
      gf0:   { mc: 'MSC20210613M2', top: 'BLCK',   bottom: 'EXE'  },
    },
  },
  'MSC 2022': {
    shape: 'L',
    bo: { ubqf: 'Bo3', ubsf: 'Bo5', ubf: 'Bo5', lbr1: 'Bo5', lbqf: 'Bo5', lbsf: 'Bo5', lbf: 'Bo5', gf: 'Bo7' },
    // Slot order and top/bottom verified against Liquipedia bracket page.
    // GF is in the DB 'Finals' stage (merged into 'Playoffs' by tournamentFormats.js).
    slots: {
      ubqf0: { mc: 'MSC20220614M1', top: 'RSG PH',  bottom: 'FCON'    },
      ubqf1: { mc: 'MSC20220614M2', top: 'RSG',     bottom: 'OE'      },
      ubqf2: { mc: 'MSC20220614M3', top: 'TDK',     bottom: 'OMG'     },
      ubqf3: { mc: 'MSC20220614M4', top: 'EVOS SG', bottom: 'RRQ'     },
      ubsf0: { mc: 'MSC20220616M8', top: 'RSG PH',  bottom: 'OE'      },
      ubsf1: { mc: 'MSC20220615M6', top: 'TDK',     bottom: 'RRQ'     },
      ubf0:  { mc: 'MSC20220618M11', top: 'RSG PH', bottom: 'RRQ'     },
      lbr10: { mc: 'MSC20220615M5', top: 'FCON',    bottom: 'RSG'     },
      lbr11: { mc: 'MSC20220616M7', top: 'OMG',     bottom: 'EVOS SG' },
      lbqf0: { mc: 'MSC20220617M9', top: 'TDK',     bottom: 'FCON'    },
      lbqf1: { mc: 'MSC20220617M10', top: 'OE',     bottom: 'OMG'     },
      lbsf0: { mc: 'MSC20220618M12', top: 'FCON',   bottom: 'OMG'     },
      lbf0:  { mc: 'MSC20220618M13', top: 'RSG PH', bottom: 'OMG'     },
      gf0:   { mc: 'MSC20220619M14', top: 'RRQ',    bottom: 'RSG PH'  },
    },
  },
  'MSC 2023': {
    shape: 'SE3P',
    bo: { qf: 'Bo5', sf: 'Bo5', gf: 'Bo7', third: 'Bo5' },
    // Slot order and top/bottom verified against Liquipedia bracket page.
    // DB stage is 'Playoffs' (GF is 'Finals', merged into Playoffs by tournamentFormats.js).
    slots: {
      qf0:    { mc: 'MSC20230615M1', top: 'RSG',  bottom: 'BXF'  },
      qf1:    { mc: 'MSC20230615M2', top: 'BLCK', bottom: 'FF'   },
      qf2:    { mc: 'MSC20230616M1', top: 'ECHO', bottom: 'TDK'  },
      qf3:    { mc: 'MSC20230616M2', top: 'ONIC', bottom: 'EVOS' },
      sf0:    { mc: 'MSC20230617M1', top: 'BXF',  bottom: 'BLCK' },
      sf1:    { mc: 'MSC20230617M2', top: 'ECHO', bottom: 'ONIC' },
      gf0:    { mc: 'MSC20230618M1', top: 'BLCK', bottom: 'ONIC' },
      third0: { mc: 'MSC20230617M3', top: 'BXF',  bottom: 'ECHO' },
    },
  },
  'MSC 2024': {
    shape: 'SE',
    bo: { qf: 'Bo5', sf: 'Bo5', gf: 'Bo7' },
    // Slot order and top/bottom verified against Liquipedia bracket page.
    // GF is in the DB 'Finals' stage (merged into 'Knockout' by tournamentFormats.js).
    slots: {
      qf0: { mc: 'MSC20240710M1', top: 'TLPH', bottom: 'FCON'  },
      qf1: { mc: 'MSC20240711M1', top: 'FCAP', bottom: 'SYS'   },
      qf2: { mc: 'MSC20240710M2', top: 'SRG',  bottom: 'FF'    },
      qf3: { mc: 'MSC20240711M2', top: 'HB',   bottom: 'NPFL'  },
      sf0: { mc: 'MSC20240712M1', top: 'TLPH', bottom: 'FCAP'  },
      sf1: { mc: 'MSC20240713M1', top: 'SRG',  bottom: 'NPFL'  },
      gf0: { mc: 'MSC20240714M1', top: 'FCAP', bottom: 'SRG'   },
    },
  },
  'MSC 2025': {
    shape: 'SE3P',
    bo: { qf: 'Bo5', sf: 'Bo5', gf: 'Bo7', third: 'Bo5' },
    // Slot order and top/bottom verified against Liquipedia bracket page.
    // Era codes come from team_a_era / team_b_era in the DB API response.
    slots: {
      qf0:    { mc: 'MSC20250730M1', top: 'TLPH',    bottom: 'AUR'     },
      qf1:    { mc: 'MSC20250730M2', top: 'ONIC',    bottom: 'MYTH'    },
      qf2:    { mc: 'MSC20250731M1', top: 'RRQ',     bottom: 'SRG OG'  },
      qf3:    { mc: 'MSC20250731M2', top: 'ONIC PH', bottom: 'TS'      },
      sf0:    { mc: 'MSC20250801M2', top: 'TLPH',    bottom: 'ONIC'    },
      sf1:    { mc: 'MSC20250801M1', top: 'SRG OG',  bottom: 'ONIC PH' },
      gf0:    { mc: 'MSC20250802M2', top: 'TLPH',    bottom: 'SRG OG'  },
      third0: { mc: 'MSC20250802M1', top: 'ONIC',    bottom: 'ONIC PH' },
    },
  },
};

// Return { shape: <resolved shape object>, bo, slots } for a season, or null.
export function getKnockoutLayout(season) {
  const l = LAYOUTS[season];
  return l ? { ...l, shape: SHAPES[l.shape] } : null;
}
