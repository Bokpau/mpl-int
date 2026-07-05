// Public image CDN shared with the PH site (raw GitHub). Plain <img> tags use
// these, so no next.config image-domain wiring is needed for the skeleton.
const IMG = 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main';

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
};

export const PLACEHOLDER_HERO = `${IMG}/hero/0_CIRCLE.png`;
export const PLACEHOLDER_ITEM = `${IMG}/items/0.png`;
