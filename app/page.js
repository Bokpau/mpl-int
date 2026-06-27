import { api } from '../lib/api';
import { resolveSelection } from '../lib/featured';
import ErrorBox from '../components/ErrorBox';
import PageHead from '../components/PageHead';
import StatTable from '../components/StatTable';
import StatLegend from '../components/StatLegend';
import { PLAYER_COLUMNS as COLUMNS } from '../lib/columns';

export const metadata = { title: 'Players' };

export default async function PlayersPage({ searchParams }) {
  const sp = await searchParams;
  const { q, label } = await resolveSelection(sp);

  let rows = null;
  let error = null;
  try {
    rows = await api.leaderboard(q);
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Players">
        Player leaderboard grouped by stable identity — rename- and account-proof. Use the Games filter to set a minimum.
      </PageHead>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No players for this selection.</div>
      ) : (
        <StatTable
          columns={COLUMNS}
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
