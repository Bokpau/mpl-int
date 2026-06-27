import Link from 'next/link';
import { api } from '../../lib/api';
import { resolveSelection } from '../../lib/featured';
import ErrorBox from '../../components/ErrorBox';
import PageHead from '../../components/PageHead';

export const metadata = { title: 'Results' };

// The matches endpoint returns one row PER GAME. Roll games up into matches
// (series) keyed by match_code, then group matches by edition → stage.
function buildBracket(games) {
  const matches = new Map();
  for (const g of games) {
    let m = matches.get(g.match_code);
    if (!m) {
      m = {
        match_code: g.match_code,
        tournament_code: g.tournament_code,
        season: g.season,
        stage: g.stage || 'Main',
        stage_type: g.stage_type,
        match_name: g.match_name,
        team_a_era: g.team_a_era, team_a_key: g.team_a_key,
        team_b_era: g.team_b_era, team_b_key: g.team_b_key,
        played_at: g.played_at,
        scoreA: 0, scoreB: 0, games: 0,
      };
      matches.set(g.match_code, m);
    }
    m.games += 1;
    if (g.winner_key && g.winner_key === m.team_a_key) m.scoreA += 1;
    else if (g.winner_key && g.winner_key === m.team_b_key) m.scoreB += 1;
    if (g.played_at && (!m.played_at || g.played_at > m.played_at)) m.played_at = g.played_at;
  }

  // edition (tournament + season) → stage → [matches]
  const editions = new Map();
  for (const m of matches.values()) {
    const ekey = `${m.tournament_code}|${m.season}`;
    let e = editions.get(ekey);
    if (!e) {
      e = { tournament_code: m.tournament_code, season: m.season, latest: m.played_at || '', stages: new Map() };
      editions.set(ekey, e);
    }
    if (m.played_at && m.played_at > e.latest) e.latest = m.played_at;
    let s = e.stages.get(m.stage);
    if (!s) { s = { stage: m.stage, stage_type: m.stage_type, earliest: m.played_at || '￿', matches: [] }; e.stages.set(m.stage, s); }
    if (m.played_at && m.played_at < s.earliest) s.earliest = m.played_at;
    s.matches.push(m);
  }

  // Sort: editions newest first; stages by first game; matches by date desc.
  return [...editions.values()]
    .sort((a, b) => (a.latest < b.latest ? 1 : -1))
    .map((e) => ({
      ...e,
      stages: [...e.stages.values()]
        .sort((a, b) => (a.earliest < b.earliest ? -1 : 1))
        .map((s) => ({ ...s, matches: s.matches.sort((a, b) => (a.played_at < b.played_at ? 1 : -1)) })),
    }));
}

function TeamSide({ era, teamKey, score, won }) {
  return (
    <div className={`side ${won ? 'won' : ''}`}>
      <span className="side-name">
        {teamKey ? <Link href={`/teams/${encodeURIComponent(teamKey)}`}>{era || '—'}</Link> : (era || '—')}
      </span>
      <span className="side-score">{score}</span>
    </div>
  );
}

export default async function ResultsPage({ searchParams }) {
  const sp = await searchParams;
  const { q, label } = await resolveSelection(sp);
  const sep = q ? '&' : '?';

  let games = null;
  let error = null;
  try {
    games = await api.matches(`${q}${sep}limit=2000`);
  } catch (e) {
    error = e.message;
  }

  const editions = games ? buildBracket(games) : [];

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Results">
        Match results by stage. Use the Stage filter for Wildcard-only or Main-only games.
      </PageHead>

      {error ? (
        <ErrorBox error={error} />
      ) : editions.length === 0 ? (
        <div className="empty">No matches for this selection.</div>
      ) : (
        editions.map((e) => (
          <section key={`${e.tournament_code}-${e.season}`}>
            <div className="section-title">
              {e.tournament_code === 'MWC' ? `M-Series ${e.season}` : e.season}
            </div>
            {e.stages.map((s) => (
              <div className="stage-block" key={s.stage}>
                <div className="stage-head">
                  <span className={`pill ${s.stage_type === 'qualifier' ? 'qual' : 'main'}`}>
                    {s.stage_type === 'qualifier' ? 'Wildcard' : 'Main'}
                  </span>
                  <span className="stage-name">{s.stage}</span>
                  <span className="sub">{s.matches.length} match{s.matches.length === 1 ? '' : 'es'}</span>
                </div>
                <div className="match-grid">
                  {s.matches.map((m) => (
                    <div className="match-card" key={m.match_code}>
                      <TeamSide era={m.team_a_era} teamKey={m.team_a_key} score={m.scoreA} won={m.scoreA > m.scoreB} />
                      <TeamSide era={m.team_b_era} teamKey={m.team_b_key} score={m.scoreB} won={m.scoreB > m.scoreA} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))
      )}
    </div>
  );
}
