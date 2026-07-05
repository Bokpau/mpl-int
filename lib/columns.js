// Shared StatTable column definitions, used by both the per-edition main pages and
// the all-time History pages so the two never drift apart.
//
// Columns marked with a `group` are toggleable in the StatTable header; columns
// WITHOUT a group are always visible (identity + the core record). Each table also
// exports a *_GROUPS list giving the toggle order, labels and which start visible.
// Keys here must match the aliases returned by the matching /api/intl/* endpoint.

// Column group toggle order + labels (shared shape across all four tables).
const GROUP = {
  record:     { key: 'record',     label: 'Record',     default: true },
  combat:     { key: 'combat',     label: 'Combat',     default: true },
  damage:     { key: 'damage',     label: 'Damage',     default: false },
  objectives: { key: 'objectives', label: 'Objectives', default: false },
  milestones: { key: 'milestones', label: 'Milestones', default: false },
  totals:     { key: 'totals',     label: 'Totals',     default: false },
  lastUsed:   { key: 'lastUsed',   label: 'Last Used',   default: false },
};

// Match-level record (distinct from the game-level games/wins/win% in the base).
const RECORD = [
  { key: 'matches',        label: 'Match',  format: 'int', group: 'record', title: 'Matches played' },
  { key: 'match_wins',     label: 'MW',     format: 'int', group: 'record', title: 'Match wins' },
  { key: 'match_win_rate', label: 'M Win%', format: 'pct', group: 'record', wr: true, nullDash: true, title: 'Match win rate' },
];

// ── Reusable numeric column blocks (identical math across all four tables) ──────
const COMBAT_AVG = [
  { key: 'avg_kills',   label: 'K',   format: 'dec', group: 'combat', title: 'Avg kills per game' },
  { key: 'avg_deaths',  label: 'D',   format: 'dec', group: 'combat', title: 'Avg deaths per game', cls: 'sub' },
  { key: 'avg_assists', label: 'A',   format: 'dec', group: 'combat', title: 'Avg assists per game' },
  { key: 'gpm',         label: 'GPM', format: 'int', group: 'combat', title: 'Gold per minute' },
  { key: 'dpm',         label: 'DPM', format: 'int', group: 'combat', title: 'Damage per minute' },
  { key: 'dtpm',        label: 'DTPM', format: 'int', group: 'combat', title: 'Damage taken per minute' },
];

const DAMAGE = [
  { key: 'avg_damage',        label: 'Avg Dmg',  format: 'int', group: 'damage', title: 'Avg hero damage per game' },
  { key: 'avg_damage_taken',  label: 'Dmg Tkn',  format: 'int', group: 'damage', title: 'Avg damage taken per game' },
  { key: 'avg_turret_damage', label: 'Trt Dmg',  format: 'int', group: 'damage', title: 'Avg turret damage per game' },
  { key: 'turret_dpm',        label: 'TrtDPM',   format: 'int', group: 'damage', title: 'Turret damage per minute' },
];

const OBJECTIVES = [
  { key: 'avg_turtles',    label: 'Turtles', format: 'dec', group: 'objectives', title: 'Avg turtles per game' },
  { key: 'avg_lords',      label: 'Lords',   format: 'dec', group: 'objectives', title: 'Avg lords per game' },
  { key: 'avg_turrets',    label: 'Turrets', format: 'dec', group: 'objectives', title: 'Avg turrets destroyed per game' },
  { key: 'turtle_pct',     label: 'Turtle%', format: 'pct', group: 'objectives', nullDash: true, title: 'Turtle control % (turtles ÷ 3)' },
  { key: 'lord_pct',       label: 'Lord%',   format: 'pct', group: 'objectives', nullDash: true, title: 'Lord control % (share of game lords)' },
  { key: 'turret_pct',     label: 'Trt%',    format: 'pct', group: 'objectives', nullDash: true, title: 'Turret destroyed % (turrets ÷ 9)' },
  { key: 'first_blood_pct', label: 'FB%',    format: 'pct', group: 'objectives', nullDash: true, title: 'First blood %' },
];

const MILESTONES = [
  { key: 'mvps',    label: 'MVPs',    format: 'int', group: 'milestones', title: 'Most Valuable Player awards' },
  { key: 'savages', label: 'Savages', format: 'int', group: 'milestones', title: 'Total savages' },
  { key: 'maniacs', label: 'Maniacs', format: 'int', group: 'milestones', title: 'Total maniacs' },
];

