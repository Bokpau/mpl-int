import { api } from '../../lib/api';
import ErrorBox from '../ErrorBox';
import PageHead from '../PageHead';
import StatTable from '../StatTable';
import StatLegend from '../StatLegend';
import { TEAM_COLUMNS as COLUMNS, STAT_GROUPS } from '../../lib/columns';

// Team leaderboard for one selection. Selection-agnostic — the caller resolves `q`/`label`.
export default async function TeamStatsView({ q, label, eff, context = 'current' }) {
  let rows = null;
  let error = null;
  try {
    rows = await api.teams(q);
  } catch (e) {
    error = e.message;
  }

  const isSeasonFiltered = context === 'current' || (eff && !!eff.season);
  const configuredColumns = COLUMNS.map(c => {
    if (c.key === 'team') {
      return {
        ...c,
        nameKey: isSeasonFiltered ? 'team_name_era' : 'team_name',
        codeKey: isSeasonFiltered ? 'team_code_era' : 'team_code',
        query: { context }
      };
    }
    return c;
  });

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
          columns={configuredColumns}
          groups={STAT_GROUPS}
          rows={rows}
          rowKey="team_key"
          rowHref={{ base: '/teams/', key: 'team_key', query: { context } }}
          defaultLimit={20}
        />
      )}

      {rows && rows.length > 0 ? <StatLegend keys={['Win%', 'KDA', 'GPM', 'DPM', 'Editions']} /> : null}
    </div>
  );
}
