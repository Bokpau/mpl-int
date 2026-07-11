'use client';

import { useState, useEffect, useMemo } from 'react';
import TeamLogo from './TeamLogo';
import { img } from '../lib/images';
import MatchCard from './MatchCard';
import { SeriesBox, QualifiedCol, SubHead, BracketCol } from './BracketBits';
import { buildSeries, computeDecider, DECIDER, GAUNTLET_SERIES } from '../lib/msc2026Bracket';
import { resolveMainGroup } from '../lib/msc2026MainBracket';
import { getFormat } from '../lib/tournamentFormats';

// Grid view for the Matches page.
//
// MSC 2026: renders the full bracket structure (Wild Card groups → Gauntlet →
// Decider; Main Stage GSL groups). This is the only edition with hardcoded
// bracket positions.
//
// All other editions: renders organised match-row sections per stage, using
// tournamentFormats.js for the correct stage labels and format description.
// Historical data has no bracket-position metadata so a bracket rendering isn't
// possible — clean match rows per stage is the right UX.

const LAYOUT_LABELS = {
  'table+rows':  'Round Robin',
  'double-elim': 'Double Elimination',
  'single-elim': 'Single Elimination',
  'swiss':        'Swiss System',
  'gsl':          'Double Elimination (GSL)',
  'koth':         'King-of-the-Hill',
  'decider':      'Decider Match',
  'match-rows':   'Crossover Matches',
};

function TeamMark({ meta, era, size = 24 }) {
  return (
    <TeamLogo src={meta?.team_logo_dark} fallbackSrc={img.team(era)} alt=""
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }} />
  );
}

function Section({ title, children }) {
  return (
    <details className="results-week collapsible full-width" open>
      <summary className="results-week-summary">
        <div className="results-week-head">
          <span className="disclosure">▶</span>
          <span className="results-week-title">{title}</span>
          <span className="results-week-toggle-label">// Expand/Collapse</span>
        </div>
      </summary>
      <div className="collapsible-body results-week-body">{children}</div>
    </details>
  );
}

