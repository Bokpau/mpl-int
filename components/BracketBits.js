'use client';

import TeamLogo from './TeamLogo';
import { img } from '../lib/images';

// Shared presentational bits for the Wild Card Gauntlet + Decider brackets on the
// Matches Grid. Ported from the Dashboard's inline SeriesBox/QualifiedCol so the two
// pages look identical. SeriesBox optionally renders an `i` info button (when
// `matchCode` + `onToggle` are given and it's not a scaffold) plus an inline popover
// slot (`children`, shown when `open`).

export function Flag({ emoji }) {
  return emoji ? <span style={{ fontSize: 13 }} aria-hidden="true">{emoji}</span> : null;
}

export function SubHead({ children }) {
  return (
    <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
      {children}
    </div>
  );
}

export function SeriesBox({
  title, aCode, bCode, aScore, bScore, winner, teamMeta = {}, scaffold, compact,
  matchCode, open, onToggle, children, aLabel, bLabel,
}) {
  const pad = compact ? '4px 10px' : '7px 10px';
  const sz = compact ? 16 : 18;
  const showInfo = matchCode && !scaffold && onToggle;
  // `label` is the display fallback (e.g. a feeder like "W M1") shown when a team
  // slot isn't resolved to a real code yet — keeps the logo/flag off placeholders.
  const codeFs = (s) => !s || s.length <= 5 ? 13 : s.length <= 7 ? 11 : 9;
  const row = (code, label) => {
    const meta = teamMeta[code] || {};
    const isWin = winner && winner === code;
    const displayText = code || label || 'TBD';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: pad }}>
        {code ? <TeamLogo src={meta.team_logo_dark} fallbackSrc={img.team(code)} alt="" style={{ width: sz, height: sz, objectFit: 'contain' }} /> : <span style={{ width: sz }} />}
        {code ? <Flag emoji={meta.country_flag} /> : null}
        <span style={{ fontSize: codeFs(displayText), color: code ? (isWin ? 'var(--win)' : 'var(--text)') : 'var(--muted2)', fontWeight: isWin ? 700 : 400 }}>{displayText}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: isWin ? 'var(--win)' : 'var(--muted2)' }}>
          {scaffold ? '–' : (code === aCode ? aScore : bScore)}
        </span>
      </div>
    );
  };
  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: compact ? '4px 10px 0' : '6px 10px 0' }}>
        {title ? <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted2)' }}>{title}</div> : <span />}
        {showInfo && (
          <button className={`match-info-btn ${open ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); onToggle(); }} aria-label="Toggle match breakdown">i</button>
        )}
      </div>
      {row(aCode, aLabel)}
      <div style={{ borderTop: '1px solid rgba(30,30,58,0.4)' }} />
      {row(bCode, bLabel)}
      {open && children}
    </div>
  );
}

export function QualifiedCol({ codes, teamMeta = {}, title = 'Qualified' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>{title}</div>
      {codes.length ? codes.map((c) => {
        const meta = teamMeta[c] || {};
        return (
          <div key={c} style={{ border: '1px solid var(--win)', background: 'var(--surface)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamLogo src={meta.team_logo_dark} fallbackSrc={img.team(c)} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
            <Flag emoji={meta.country_flag} />
            <span style={{ fontWeight: 700, color: 'var(--win)' }}>{c}</span>
          </div>
        );
      }) : <div style={{ color: 'var(--muted2)', fontSize: 11, textAlign: 'center' }}>—</div>}
    </div>
  );
}

// One bracket round (column) of Gauntlet series. `renderBox(series)` lets the caller
// wrap each series in a SeriesBox wired to its popover state.
export function BracketCol({ title, series, renderBox }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>{title}</div>
      {series.length ? series.map(renderBox) : <div style={{ color: 'var(--muted2)', fontSize: 11, textAlign: 'center' }}>—</div>}
    </div>
  );
}
