import { api } from '../../lib/api';
import ErrorBox from '../ErrorBox';
import PageHead from '../PageHead';
import StatTable from '../StatTable';
import StatLegend from '../StatLegend';
import { PLAYER_COLUMNS as COLUMNS, STAT_GROUPS } from '../../lib/columns';

// Player leaderboard for one selection. Selection-agnostic — the caller resolves
// `q`/`label` (resolveSelection for history, resolveCurrent for the live edition).
export default async function PlayerStatsView({ q, label }) {
  let rows = null;
  let error = null;
  try {
    rows = await api.leaderboard(q);
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Player Stats">
        Player leaderboard grouped by stable identity — rename- and account-proof. Use the Games filter to set a minimum.
      </PageHead>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No players for this selection.</div>
      ) : (
        <StatTable
          columns={COLUMNS}
          groups={STAT_GROUPS}
          rows={rows}
          rowKey="player_key"
          rowHref={{ base: '/players/', key: 'player_key' }}
          defaultLimit={20}
        />
      )}

      {rows && rows.length > 0 ? <StatLegend keys={['Win%', 'KDA', 'KP%', 'GPM', 'DPM', 'MVPs', 'Editions']} /> : null}
    </div>
  );
}
