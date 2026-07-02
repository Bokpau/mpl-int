import { api } from '../../lib/api';
import { resolveSelection } from '../../lib/featured';
import ErrorBox from '../../components/ErrorBox';
import PageHead from '../../components/PageHead';
import StatTable from '../../components/StatTable';
import StatLegend from '../../components/StatLegend';
import { HERO_COLUMNS as COLUMNS, STAT_GROUPS } from '../../lib/columns';

export const metadata = { title: 'Heroes' };

export default async function HeroesPage({ searchParams }) {
  const sp = await searchParams;
  const { q, label } = await resolveSelection(sp);

  let rows = null;
  let error = null;
  try {
    rows = await api.heroes(q);
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Heroes">
        Pick counts, win rate and KDA for the current selection.
      </PageHead>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No hero data for this selection.</div>
      ) : (
        <StatTable
          columns={COLUMNS}
          groups={STAT_GROUPS}
          rows={rows}
          rowKey="hero_id"
          defaultLimit={20}
          rowHref={{ base: '/heroes/', key: 'hero_id' }}
        />
      )}

      {rows && rows.length > 0 ? <StatLegend keys={['Win%', 'KDA', 'Picks']} /> : null}
    </div>
  );
}
