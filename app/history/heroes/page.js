import { api } from '../../../lib/api';
import { HERO_COLUMNS } from '../../../lib/columns';
import ErrorBox from '../../../components/ErrorBox';
import StatTable from '../../../components/StatTable';
import StatLegend from '../../../components/StatLegend';

export const metadata = { title: 'All-Time Heroes' };

// All-time hero pick/win%/KDA across every edition (no season filter).
export default async function HistoryHeroes() {
  let rows = null;
  let error = null;
  try {
    rows = await api.heroes('');
  } catch (e) {
    error = e.message;
  }

  return (
    <div>
      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No hero data yet.</div>
      ) : (
        <>
          <StatTable columns={HERO_COLUMNS} rows={rows} rowKey="hero_id" defaultLimit={20} />
          <StatLegend keys={['Win%', 'KDA', 'Picks']} />
        </>
      )}
    </div>
  );
}
