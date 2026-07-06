// Image host. We serve the mlbb-tool repo assets through jsDelivr's CDN, NOT
// raw.githubusercontent.com: raw GitHub is not a CDN and returns HTTP 429 (rate
// limit) under load, which breaks logos/photos site-wide. jsDelivr mirrors the
// same repo files with proper CDN caching and no such throttling.
const GH_RAW = 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main';
const IMG = 'https://cdn.jsdelivr.net/gh/Bokpau/mlbb-tool@main';

// Rewrite any raw.githubusercontent mlbb-tool URL (e.g. one stored in the DB as
// team_logo_dark / photo_url) to the jsDelivr CDN. Safe no-op for other URLs.
export function cdnify(url) {
  return typeof url === 'string' && url.startsWith(GH_RAW)
    ? IMG + url.slice(GH_RAW.length)
    : url;
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
