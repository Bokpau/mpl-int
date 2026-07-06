'use client';
import { useState } from 'react';
import { RoleImg, TeamImg } from './Images';

const ROLES = ['EXP LANE', 'JUNGLE', 'MID LANE', 'ROAM', 'GOLD LANE'];
const WEEKS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

// Shared helpers — mirrors logic in stats/page.js and rankings/page.js
export function filterLabelStr(phase, segment, week, rangeFrom, rangeTo, dateFrom, dateTo) {
  const parts = [];
  if (phase !== 'overall')     parts.push(phase);
  if (segment === 'exact')      parts.push(`Week ${week}`);
  if (segment === 'range')      parts.push(`Week ${rangeFrom}–${rangeTo}`);
  if (segment === 'date_range' && dateFrom && dateTo) parts.push(`${dateFrom} – ${dateTo}`);
  return parts.length ? parts.join(' · ') : 'All Games';
}

export function buildParams(phase, segment, week, rangeFrom, rangeTo, dateFrom, dateTo, patch) {
  const p = [];
  if (phase !== 'overall')      p.push(`phase=${encodeURIComponent(phase)}`);
  if (segment === 'exact')      p.push(`week=${week}`);
  else if (segment === 'range') p.push(`week_from=${rangeFrom}`, `week_max=${rangeTo}`);
  else if (segment === 'date_range' && dateFrom && dateTo) p.push(`date_from=${dateFrom}`, `date_to=${dateTo}`);
  if (patch && patch !== 'all') p.push(`patch=${encodeURIComponent(patch)}`);
  return p;
}

const selStyle = {
  fontFamily: 'var(--font-body)',
  fontSize: 12,
  background: 'var(--surface2)',
  border: '1px solid var(--border)',
  color: 'var(--text)',
  padding: '5px 8px',
  cursor: 'pointer',
  width: '100%',
  borderRadius: 4,
};

/**
 * Sticky left sidebar containing all filter controls.
 * Hierarchy (broad → specific): Season → Segment/Week → Role → Team → Extras
 *
 * All filter props are optional — omit them to hide that section.
 */
