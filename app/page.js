import { api } from '../lib/api';
import { intlQuery } from '../lib/filters';
import ErrorBox from '../components/ErrorBox';
import StatTable from '../components/StatTable';

export const metadata = { title: 'Players' };

const COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'player', type: 'player', label: 'Player', nameKey: 'player', fallbackKey: 'player_key', subKey: 'latest_team', subFallbackKey: 'latest_team_code', hrefBase: '/players/', hrefKey: 'player_key' },
  { key: 'editions', label: 'Editions', format: 'int', title: 'International editions played' },
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
  { key: 'kp', label: 'KP%', format: 'pct', nullDash: true, title: 'Kill participation' },
  { key: 'gpm', label: 'GPM', format: 'int', title: 'Gold per minute' },
  { key: 'dpm', label: 'DPM', format: 'int', title: 'Damage per minute' },
  { key: 'mvps', label: 'MVPs', format: 'int', title: 'Most Valuable Player awards' },
];

export default async function PlayersPage({ searchParams }) {
  const sp = await searchParams;
  const q = intlQuery(sp);

  let rows = null;
  let error = null;
  try {
    rows = await api.leaderboard(q + (q ? '&' : '?') + 'min_games=5');
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>Player Leaderboard</h1>
        <p>International careers grouped by stable player — rename- and account-proof. Min. 5 games.</p>
      </div>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No players for this selection.</div>
      ) : (
        <StatTable
          columns={COLUMNS}
          rows={rows}
          rowKey="player_key"
          rowHref={{ base: '/players/', key: 'player_key' }}
        />
      )}
    </div>
  );
}
