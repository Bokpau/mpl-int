// Image host. We serve the mlbb-tool repo assets through jsDelivr's CDN, NOT
// raw.githubusercontent.com: raw GitHub is not a CDN and returns HTTP 429 (rate
// limit) under load, which breaks logos/photos site-wide. jsDelivr mirrors the
// same repo files with proper CDN caching and no such throttling.
const GH_RAW = 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main';
const IMG = 'https://cdn.jsdelivr.net/gh/Bokpau/mlbb-tool@main';

// Rewrite any raw.githubusercontent mlbb-tool URL (e.g. one stored in the DB as
// team_logo_dark / photo_url) to the jsDelivr CDN, and rewrite any Liquipedia
// commons image URLs to the local repository's intl_teamlogo folder on the CDN.
export function cdnify(url) {
  if (typeof url !== 'string') return url;

  // 1. Match and rewrite raw GitHub URLs (supporting any branch or ref like main, master, etc.)
  const rawMatch = url.match(/^https:\/\/raw\.githubusercontent\.com\/Bokpau\/mlbb-tool\/[^/]+(.*)/);
  if (rawMatch) {
    return IMG + rawMatch[1];
  }

  // 2. Match and rewrite Liquipedia commons image URLs to the local repo's intl_teamlogo folder on the CDN
  const liquipediaMatch = url.match(/^https:\/\/liquipedia\.net\/commons\/images\/.*\/([^/]+)$/);
  if (liquipediaMatch) {
    return `${IMG}/intl_teamlogo/${liquipediaMatch[1]}`;
  }

  return url;
}

export const img = {
  hero: (heroId) => (heroId ? `${IMG}/hero/${heroId}_CIRCLE.png` : null),
  team: (code) => {
    if (!code) return null;
    const clean = code.toLowerCase().trim();
    if (clean === 'evos sg' || clean === 'evos singapore' || clean === 'evos esports sg') {
      return `${IMG}/intl_teamlogo/EVOS_Esports_SG_allmode.png`;
    }
    return `${IMG}/teamlogo/${clean.replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.png`;
  },
  // Game-universal assets, same CDN paths as the PH site (heroes/roles/items are
  // identity-independent). Used by the match-detail page (draft bans, player table).
  heroBan: (heroId) => (heroId ? `${IMG}/herorec/HERO_${heroId}_BAN.png` : null),
  role:    (role)   => (role   ? `${IMG}/Role/${role}.png` : null),
  item:    (equipId) => (equipId ? `${IMG}/items/${equipId}.png` : null),
  skill:   (skillId) => (skillId ? `${IMG}/SKILL/${skillId}.png` : null),
  rune:    (runeMap) => (runeMap ? `${IMG}/Rune/${runeMap}_RUNES.png` : null),
  // Map Viewer (Phase 4b): the map background canvas + generic UI icons.
  mapCanvas: (id) => (id != null ? `${IMG}/Maps/Map_${id}.png` : null),
  icon:      (name) => `${IMG}/icons/${name}.png`,
};

export const PLACEHOLDER_HERO = `${IMG}/hero/0_CIRCLE.png`;
export const PLACEHOLDER_ITEM = `${IMG}/items/0.png`;

export const CDN_BASE = IMG;

export function getTournamentLogo(season) {
  if (!season) return null;
  const clean = season.trim().toUpperCase().replace(/\s+/g, '');
  // Clean values will be: MSC2017, MSC2018, ..., MSC2026, M1, M2, M3, M4, M5, M6, M7
  if (clean.startsWith('M') && clean.length <= 3) {
    return `${IMG}/int_tournament_logo/${clean.toLowerCase()}.png`;
  }
  let file = clean;
  if (clean === 'MSC2024') {
    file = 'MCS2024'; // handle the typo in the repository
  }
  return `${IMG}/int_tournament_logo/${file}.png`;
}

