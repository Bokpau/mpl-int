import { api } from '../../../lib/api';
import { PLAYER_COLUMNS } from '../../../lib/columns';
import ErrorBox from '../../../components/ErrorBox';
import StatTable from '../../../components/StatTable';
import StatLegend from '../../../components/StatLegend';

export const metadata = { title: 'All-Time Players' };

// All-time player careers across every edition (no season filter).
export default async function HistoryPlayers() {
  let rows = null;
  let error = null;
  try {
    rows = await api.leaderboard('');
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
