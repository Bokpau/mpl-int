// Shared StatTable column definitions, used by both the per-edition main pages and
// the all-time History pages so the two never drift apart.

export const PLAYER_COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'player', type: 'player', label: 'Player', nameKey: 'player', fallbackKey: 'player_key', subKey: 'latest_team', subFallbackKey: 'latest_team_code', hrefBase: '/players/', hrefKey: 'player_key' },
  { key: 'editions', label: 'Editions', format: 'int', title: 'International editions played' },
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
  { key: 'kp', label: 'KP%', format: 'pct', nullDash: true, title: 'Kill participation' },
  { key: 'gpm', label: 'GPM', format: 'int', title: 'Gold per minute' },
  { key: 'dpm', label: 'DPM', format: 'int', title: 'Damage per minute' },
  { key: 'mvps', label: 'MVPs', format: 'int', title: 'Most Valuable Player awards' },
];

export const TEAM_COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'team', type: 'team', label: 'Team', nameKey: 'team_name', codeKey: 'team_code', fallbackKey: 'team_key', logoKey: 'team_logo_dark', hrefBase: '/teams/', hrefKey: 'team_key' },
  { key: 'editions', label: 'Editions', format: 'int', title: 'International editions played' },
  { key: 'matches', label: 'Matches', format: 'int' },
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
  { key: 'gpm', label: 'GPM', format: 'int', title: 'Gold per minute' },
  { key: 'dpm', label: 'DPM', format: 'int', title: 'Damage per minute' },
];

export const HERO_COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'hero', type: 'hero', label: 'Hero', nameKey: 'hero_name', idKey: 'hero_id' },
  { key: 'picks', label: 'Picks', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
  { key: 'players', label: 'Players', format: 'int', title: 'Distinct players who picked this hero' },
];

export const NATION_COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'country', type: 'country', label: 'Country', nameKey: 'country', codeKey: 'country_code', flagKey: 'flag_emoji' },
  { key: 'region_group', type: 'text', label: 'Region' },
  { key: 'players', label: 'Players', format: 'int' },
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
];
