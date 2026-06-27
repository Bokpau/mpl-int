import { api } from '../../../lib/api';
import { intlQuery } from '../../../lib/filters';
import { PLAYER_COLUMNS } from '../../../lib/columns';
import ErrorBox from '../../../components/ErrorBox';
import StatTable from '../../../components/StatTable';
import StatLegend from '../../../components/StatLegend';

export const metadata = { title: 'All-Time Players' };

// Player careers — all editions by default; the History filter bar narrows them.
export default async function HistoryPlayers({ searchParams }) {
  const sp = await searchParams;
  const q = intlQuery(sp, null); // featured=null → aggregate unless a filter is set
  let rows = null;
  let error = null;
  try {
    rows = await api.leaderboard(q);
  } catch (e) {
    error = e.message;
  }

  return (
    <div>
      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No players yet.</div>
      ) : (
        <>
          <StatTable
            columns={PLAYER_COLUMNS}
            rows={rows}
            rowKey="player_key"
            rowHref={{ base: '/players/', key: 'player_key' }}
            defaultLimit={20}
          />
          <StatLegend keys={['Win%', 'KDA', 'KP%', 'GPM', 'DPM', 'MVPs', 'Editions']} />
        </>
      )}
    </div>
  );
}
