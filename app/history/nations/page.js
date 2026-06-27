import { api } from '../../../lib/api';
import { NATION_COLUMNS } from '../../../lib/columns';
import ErrorBox from '../../../components/ErrorBox';
import StatTable from '../../../components/StatTable';

export const metadata = { title: 'All-Time Nations' };

// All-time player nationality leaderboard across every edition (no season filter).
export default async function HistoryNations() {
  let rows = null;
  let error = null;
  try {
    rows = await api.nations('');
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
