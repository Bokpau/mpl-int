// Server-side intl API client. Mirrors the PH site's lib/api.js: on the server it
// calls the shared backend proxy directly with the internal x-api-key header; that
// header (and BACKEND_URL / INTERNAL_API_KEY) are server-only env vars, so the key
// never reaches the browser. Client components should fetch via /api/* (the proxy
// route) instead, which attaches the key on the server.
const isServer = typeof window === 'undefined';
const API = isServer
  ? (process.env.BACKEND_URL || 'https://mpl-ph-s17-backend.onrender.com')
  : '';

async function get(path) {
  const headers = isServer && process.env.INTERNAL_API_KEY
    ? { 'x-api-key': process.env.INTERNAL_API_KEY }
    : {};
  const res = await fetch(`${API}${path}`, { next: { revalidate: 300 }, headers });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  editions:    ()           => get('/api/intl/editions'),
  accolades:   (q = '')     => get(`/api/intl/accolades${q}`),
  overview:    ()           => get('/api/intl/overview'),
  leaderboard: (q = '', heroid = null) =>
    get(`/api/intl/leaderboard${q}${heroid != null ? `${q ? '&' : '?'}hero=${encodeURIComponent(heroid)}` : ''}`),
  player:      (key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}${q}`),
  playerCareer:   (key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/career${q}`),
  playerSeasons:  (key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/seasons${q}`),
  playerHeroes:   (key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/heroes${q}`),
  playerVsTeams:  (key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/vs-teams${q}`),
  playerVsNations:(key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/vs-nations${q}`),
  playerCompare:  (key, other, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/compare/${encodeURIComponent(other)}${q}`),
  // Current-tournament rich dashboard (MSC/MWC live editions). See backend
  // /api/intl/current/* — the roster + player detail resolve player_key -> roleid;
  // the roster/roles endpoints key on roleid.
  currentRoster:      (q = '')            => get(`/api/intl/current/roster${q}`),
  currentPlayer:      (key, q = '')       => get(`/api/intl/current/players/${encodeURIComponent(key)}${q}`),
  currentRoleHeroes:  (roleid, q = '')    => get(`/api/intl/current/roles/${encodeURIComponent(roleid)}/heroes${q}`),
  currentRoleVsTeams: (roleid, q = '')    => get(`/api/intl/current/roles/${encodeURIComponent(roleid)}/vs-teams${q}`),
  currentRoleWinLoss: (roleid, q = '')    => get(`/api/intl/current/roles/${encodeURIComponent(roleid)}/win-loss${q}`),
  patches:            ()                  => get('/api/intl/patches'),
  teams:       (q = '')     => get(`/api/intl/teams${q}`),
  // Era-name roster straight from team_era_name — includes teams that haven't
  // played yet (unlike the stats-driven /teams), so the bracket can show correct
  // era logos/flags pre-tournament. Keyed by era_code.
  eraTeams:    (q = '')     => get(`/api/intl/era-teams${q}`),
  team:        (key, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}${q}`),
  teamDraft:   (key, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/draft${q}`),
  teamDraftPickSlots: (key, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/draft/pick-slots${q}`),
  teamDraftHistory: (key, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/draft/history${q}`),
  teamDraftSynergy: (key, heroid, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/draft/hero-synergy/${encodeURIComponent(heroid)}${q}`),
  teamDraftPatches: (key, heroid, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/draft/hero-patches/${encodeURIComponent(heroid)}${q}`),
  teamDraftMatchup: (key, heroid, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/draft/role-matchup/${encodeURIComponent(heroid)}${q}`),
  // Team Data Analytics (Current dashboard) — rich-data only (MSC 2026 onward);
  // return empty shapes for box-score-only editions or before rich rows land.
  teamStatsTimeline:   (key, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/stats-timeline${q}`),
  teamObjectiveTiming: (key, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/objective-timing${q}`),
  teamAnalyticsStats:  (key, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/analytics-stats${q}`),
  teamVsOpponents:     (key, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/vs-opponents${q}`),
  teamKdaDistribution: (key, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}/kda-distribution${q}`),
  heroes:      (q = '')     => get(`/api/intl/heroes${q}`),
  heroOverview: (heroid, q = '') => get(`/api/intl/heroes/${encodeURIComponent(heroid)}/overview${q}`),
  heroSynergy:  (heroid, q = '') => get(`/api/intl/heroes/${encodeURIComponent(heroid)}/synergy${q}`),
  heroVsTeams:  (heroid, q = '') => get(`/api/intl/heroes/${encodeURIComponent(heroid)}/vs-teams${q}`),
  heroWinLoss:  (heroid, q = '') => get(`/api/intl/heroes/${encodeURIComponent(heroid)}/win-loss${q}`),
  // Rich-data only (MSC 2026 onward) — naturally return empty arrays/zero
  // counts for editions that were box-score-only CSV imports.
  heroRoles:    (heroid)         => get(`/api/intl/heroes/${encodeURIComponent(heroid)}/roles`),
  heroBans:     (heroid)         => get(`/api/intl/heroes/${encodeURIComponent(heroid)}/bans`),
  // Rich-data only (MSC 2026 onward) — Dashboard's Most Banned / Top Picks by
  // Role. Naturally empty for editions with no rich rows.
  heroBansSummary: (q = '') => get(`/api/intl/heroes/bans-summary${q}`),
  heroesByRole:    (q = '') => get(`/api/intl/heroes/by-role${q}`),
  nations:     (q = '')     => get(`/api/intl/nations${q}`),
  regions:     (q = '')     => get(`/api/intl/regions${q}`),
  matches:     (q = '')     => get(`/api/intl/matches${q}`),
  match:       (battleId)   => get(`/api/intl/matches/${encodeURIComponent(battleId)}`),
  // Pre-aggregated RoleDiffChart series (raw snapshots + rollup stay server-side).
  matchRoleDiff: (battleId) => get(`/api/intl/matches/${encodeURIComponent(battleId)}/role-diff`),
  schedule:    (q = '')     => get(`/api/intl/schedule${q}`),
  records:     (q = '')     => get(`/api/intl/records${q}`),
};
