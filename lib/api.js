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
  leaderboard: (q = '')     => get(`/api/intl/leaderboard${q}`),
  player:      (key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}${q}`),
  playerCareer:   (key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/career${q}`),
  playerSeasons:  (key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/seasons${q}`),
  playerHeroes:   (key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/heroes${q}`),
  playerVsTeams:  (key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/vs-teams${q}`),
  playerVsNations:(key, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/vs-nations${q}`),
  playerCompare:  (key, other, q = '') => get(`/api/intl/players/${encodeURIComponent(key)}/compare/${encodeURIComponent(other)}${q}`),
  teams:       (q = '')     => get(`/api/intl/teams${q}`),
  team:        (key, q = '') => get(`/api/intl/teams/${encodeURIComponent(key)}${q}`),
  heroes:      (q = '')     => get(`/api/intl/heroes${q}`),
  nations:     (q = '')     => get(`/api/intl/nations${q}`),
  regions:     (q = '')     => get(`/api/intl/regions${q}`),
  matches:     (q = '')     => get(`/api/intl/matches${q}`),
  records:     (q = '')     => get(`/api/intl/records${q}`),
};
