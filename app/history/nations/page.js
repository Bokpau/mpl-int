import { api } from '../../../lib/api';
import { intlQuery } from '../../../lib/filters';
import { NATION_COLUMNS } from '../../../lib/columns';
import ErrorBox from '../../../components/ErrorBox';
import StatTable from '../../../components/StatTable';

export const metadata = { title: 'All-Time Nations' };

// Player nationality leaderboard — all editions by default; History filter narrows it.
export default async function HistoryNations({ searchParams }) {
  const sp = await searchParams;
  const q = intlQuery(sp, null);
  let rows = null;
  let error = null;
  try {
    rows = await api.nations(q);
  } catch (e) {
    error = e.message;
  }

  return (
    <div>
      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No nationality data yet.</div>
      ) : (
        <StatTable columns={NATION_COLUMNS} rows={rows} rowKey="country_code" defaultLimit={20} />
      )}
    </div>
  );
}
