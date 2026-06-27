import Link from 'next/link';
import { api } from '../lib/api';
import { resolveSelection } from '../lib/featured';
import ErrorBox from '../components/ErrorBox';
import PageHead from '../components/PageHead';
import StatTable from '../components/StatTable';
import { PLAYER_COLUMNS, TEAM_COLUMNS, HERO_COLUMNS } from '../lib/columns';
import { int } from '../lib/format';

export const metadata = { title: 'Dashboard' };

// Top-5 slices for the dashboard mini-tables (full lists live on their own pages).
const top5 = (cols) => cols; // columns unchanged; rows are sliced below

function Section({ title, href, children }) {
  return (
    <section className="dash-section">
      <div className="dash-section-head">
        <h2 className="section-title">{title}</h2>
        {href ? <Link href={href} className="dash-more">View all →</Link> : null}
      </div>
      {children}
    </section>
  );
}

export default async function DashboardPage({ searchParams }) {
  const sp = await searchParams;
  const { q, label } = await resolveSelection(sp);

  // Pull the headline data sets in parallel; stay resilient if any one fails.
  let players = [], teams = [], heroes = [], matches = [], error = null;
  try {
    [players, teams, heroes, matches] = await Promise.all([
      api.leaderboard(q).catch(() => []),
      api.teams(q).catch(() => []),
      api.heroes(q).catch(() => []),
      api.matches(`${q ? q + '&' : '?'}limit=2000`).catch(() => []),
    ]);
  } catch (e) {
    error = e.message;
  }

  const hasData = players.length || teams.length || matches.length;
  // Recent games (matches endpoint = one row per game), newest first.
  const recent = [...matches]
    .sort((a, b) => String(b.played_at || '').localeCompare(String(a.played_at || '')))
    .slice(0, 6);

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Dashboard">
        The international stats hub — leading with the featured edition. Switch editions or view all-time in the bar above.
      </PageHead>

      {error ? <ErrorBox error={error} /> : null}

      {!hasData ? (
        <div className="empty">No games yet for this selection. Choose another edition or “All editions” above.</div>
      ) : (
        <>
          {/* Headline counts */}
          <div className="cards">
            <div className="card"><div className="k">Games</div><div className="v">{int(matches.length)}</div></div>
            <div className="card"><div className="k">Teams</div><div className="v">{int(teams.length)}</div></div>
            <div className="card"><div className="k">Players</div><div className="v">{int(players.length)}</div></div>
            <div className="card"><div className="k">Heroes</div><div className="v">{int(heroes.length)}</div></div>
          </div>

          {/* Recent results */}
          {recent.length ? (
            <Section title="Recent Results" href="/results">
              <div className="match-grid">
                {recent.map((m) => (
                  <div key={m.game_code} className="match-card">
                    <div className={`side${m.winner === m.team_a ? ' won' : ''}`}>
                      <span className="side-name">{m.team_a}</span>
                      <span className="side-score">{m.winner === m.team_a ? 'W' : 'L'}</span>
                    </div>
                    <div className={`side${m.winner === m.team_b ? ' won' : ''}`}>
                      <span className="side-name">{m.team_b}</span>
                      <span className="side-score">{m.winner === m.team_b ? 'W' : 'L'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          ) : null}

          {/* Top players */}
          {players.length ? (
            <Section title="Top Players" href="/players">
              <StatTable columns={top5(PLAYER_COLUMNS)} rows={players.slice(0, 5)} rowKey="player_key"
                rowHref={{ base: '/players/', key: 'player_key' }} />
            </Section>
          ) : null}

          {/* Top teams */}
          {teams.length ? (
            <Section title="Top Teams" href="/teams">
              <StatTable columns={top5(TEAM_COLUMNS)} rows={teams.slice(0, 5)} rowKey="team_key"
                rowHref={{ base: '/teams/', key: 'team_key' }} />
            </Section>
          ) : null}

          {/* Top heroes */}
          {heroes.length ? (
            <Section title="Top Heroes" href="/heroes">
              <StatTable columns={top5(HERO_COLUMNS)} rows={heroes.slice(0, 5)} rowKey="hero_name" />
            </Section>
          ) : null}
        </>
      )}
    </div>
  );
}
