'use client';

import { img, PLACEHOLDER_HERO, PLACEHOLDER_ITEM } from '../lib/images';

// Stopgap for 2 MSC 2026 players whose player_era_photo row isn't seeded yet
// (KEI, MUIMINET) but whose photo files exist on the CDN — same map the Dashboard
// uses; delete once seed_player_photos_msc2026.sql lands.
const PHOTO_FALLBACK = {
  KEI: 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/int_player/mlbb_mgz_cut_kei_f.png',
  MUIMINET: 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/int_player/mlbb_sun_muiminet_cut_f.png',
};

// Image components for the match-detail page. Ported from the PH site, but the
// hero/role/item/skill/rune assets are game-universal (same CDN), so they work
// unchanged for the international site. Player PHOTOS are PH-repo-specific and keyed
// by IGN, which doesn't cover MSC 2026 players — so PlayerAvatar shows the hero /
// an initial placeholder instead (a per-era photo can be wired in later).

function ImgWithFallback({ src, fallback, alt, style, className }) {
  return (
    <img
      src={src}
      alt={alt || ''}
      style={style}
      className={className}
      referrerPolicy="no-referrer"
      onError={(e) => { if (fallback && e.target.src !== fallback) { e.target.src = fallback; } e.target.onerror = null; }}
    />
  );
}

export function HeroImg({ heroid, size = 40, style = {}, alt }) {
  if (!heroid) return <div style={{ width: size, height: size, borderRadius: '50%', background: 'var(--surface2)', ...style }} />;
  return <ImgWithFallback src={img.hero(heroid)} fallback={PLACEHOLDER_HERO} alt={alt ?? `Hero ${heroid}`}
    style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...style }} />;
}

export function HeroBanImg({ heroid, size = 40, style = {}, alt }) {
  if (!heroid) return <div style={{ width: size, height: size, background: 'var(--surface2)', ...style }} />;
  return <ImgWithFallback src={img.heroBan(heroid)} fallback={PLACEHOLDER_HERO} alt={alt ?? `Ban ${heroid}`}
    style={{ width: size, height: size, objectFit: 'cover', ...style }} />;
}

export function TeamImg({ code, size = 32, style = {}, alt }) {
  if (!code) return <div style={{ width: size, height: size, background: 'var(--surface2)', ...style }} />;
  return <ImgWithFallback src={img.team(code)} fallback="" alt={alt ?? `Team ${code}`}
    style={{ width: size, height: size, objectFit: 'contain', ...style }} />;
}

export function RoleImg({ role, size = 20, style = {}, alt }) {
  if (!role) return null;
  return <ImgWithFallback src={img.role(role)} fallback="" alt={alt ?? role}
    style={{ width: size, height: size, objectFit: 'contain', ...style }} />;
}

export function ItemImg({ equipId, size = 28, style = {}, alt }) {
  if (!equipId) return <div style={{ width: size, height: size, background: 'var(--surface2)', ...style }} />;
  return <ImgWithFallback src={img.item(equipId)} fallback={PLACEHOLDER_ITEM} alt={alt ?? `Item ${equipId}`}
    style={{ width: size, height: size, objectFit: 'cover', ...style }} />;
}

export function SkillImg({ skillid, size = 28, style = {}, alt }) {
  if (!skillid) return null;
  return <ImgWithFallback src={img.skill(skillid)} fallback="" alt={alt ?? `Spell ${skillid}`}
    style={{ width: size, height: size, borderRadius: 4, objectFit: 'cover', ...style }} />;
}

export function RuneImg({ runeMap, size = 24, style = {}, alt }) {
  if (!runeMap) return null;
  return <ImgWithFallback src={img.rune(runeMap)} fallback="" alt={alt ?? `Rune ${runeMap}`}
    style={{ width: size, height: size, objectFit: 'contain', ...style }} />;
}

// Initials fallback when there's no photo.
export function PlayerAvatar({ name, size = 32, style = {} }) {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--surface2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-display)',
      flexShrink: 0, ...style,
    }}>{initial}</div>
  );
}

// Player's per-era photo (from the detail endpoint's photo_url), falling back to the
// CDN stopgap by IGN. The initial sits underneath and the photo overlays it, so a
// missing/broken image just hides itself (DOM onError, no setState) and the initial
// shows through — no state, so no setState-in-render churn inside dense table rows.
export function PlayerPhoto({ photoUrl, name, size = 32, style = {} }) {
  const src = photoUrl || PHOTO_FALLBACK[String(name || '').toUpperCase()];
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div style={{
      position: 'relative', width: size, height: size, borderRadius: '50%', overflow: 'hidden',
      background: 'var(--surface2)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.42, fontWeight: 700, color: 'var(--muted)', fontFamily: 'var(--font-display)', ...style,
    }}>
      {initial}
      {src && (
        <img
          src={src}
          alt={name || ''}
          referrerPolicy="no-referrer"
          onError={(e) => { e.target.style.display = 'none'; }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  );
}
