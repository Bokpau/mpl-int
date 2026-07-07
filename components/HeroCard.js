'use client';
import { img } from '../lib/images';
import { RoleImg } from './Images';

function getWrColor(wr) {
  if (wr >= 55) return 'var(--win)';
  if (wr >= 45) return 'var(--muted)';
  return 'var(--loss)';
}

function getTier(wr, games) {
  if (games < 3) return null;
  if (wr >= 65) return { label: 'S', cls: 'tier-s' };
  if (wr >= 55) return { label: 'A', cls: 'tier-a' };
  if (wr >= 45) return { label: 'B', cls: 'tier-b' };
  if (wr >= 35) return { label: 'C', cls: 'tier-c' };
  return { label: 'D', cls: 'tier-d' };
}

export default function HeroCard({ hero, rank, onClick }) {
  const winPct = parseFloat(hero.win_pct || hero.win_rate) || 0;
  const games  = parseInt(hero.games || hero.picks) || 0;
  const role   = hero.primary_role || '';
  const wrColor   = getWrColor(winPct);
  const tier      = getTier(winPct, games);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onClick) onClick();
    }
  };

  return (
    <div
      className="hero-card"
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      title={`${hero.hero_name} — ${winPct}% WR (${games} GP)`}
    >
      {/* Portrait */}
      <div className="hero-card-portrait">
        {hero.heroid && (
          <img
            src={img.hero(hero.heroid)}
            alt={hero.hero_name || ''}
            onError={e => { e.target.style.opacity = '0'; e.target.onerror = null; }}
          />
        )}

        {/* Role badge — icon only */}
        {role && (
          <span className="hero-card-role-badge" title={role} aria-label={role}>
            <RoleImg role={role} size={14} />
          </span>
        )}

        {/* Rank badge */}
        {rank && rank <= 30 && (
          <span className="hero-card-rank-badge">#{rank}</span>
        )}

        {/* Tier pill */}
        {tier && (
          <span style={{
            position: 'absolute',
            bottom: 6, right: 6,
            fontFamily: 'var(--font-display)',
            fontSize: 11,
            padding: '1px 5px',
            background: 'rgba(15,15,26,0.85)',
            border: `1px solid currentColor`,
            zIndex: 2,
          }} className={tier.cls}>
            {tier.label}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="hero-card-info">
        <div className="hero-card-name">{hero.hero_name}</div>
        <div className="hero-card-meta">
          <span style={{ color: wrColor, fontWeight: 700 }}>{winPct}% WR</span>
          <span>{games} GP</span>
        </div>
      </div>
    </div>
  );
}
