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
};
