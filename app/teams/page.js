import { api } from '../../lib/api';
import { resolveSelection } from '../../lib/featured';
import ErrorBox from '../../components/ErrorBox';
import PageHead from '../../components/PageHead';
import StatTable from '../../components/StatTable';
import StatLegend from '../../components/StatLegend';
import { TEAM_COLUMNS as COLUMNS, STAT_GROUPS } from '../../lib/columns';

export const metadata = { title: 'Teams' };

export default async function TeamsPage({ searchParams }) {
  const sp = await searchParams;
  const { q, label } = await resolveSelection(sp);

  let rows = null;
  let error = null;
  try {
    rows = await api.teams(q);
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Teams">
        Team records grouped by stable franchise — rename- and rebrand-proof.
      </PageHead>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No teams for this selection.</div>
      ) : (
        <StatTable
          columns={COLUMNS}
          groups={STAT_GROUPS}
          rows={rows}
          rowKey="team_key"
          rowHref={{ base: '/teams/', key: 'team_key' }}
          defaultLimit={20}
        />
      )}

      {rows && rows.length > 0 ? <StatLegend keys={['Win%', 'KDA', 'GPM', 'DPM', 'Editions']} /> : null}
    </div>
  );
}