// ── Generic view (all editions except MSC 2026) ────────────────────────────
// Groups series by their DB stage name and renders each as a collapsible section
// with match rows. Stage labels + format descriptions come from tournamentFormats.js.
function GenericMatchesView({ series, season, renderMatchRow }) {
  const format = getFormat(season);

  // Group series by db_stage, preserving insertion order from the data.
  const byStage = {};
  const stageOrder = [];
  for (const s of series) {
    const key = s.stage || 'Unknown';
    if (!byStage[key]) { byStage[key] = []; stageOrder.push(key); }
    byStage[key].push(s);
  }

  // Build display metadata per db_stage from the format, falling back to the
  // raw DB stage name when the edition isn't in tournamentFormats.js.
  const stageMeta = (dbStage) => {
    if (!format) return { label: dbStage, layoutLabel: null };
    // Find the first non-merged stage descriptor that matches this DB stage name.
    const desc = format.stages.find((sd) => sd.db_stage === dbStage && !sd.merged_into);
    if (!desc) return { label: dbStage, layoutLabel: null };
    return {
      label: desc.label || dbStage,
      layoutLabel: LAYOUT_LABELS[desc.layout] || null,
      note: desc.note || null,
    };
  };

  if (!stageOrder.length) {
    return <div className="empty"><div>No matches found for the selected filter.</div></div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {stageOrder.map((dbStage) => {
        const { label, layoutLabel } = stageMeta(dbStage);
        const stageSeries = [...byStage[dbStage]].sort((a, b) =>
          String(a.played_at || '').localeCompare(String(b.played_at || '')) ||
          (a.match_number || 0) - (b.match_number || 0)
        );
        return (
          <Section key={dbStage} title={label}>
            {layoutLabel && (
              <div style={{ padding: '4px 12px 8px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                {layoutLabel}
              </div>
            )}
            <div style={{ padding: '0 8px 8px' }}>
              {stageSeries.map(renderMatchRow)}
            </div>
          </Section>
        );
      })}
    </div>
  );
}

export default function MatchResultsGrid({
  series = [], teamByKey = {}, metaByEra = {}, wildCardGames = [], mainGames = [], stage = 'all',
  season = null,
}) {
  const [active, setActive] = useState(null); // open match_code
  const isWildCard = stage !== 'main';

  useEffect(() => {
    if (!active) return;
    const onKey = (e) => { if (e.key === 'Escape') setActive(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const toggle = (mc) => setActive((a) => (a === mc ? null : mc));

  // match_code -> { info, games, match_mvp } for the popover MatchCard.
  const byCode = useMemo(() => {
    const src = season !== 'MSC 2026'
      ? [...wildCardGames, ...mainGames]
      : isWildCard ? wildCardGames : mainGames;
    const m = {};
    for (const g of src) {
      const c = g.match_code || g.battle_id;
      if (!m[c]) m[c] = { info: g, games: [], match_mvp: null };
      m[c].games.push(g);
      if (g.match_mvp?.roleid) m[c].match_mvp = g.match_mvp;
    }
    return m;
  }, [wildCardGames, mainGames, season, isWildCard]);

  // The breakdown is a single screen-centered modal (not an inline popover): the
  // match rows / series boxes are narrow and in columns, so an anchored popover
  // clipped the data. Centered + scrollable = the full MatchCard is always visible.
  const modal = (() => {
    const s = active && byCode[active];
    if (!s) return null;
    return (
      <div
        onClick={() => setActive(null)}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          className="modal-box"
          style={{ width: 'min(680px, 100%)' }}
        >
          <div className="match-popover-header">
            <span className="match-popover-title">// MATCH DETAILS</span>
            <button className="match-popover-close" onClick={() => setActive(null)} aria-label="Close">&times;</button>
          </div>
          <div style={{ padding: 12 }}>
            <MatchCard info={s.info} games={s.games} match_mvp={s.match_mvp} teamByKey={teamByKey} />
          </div>
        </div>
      </div>
    );
  })();

  const codeFs = (code) => !code || code.length <= 5 ? 12 : code.length <= 7 ? 10 : 8;

  // A compact match row (used by Group Stage + the Main fallback grid). `s` is a
  // buildSeries() series.
  const renderMatchRow = (s) => {
    const aKey = s.team_a_key, bKey = s.team_b_key;
    const aEra = s.team_a || '—', bEra = s.team_b || '—';
    const aWon = s.a_wins > s.b_wins, bWon = s.b_wins > s.a_wins;
    const mc = s.match_code;
    const open = active === mc;
    const matchNum = s.match_number ?? (mc?.match(/M(\d+)$/)?.[1] ?? null);
    return (
      <div key={mc} className="match-row">
        <div className="match-row-team team-home">
          <span className="team-code" style={{ fontSize: codeFs(aEra) }}>{aEra}</span>
          <TeamMark meta={teamByKey[aKey]} era={aEra} />
        </div>
        <div className="match-row-center" style={{ position: 'relative' }}>
          {matchNum && (
            <span style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted2)', letterSpacing: '.05em', whiteSpace: 'nowrap' }}>
              M{matchNum}
            </span>
          )}
          <div className="match-row-score-box">
            <span className={`score-num ${aWon ? 'winner' : 'loser'}`}>{s.a_wins}</span>
            <button className={`match-info-btn ${open ? 'active' : ''}`}
              onClick={(e) => { e.stopPropagation(); toggle(mc); }} aria-label="Toggle match breakdown">i</button>
            <span className={`score-num ${bWon ? 'winner' : 'loser'}`}>{s.b_wins}</span>
          </div>
          {s.match_count && (
            <span className="match-bo" style={{ position: 'absolute', bottom: -4, left: '50%', transform: 'translateX(-50%)' }}>{s.match_count}</span>
          )}
        </div>
        <div className="match-row-team team-away">
          <TeamMark meta={teamByKey[bKey]} era={bEra} />
          <span className="team-code" style={{ fontSize: codeFs(bEra) }}>{bEra}</span>
        </div>
      </div>
    );
  };

  // Route all non-MSC-2026 editions to generic match-row view.
  if (season !== 'MSC 2026') {
    const allSeries = buildSeries([...wildCardGames, ...mainGames]);
    const filtered = stage === 'all' ? allSeries
      : allSeries.filter(s => stage === 'qualifier' ? s.stage_type === 'qualifier' : s.stage_type !== 'qualifier');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <GenericMatchesView series={filtered} season={season} renderMatchRow={renderMatchRow} />
        {modal}
      </div>
    );
  }

  // A gauntlet/decider series box; its `i` opens the shared centered modal.
  const boxFor = (s, { title, compact } = {}) => (
    <SeriesBox key={s.match_code} title={title} teamMeta={metaByEra} compact={compact}
      aCode={s.team_a} bCode={s.team_b} aScore={s.a_wins} bScore={s.b_wins} winner={s.winner_code}
      matchCode={s.match_code} open={active === s.match_code} onToggle={() => toggle(s.match_code)} />
  );

  // ── Wild Card structure ─────────────────────────────────────────────────
  const wc = useMemo(() => {
    const all = buildSeries(wildCardGames);
    const groupSeries = all.filter((s) => s.games <= 1);
    const bo3 = all.filter((s) => s.games > 1).sort((a, b) =>
      String(a.played_at || '').localeCompare(String(b.played_at || '')) ||
      String(a.match_code).localeCompare(String(b.match_code)));
    const gauntlet = bo3.slice(0, GAUNTLET_SERIES);
    const byDay = {};
    for (const s of groupSeries) {
      const d = s.day_number || 99;
      (byDay[d] = byDay[d] || []).push(s);
    }
    const groupDays = Object.entries(byDay)
      .map(([d, arr]) => ({ day: Number(d), matches: arr.sort((a, b) => (a.match_number || 0) - (b.match_number || 0)) }))
      .sort((a, b) => a.day - b.day);
    return { groupDays, gauntletR1: gauntlet.slice(0, 2), gauntletR2: gauntlet.slice(2, 4), ...computeDecider(all) };
  }, [wildCardGames]);

  // ── Main stage: two double-elimination group brackets ───────────────────
  // Resolved by team pairing off ALL Main games (mainGames), so the bracket spans
  // the whole stage and advances regardless of the schedule's match_code numbering.
  const mainGroups = useMemo(() => {
    if (isWildCard) return null;
    const all = buildSeries(mainGames);
    return { A: resolveMainGroup('A', all), B: resolveMainGroup('B', all) };
  }, [mainGames, isWildCard]);

  // A single M1–M10 bracket node → SeriesBox. Scaffolds show the feeder label
  // (e.g. "W M1") until the upstream result flows in.
  const nodeBox = (n) => (
    <SeriesBox key={n.id} title={n.id} teamMeta={metaByEra} compact
      aCode={n.a} bCode={n.b} aLabel={n.aLabel} bLabel={n.bLabel}
      aScore={n.aScore} bScore={n.bScore} winner={n.winner}
      scaffold={!n.series}
      matchCode={n.series ? n.series.match_code : undefined}
      open={n.series ? active === n.series.match_code : false}
      onToggle={n.series ? () => toggle(n.series.match_code) : undefined} />
  );

  const groupBracket = (label, g) => {
    const byRound = (r) => g.nodes.filter((n) => n.round === r);
    return (
      <Section key={label} title={label}>
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, alignItems: 'start' }}>
          <BracketCol title="Upper R1" series={byRound('Upper R1')} renderBox={nodeBox} />
          <BracketCol title="Upper R2" series={byRound('Upper R2')} renderBox={nodeBox} />
          <BracketCol title="Lower R1" series={byRound('Lower R1')} renderBox={nodeBox} />
          <BracketCol title="Lower R2" series={byRound('Lower R2')} renderBox={nodeBox} />
          <QualifiedCol title="To Knockout" codes={g.qualifiers} teamMeta={metaByEra} />
        </div>
      </Section>
    );
  };

  if (!isWildCard) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {mainGroups && groupBracket('Group A', mainGroups.A)}
        {mainGroups && groupBracket('Group B', mainGroups.B)}
        {modal}
      </div>
    );
  }

  const hasDecider = wc.deciderSemis.some((m) => m.series) || wc.finalSeries || wc.finalA || wc.finalB;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Group Stage — Day 1 / Day 2 match rows */}
      {wc.groupDays.length > 0 && (
        <Section title="Group Stage">
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${wc.groupDays.length}, minmax(0, 1fr))` }}>
            {wc.groupDays.map((d, i) => (
              <div key={d.day} className="results-day-block" style={i > 0 ? { borderLeft: '1px solid var(--border)' } : undefined}>
                <div className="results-day-header">DAY {d.day}</div>
                <div className="results-day-matches">{d.matches.map(renderMatchRow)}</div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Cross-Group Gauntlet — Day 3 bracket */}
      {(wc.gauntletR1.length > 0 || wc.gauntletR2.length > 0) && (
        <Section title="Cross-Group Gauntlet">
          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, alignItems: 'start' }}>
            <BracketCol title="Round 1" series={wc.gauntletR1} renderBox={(s) => boxFor(s)} />
            <BracketCol title="Round 2" series={wc.gauntletR2} renderBox={(s) => boxFor(s)} />
          </div>
        </Section>
      )}

      {/* Decider — semifinals → grand final → Main Stage qualifier */}
      {hasDecider && (
        <Section title="Decider">
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <SubHead>Wild Card Decider</SubHead>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {wc.deciderSemis.map((m) => (
                  m.series
                    ? boxFor(m.series, { title: m.label, compact: true })
                    : <SeriesBox key={m.label} title={m.label} teamMeta={metaByEra} compact aCode={m.a} bCode={m.b} scaffold />
                ))}
              </div>
              {wc.finalSeries
                ? boxFor(wc.finalSeries, { title: DECIDER.final.label, compact: true })
                : <SeriesBox title={DECIDER.final.label} teamMeta={metaByEra} compact aCode={wc.finalA} bCode={wc.finalB} scaffold />}
              <QualifiedCol title="To Main Stage" codes={wc.mainStageQualifier ? [wc.mainStageQualifier] : []} teamMeta={metaByEra} />
            </div>
            {!wc.finalSeries ? (
              <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
                Fills in as each series is played; the Grand Final winner qualifies for the Main Stage.
              </div>
            ) : null}
          </div>
        </Section>
      )}

      {wc.groupDays.length === 0 && !hasDecider && wc.gauntletR1.length === 0 && (
        <div className="empty"><div>No matches found for the selected filter.</div></div>
      )}
      {modal}
    </div>
  );
}
