// Public image CDN shared with the PH site (raw GitHub). Plain <img> tags use
// these, so no next.config image-domain wiring is needed for the skeleton.
const IMG = 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main';

export const img = {
  hero: (heroId) => (heroId ? `${IMG}/hero/${heroId}_CIRCLE.png` : null),
  team: (code) =>
    code
      ? `${IMG}/teamlogo/${code.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')}.png`
      : null,
};
