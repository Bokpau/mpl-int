'use client';

import TeamLogo from './TeamLogo';
import { img } from '../lib/images';
import { DECIDER, buildSeries, computeDecider } from '../lib/msc2026Bracket';

// Wild Card Decider bracket for the Matches page Grid view. Renders the same
// semifinals → grand final → Main Stage qualifier the Dashboard shows, but from the
// client-side rich games. `metaByEra` maps an era code -> { team_logo_dark,
// country_flag } for logos/flags. Mirrors the Dashboard's SeriesBox/QualifiedCol.

function Flag({ emoji }) {
  return emoji ? <span style={{ fontSize: 13 }} aria-hidden="true">{emoji}</span> : null;
}

function SeriesBox({ title, aCode, bCode, aScore, bScore, winner, teamMeta = {}, scaffold, compact }) {
  const pad = compact ? '4px 10px' : '7px 10px';
  const sz = compact ? 16 : 18;
  const row = (code) => {
    const meta = teamMeta[code] || {};
    const isWin = winner && winner === code;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: pad }}>
        {code ? <TeamLogo src={meta.team_logo_dark} fallbackSrc={img.team(code)} alt="" style={{ width: sz, height: sz, objectFit: 'contain' }} /> : <span style={{ width: sz }} />}
        {code ? <Flag emoji={meta.country_flag} /> : null}
        <span style={{ fontSize: 13, color: code ? (isWin ? 'var(--win)' : 'var(--text)') : 'var(--muted2)', fontWeight: isWin ? 700 : 400 }}>{code || 'TBD'}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: isWin ? 'var(--win)' : 'var(--muted2)' }}>
          {scaffold ? '–' : (code === aCode ? aScore : bScore)}
        </span>
      </div>
    );
  };
  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {title ? <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted2)', padding: compact ? '4px 10px 0' : '6px 10px 0' }}>{title}</div> : null}
      {row(aCode)}
      <div style={{ borderTop: '1px solid rgba(30,30,58,0.4)' }} />
      {row(bCode)}
    </div>
  );
}

function QualifiedCol({ codes, teamMeta = {}, title = 'Qualified' }) {
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

export default function WildCardDecider({ games = [], metaByEra = {} }) {
  const allSeries = buildSeries(games);
  const { deciderSemis, finalSeries, finalA, finalB, mainStageQualifier } = computeDecider(allSeries);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
        Wild Card Decider
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {deciderSemis.map((m) => (
            m.series
              ? <SeriesBox key={m.label} title={m.label} teamMeta={metaByEra} compact
                  aCode={m.series.team_a} bCode={m.series.team_b}
                  aScore={m.series.a_wins} bScore={m.series.b_wins} winner={m.series.winner_code} />
              : <SeriesBox key={m.label} title={m.label} teamMeta={metaByEra} compact aCode={m.a} bCode={m.b} scaffold />
          ))}
        </div>
        {finalSeries
          ? <SeriesBox title={DECIDER.final.label} teamMeta={metaByEra} compact
              aCode={finalSeries.team_a} bCode={finalSeries.team_b}
              aScore={finalSeries.a_wins} bScore={finalSeries.b_wins} winner={finalSeries.winner_code} />
          : <SeriesBox title={DECIDER.final.label} teamMeta={metaByEra} compact aCode={finalA} bCode={finalB} scaffold />}
        <QualifiedCol title="To Main Stage" codes={mainStageQualifier ? [mainStageQualifier] : []} teamMeta={metaByEra} />
      </div>
      {!finalSeries ? (
        <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
          Fills in as each series is played; the Grand Final winner qualifies for the Main Stage.
        </div>
      ) : null}
    </div>
  );
}