export default function FilterSidebar({
  // Section rendered above Season (e.g. tab switcher — the broadest filter)
  topSection,
  // Season / phase
  phase, setPhase,
  // Segment / week (omit both to hide the week section)
  segment, setSegment, week, setWeek, rangeFrom, setRangeFrom, rangeTo, setRangeTo,
  // Date Range (new)
  dateFrom, setDateFrom, dateTo, setDateTo,
  // Patch (new)
  patch, setPatch, patches,
  // Side (new)
  side, setSide,
  // W/L (new)
  result, setResult,
  // Role (omit to hide)
  roleFilter, setRoleFilter,
  // Team (omit teams array to hide)
  teamFilter, setTeamFilter, teams,
  // Arbitrary page-specific controls at the bottom
  extras,
  // Page-specific extras reset: `extrasActive` keeps the reset button visible
  // when only an extra filter (e.g. Side / Win-Loss) is set, and `resetExtras`
  // clears those extras alongside the built-in ones.
  extrasActive, resetExtras,
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const isFiltered = phase !== 'overall' || (segment && segment !== 'all') || !!extrasActive || !!(patch && patch !== 'all') || (side && side !== 'overall') || (result && result !== 'all');
  const resetFilters = () => {
    setPhase?.('overall');
    setSegment?.('all');
    setWeek?.(1);
    setRangeFrom?.(1);
    setRangeTo?.(9);
    setDateFrom?.('');
    setDateTo?.('');
    setPatch?.(patch === 'all' ? 'all' : null);
    setSide?.('overall');
    setResult?.('all');
    resetExtras?.();
  };

  const body = (
    <>
      {/* TOP SECTION (broadest filter, e.g. tab switcher) */}
      {topSection && (
        <div className="filter-section" style={{ background: 'transparent', border: 'none', padding: 0, borderBottom: '1px solid var(--border)', marginBottom: 16, paddingBottom: 12, borderRadius: 0 }}>
          {topSection}
        </div>
      )}

      {/* RESET FILTER */}
      {isFiltered && (
        <div style={{ marginBottom: 12 }}>
          <button onClick={resetFilters}
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              padding: '6px 12px',
              background: 'rgba(255, 99, 99, 0.1)',
              border: '1px solid rgba(255, 99, 99, 0.3)',
              color: '#ff6363',
              cursor: 'pointer',
              borderRadius: 6,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              fontWeight: 'bold',
              letterSpacing: '.04em'
            }}>
            ✕ Reset Filters
          </button>
        </div>
      )}

      {/* SEASON */}
      {setPhase && (
        <div className="filter-section">
          <div className="filter-section-label">Season</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4 }}>
            {[
              { key: 'overall',        label: 'All', gridSpan: true },
              { key: 'Regular Season', label: 'Reg. Season' },
              { key: 'Playoffs',       label: 'Playoffs' },
            ].map(t => (
              <button key={t.key} className={`filter-pill${phase === t.key ? ' active' : ''}`}
                style={{
                  minHeight: 28,
                  height: 28,
                  padding: '4px 6px',
                  fontSize: 11,
                  justifyContent: 'center',
                  width: '100%',
                  textAlign: 'center',
                  ...(t.gridSpan ? { gridColumn: '1 / span 2' } : {})
                }}
                onClick={() => setPhase(t.key)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SEGMENT / WEEK */}
      {setSegment && (
        <div className="filter-section">
          <div className="filter-section-label">Segment</div>
          <select value={segment} onChange={e => setSegment(e.target.value)} style={selStyle}>
            <option value="all">All Games</option>
            <option value="exact">Per Week</option>
            <option value="range">Week Range</option>
            <option value="date_range">Date Range</option>
          </select>

          {segment === 'exact' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 4, marginTop: 8 }}>
              {WEEKS.map(w => (
                <button key={w} onClick={() => setWeek(w)}
                  className={`filter-pill${week === w ? ' active' : ''}`}
                  style={{
                    minHeight: 28,
                    height: 28,
                    padding: '4px 8px',
                    fontSize: 11,
                    justifyContent: 'center',
                    width: '100%',
                    textAlign: 'center'
                  }}>
                  W{w}
                </button>
              ))}
            </div>
          )}

          {segment === 'range' && (
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="filter-section-label" style={{ marginBottom: 4 }}>From</div>
                <select value={rangeFrom} onChange={e => setRangeFrom(parseInt(e.target.value))} style={{ ...selStyle, padding: '4px 6px', fontSize: 11 }}>
                  {WEEKS.map(w => <option key={w} value={w}>W{w}</option>)}
                </select>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="filter-section-label" style={{ marginBottom: 4 }}>To</div>
                <select value={rangeTo} onChange={e => setRangeTo(parseInt(e.target.value))} style={{ ...selStyle, padding: '4px 6px', fontSize: 11 }}>
                  {WEEKS.map(w => <option key={w} value={w}>W{w}</option>)}
                </select>
              </div>
            </div>
          )}

          {segment === 'date_range' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
              <div>
                <label htmlFor="start-date" className="filter-section-label" style={{ display: 'block', marginBottom: 4 }}>From</label>
                <input
                  id="start-date"
                  type="date"
                  value={dateFrom || ''}
                  onChange={e => setDateFrom?.(e.target.value)}
                  style={{ ...selStyle, padding: '4px 6px', fontSize: 10 }}
                />
              </div>
              <div>
                <label htmlFor="end-date" className="filter-section-label" style={{ display: 'block', marginBottom: 4 }}>To</label>
                <input
                  id="end-date"
                  type="date"
                  value={dateTo || ''}
                  onChange={e => setDateTo?.(e.target.value)}
                  style={{ ...selStyle, padding: '4px 6px', fontSize: 10 }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* PATCH */}
      {setPatch && patches && patches.length > 0 && (
        <div className="filter-section">
          <div className="filter-section-label">Patch</div>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            <button
              className={`filter-pill${(!patch || patch === 'all') ? ' active' : ''}`}
              style={{
                minHeight: 28,
                height: 28,
                padding: '4px 8px',
                fontSize: 11,
                justifyContent: 'center',
                width: 'auto',
                flex: '0 0 auto',
                textAlign: 'center'
              }}
              onClick={() => setPatch(patch === 'all' ? 'all' : null)}>
              All
            </button>
            {patches.map(p => {
              const patchNum = p.replace(/^Patch\s+/i, '');
              return (
                <button key={p}
                  className={`filter-pill${patch === p ? ' active' : ''}`}
                  onClick={() => setPatch(p)}
                  style={{
                    minHeight: 28,
                    height: 28,
                    padding: '4px 8px',
                    fontSize: 11,
                    justifyContent: 'center',
                    width: 'auto',
                    flex: '0 0 auto',
                    textAlign: 'center'
                  }}>
                  {patchNum}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SIDE */}
      {setSide && (
        <div className="filter-section">
          <div className="filter-section-label">Side</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'overall', label: 'All' },
              { key: 'blue',    label: 'Blue' },
              { key: 'red',     label: 'Red' },
            ].map(s => (
              <button key={s.key} className={`filter-pill${side === s.key ? ' active' : ''}`}
                style={{
                  minHeight: 28,
                  height: 28,
                  padding: '4px 6px',
                  fontSize: 11,
                  justifyContent: 'center',
                  width: 'auto',
                  flex: 1,
                  textAlign: 'center'
                }}
                onClick={() => setSide(s.key)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* W/L */}
      {setResult && (
        <div className="filter-section">
          <div className="filter-section-label">W/L</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { key: 'all',    label: 'All' },
              { key: 'wins',   label: 'Win' },
              { key: 'losses', label: 'Loss' },
            ].map(r => (
              <button key={r.key} className={`filter-pill${result === r.key ? ' active' : ''}`}
                style={{
                  minHeight: 28,
                  height: 28,
                  padding: '4px 6px',
                  fontSize: 11,
                  justifyContent: 'center',
                  width: 'auto',
                  flex: 1,
                  textAlign: 'center'
                }}
                onClick={() => setResult(r.key)}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ROLE */}
      {setRoleFilter && (
        <div className="filter-section">
          <div className="filter-section-label">Role</div>
          <div style={{ display: 'flex', gap: 4 }}>
            <button className={`filter-pill${roleFilter === 'ALL' ? ' active' : ''}`}
              style={{
                minHeight: 28,
                height: 28,
                padding: '4px 8px',
                fontSize: 11,
                justifyContent: 'center',
                width: 'auto',
                flex: '0 0 auto',
                textAlign: 'center'
              }}
              onClick={() => setRoleFilter('ALL')}>
              All
            </button>
            {ROLES.map(r => (
              <button key={r} title={r} aria-label={r}
                className={`filter-pill${roleFilter === r ? ' active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  minHeight: 28,
                  padding: 0,
                  flex: 1
                }}
                onClick={() => setRoleFilter(r)}>
                <RoleImg role={r} size={16} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TEAM */}
      {teams && setTeamFilter && (
        <div className="filter-section">
          <div className="filter-section-label">Team</div>
          <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', paddingBottom: 2 }}>
            <button className={`filter-pill${teamFilter === 'ALL' ? ' active' : ''}`}
              style={{
                minHeight: 28,
                height: 28,
                padding: '4px 8px',
                fontSize: 11,
                justifyContent: 'center',
                width: 'auto',
                flex: '0 0 auto',
                textAlign: 'center'
              }}
              onClick={() => setTeamFilter('ALL')}>
              All
            </button>
            {teams.map(code => (
              <button key={code} title={code} aria-label={code}
                className={`filter-pill${teamFilter === code ? ' active' : ''}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 28,
                  height: 28,
                  minHeight: 28,
                  padding: 0,
                  flex: '0 0 auto'
                }}
                onClick={() => setTeamFilter(code)}>
                <TeamImg code={code} size={16} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PAGE-SPECIFIC EXTRAS */}
      {extras}
    </>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        className="filter-toggle-btn"
        onClick={() => setMobileOpen(o => !o)}
        aria-expanded={mobileOpen}
        aria-controls="filter-sidebar"
      >
        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
        Filters
      </button>

      {/* Desktop sidebar + mobile sheet */}
      <aside id="filter-sidebar" className={`filter-sidebar${mobileOpen ? ' open' : ''}`} role="navigation" aria-label="Stat filters">
        {body}
      </aside>
    </>
  );
}
