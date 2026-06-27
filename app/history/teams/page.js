import { api } from '../../../lib/api';
import { TEAM_COLUMNS } from '../../../lib/columns';
import ErrorBox from '../../../components/ErrorBox';
import StatTable from '../../../components/StatTable';
import StatLegend from '../../../components/StatLegend';

export const metadata = { title: 'All-Time Teams' };

// All-time team records across every edition (no season filter).
export default async function HistoryTeams() {
  let rows = null;
  let error = null;
  try {
    rows = await api.teams('');
  } catch (e) {
    error = e.message;
  }

  return (
    <div>
      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No teams yet.</div>
      ) : (
        <>
          <StatTable
            columns={TEAM_COLUMNS}
            rows={rows}
            rowKey="team_key"
            rowHref={{ base: '/teams/', key: 'team_key' }}
            defaultLimit={20}
          />
          <StatLegend keys={['Win%', 'KDA', 'GPM', 'DPM', 'Editions']} />
        </>
      )}
    </div>
  );
}
