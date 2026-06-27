import { api } from '../../../lib/api';
import { intlQuery } from '../../../lib/filters';
import { TEAM_COLUMNS } from '../../../lib/columns';
import ErrorBox from '../../../components/ErrorBox';
import StatTable from '../../../components/StatTable';
import StatLegend from '../../../components/StatLegend';

export const metadata = { title: 'All-Time Teams' };

// Team records — all editions by default; the History filter bar narrows them.
export default async function HistoryTeams({ searchParams }) {
  const sp = await searchParams;
  const q = intlQuery(sp, null);
  let rows = null;
  let error = null;
  try {
    rows = await api.teams(q);
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