const TOTALS = [
  { key: 'total_kills',         label: 'T.K',      format: 'int', group: 'totals', title: 'Total kills' },
  { key: 'total_deaths',        label: 'T.D',      format: 'int', group: 'totals', title: 'Total deaths', cls: 'sub' },
  { key: 'total_assists',       label: 'T.A',      format: 'int', group: 'totals', title: 'Total assists' },
  { key: 'total_gold',          label: 'T.Gold',   format: 'int', group: 'totals', title: 'Total gold' },
  { key: 'total_damage',        label: 'T.Dmg',    format: 'int', group: 'totals', title: 'Total hero damage' },
  { key: 'total_damage_taken',  label: 'T.DmgTkn', format: 'int', group: 'totals', title: 'Total damage taken' },
  { key: 'total_turret_damage', label: 'T.TrtDmg', format: 'int', group: 'totals', title: 'Total turret damage' },
  { key: 'total_turtles',       label: 'T.Trtl',   format: 'int', group: 'totals', title: 'Total turtles' },
  { key: 'total_lords',         label: 'T.Lord',   format: 'int', group: 'totals', title: 'Total lords' },
  { key: 'total_turrets',       label: 'T.Trt',    format: 'int', group: 'totals', title: 'Total turrets destroyed' },
];

export const STAT_GROUPS = [GROUP.record, GROUP.combat, GROUP.damage, GROUP.objectives, GROUP.milestones, GROUP.totals, GROUP.lastUsed];

export const PLAYER_COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'player', type: 'player', label: 'Player', nameKey: 'player', fallbackKey: 'player_key', subKey: 'latest_team', subFallbackKey: 'latest_team_code', photoKey: 'photo_url', hrefBase: '/players/', hrefKey: 'player_key' },
  { key: 'role_lane', type: 'role', label: 'Role' },
  { key: 'country', type: 'country', label: 'Country', nameKey: 'country', codeKey: 'nationality', flagKey: 'country_flag' },
  { key: 'editions', label: 'Editions', format: 'int', title: 'International editions played' },
  ...RECORD,
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
  { key: 'kp', label: 'KP%', format: 'pct', group: 'combat', nullDash: true, title: 'Kill participation' },
  ...COMBAT_AVG,
  ...DAMAGE,
  ...OBJECTIVES,
  ...MILESTONES,
  ...TOTALS,
];

export const CURRENT_PLAYER_COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'player', type: 'player', label: 'Player', nameKey: 'player', fallbackKey: 'player_key', photoKey: 'photo_url', hrefBase: '/players/', hrefKey: 'player_key' },
  { key: 'role_lane', type: 'role', label: 'Role' },
  { key: 'team', type: 'team', label: 'Team', codeKey: 'latest_team_code', nameKey: 'latest_team', logoKey: 'team_logo_dark', flagKey: 'team_country_flag', hrefBase: '/teams/', hrefKey: 'team_key' },
  ...RECORD,
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
  { key: 'kp', label: 'KP%', format: 'pct', group: 'combat', nullDash: true, title: 'Kill participation' },
  ...COMBAT_AVG,
  ...DAMAGE,
  ...OBJECTIVES,
  ...MILESTONES,
  ...TOTALS,
];

export const TEAM_COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'team', type: 'team', label: 'Team', nameKey: 'team_name', codeKey: 'team_code', fallbackKey: 'team_key', logoKey: 'team_logo_dark', hrefBase: '/teams/', hrefKey: 'team_key' },
  { key: 'country', type: 'country', label: 'Country', nameKey: 'country', codeKey: 'country_code', flagKey: 'country_flag' },
  { key: 'editions', label: 'Editions', format: 'int', title: 'International editions played' },
  ...RECORD,
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
  ...COMBAT_AVG,
  ...DAMAGE,
  ...OBJECTIVES,
  ...MILESTONES,
  ...TOTALS,
];

export const HERO_COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'hero', type: 'hero', label: 'Hero', nameKey: 'hero_name', idKey: 'hero_id' },
  { key: 'picks', label: 'Picks', format: 'int', group: 'record', title: 'Total picks' },
  { key: 'wins', label: 'Wins', format: 'int', group: 'record', title: 'Total wins' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, nullDash: true, title: 'Win rate', group: 'record' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', nullDash: true, title: '(Kills + Assists) / Deaths' },
  { key: 'players', label: 'Players', format: 'int', title: 'Distinct players who picked this hero' },
  ...COMBAT_AVG,
  ...DAMAGE,
  ...OBJECTIVES,
  ...MILESTONES,
  ...TOTALS,
  { key: 'last_used', type: 'last_used', label: 'Last Used', group: 'lastUsed', sortable: true, title: 'Date of last pick' },
  { key: 'days_since_last_used', label: 'Days Ago', format: 'int', group: 'lastUsed', sortable: true, nullDash: true, title: 'Days since last pick' },
];

export const NATION_COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'country', type: 'country', label: 'Country', nameKey: 'country', codeKey: 'country_code', flagKey: 'flag_emoji' },
  { key: 'region_group', type: 'text', label: 'Region' },
  { key: 'players', label: 'Players', format: 'int' },
  ...RECORD,
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
  ...COMBAT_AVG,
  ...DAMAGE,
  ...OBJECTIVES,
  ...MILESTONES,
  ...TOTALS,
];
