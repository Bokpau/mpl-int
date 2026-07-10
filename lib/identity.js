// ── MANDATORY identity resolver ─────────────────────────────────────────────
// Single source of truth for which Team code / name / logo a row should display,
// given the page context. This exists to make the Current-vs-History rules
// (plans/current-vs-history-rules.md) enforceable instead of ad-hoc.
//
// THE RULE (do not bypass):
//   • Current + season-filtered pages -> ERA fields (team_code_era / *_name_era).
//     A franchise code (e.g. PH "FLCN") must NEVER appear here — it must be the
//     edition's era code ("FLCM").
//   • All-Time / cross-edition aggregate -> franchise fields (team_code / team_name).
//
// Never read `latest_team_code` / `team_code` directly in a component. Route every
// team render through resolveTeam() (rendering) or teamFieldKeys() (StatTable column
// configs) so the era-vs-franchise choice lives in exactly one place.
import { img } from './images';

// The two row shapes that carry a team. Player rows (leaderboard / career totals)
// prefix with `latest_team_`; team rows (teams / standings) use `team_`.
const PLAYER_ROW = {
  eraCode: 'latest_team_code_era', eraName: 'latest_team_name_era',
  code: 'latest_team_code',        name: 'latest_team',
  logo: 'team_logo_dark',          keyFallback: 'team_key',
};
const TEAM_ROW = {
  eraCode: 'team_code_era', eraName: 'team_name_era',
  code: 'team_code',        name: 'team_name',
  logo: 'team_logo_dark',   keyFallback: 'team_key',
};

// Normalize a page's (context, eff) into the display mode.
//   context === 'current'  -> 'current' (locked live edition)
//   a specific season set  -> 'season'  (era-correct for that edition)
//   otherwise              -> 'alltime' (cross-edition franchise aggregate)
export function identityMode(context, eff) {
  if (context === 'current') return 'current';
  if (eff && eff.season) return 'season';
  return 'alltime';
}

// Era codes/names apply to a specific edition; franchise applies to aggregates.
export const isEraMode = (mode) => mode === 'current' || mode === 'season';

// Pick the field set from the row's own shape (player rows expose latest_team_*).
function fieldSet(row) {
  const r = row || {};
  return ('latest_team_code' in r || 'latest_team_code_era' in r) ? PLAYER_ROW : TEAM_ROW;
}

// Resolve the team a row should display in the given mode.
// Returns { code, name, logo, fallbackLogo } — `logo` is the DB era logo with a CDN
// fallback baked in; `fallbackLogo` is the CDN-by-code logo for <TeamLogo> error handling.
export function resolveTeam(row, mode) {
  if (!row) return { code: '', name: '', logo: null, fallbackLogo: null };
  const F = fieldSet(row);
  const era = isEraMode(mode);
  const code = (era ? row[F.eraCode] : row[F.code]) || row[F.code] || row[F.keyFallback] || '';
  const name = (era ? row[F.eraName] : row[F.name]) || row[F.name] || code;
  const cdn = img.team(code);
  return { code, name, logo: row[F.logo] || cdn, fallbackLogo: cdn };
}

// Resolve the player NAME a row should display in the given mode (rules §4):
//   current        -> era IGN (backend `player` on current surfaces is era-correct)
//   season history -> "ERA_IGN (Global)" when they differ — e.g. "FULLCLIP (Kairi)"
//   alltime        -> latest global display name
// Row fields: `player_name` = era IGN; `current_player` = global display name;
// `player` = whichever the endpoint corrected to (era on leaderboards, global on
// career totals) — used only as fallback. Photo stays on <PlayerPhoto> (initials
// fallback, never a team logo).
export function resolvePlayer(row, mode) {
  if (!row) return { name: '', eraName: '', globalName: '' };
  const eraIgn = row.player_name || row.player || '';
  const global = row.current_player || row.player || eraIgn;
  if (mode === 'current') return { name: eraIgn || global, eraName: eraIgn, globalName: global };
  if (mode === 'season') {
    const differ = eraIgn && global && eraIgn.toLowerCase() !== global.toLowerCase();
    return { name: differ ? `${eraIgn} (${global})` : (eraIgn || global), eraName: eraIgn, globalName: global };
  }
  return { name: global, eraName: eraIgn, globalName: global };
}

// Field keys for a StatTable 'team' column in the given mode. Shape is 'team' (team
// rows) or 'player' (leaderboard rows). Callers keep their own fallbackKey (team_key).
export function teamFieldKeys(mode, shape = 'team') {
  const F = shape === 'player' ? PLAYER_ROW : TEAM_ROW;
  const era = isEraMode(mode);
  return { codeKey: era ? F.eraCode : F.code, nameKey: era ? F.eraName : F.name, logoKey: F.logo };
}
