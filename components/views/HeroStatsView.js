import { api } from '../../lib/api';
import ErrorBox from '../ErrorBox';
import PageHead from '../PageHead';
import StatTable from '../StatTable';
import StatLegend from '../StatLegend';
import { HERO_COLUMNS as COLUMNS, STAT_GROUPS } from '../../lib/columns';

// Hero leaderboard for one selection. Selection-agnostic — the caller resolves `q`/`label`.
export default async function HeroStatsView({ q, label }) {
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
