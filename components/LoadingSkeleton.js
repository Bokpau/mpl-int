/** Skeleton loading components for progressive content display */

export function SkeletonBlock({ height = 20, width = '100%', style = {} }) {
  return (
    <div
      className="skeleton"
      style={{ height, width, borderRadius: 2, ...style }}
    />
  );
}

export function SkeletonCard({ height = 120 }) {
  return (
    <div
      className="skeleton"
      style={{ height, borderRadius: 0, border: '1px solid var(--border)' }}
    />
  );
}

export function SkeletonRow({ cols = 6 }) {
  return (
    <div style={{
      display: 'flex',
      gap: 12,
      padding: '11px 14px',
      borderBottom: '1px solid rgba(30,30,58,0.5)',
      alignItems: 'center',
    }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 14, flex: i === 0 ? 2 : 1, borderRadius: 2 }}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 8, cols = 6 }) {
  return (
    <div style={{ border: '1px solid var(--border)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        gap: 12,
        padding: '10px 14px',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(15,15,26,0.6)',
      }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton" style={{ height: 10, flex: i === 0 ? 2 : 1, borderRadius: 2 }} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </div>
  );
}

export function SkeletonHeroGrid({ count = 20 }) {
  return (
    <div className="hero-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            aspectRatio: '1 / 1.3',
            border: '1px solid var(--border2)',
          }}
        />
      ))}
    </div>
  );
}

export function SkeletonStatCards({ count = 5 }) {
  return (
    <div className="quick-stats">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ height: 88, border: '1px solid var(--border2)' }}
        />
      ))}
    </div>
  );
}
