import { api } from '../../lib/api';
import { resolveSelection } from '../../lib/featured';
import ErrorBox from '../../components/ErrorBox';
import PageHead from '../../components/PageHead';
import StatTable from '../../components/StatTable';
import StatLegend from '../../components/StatLegend';

export const metadata = { title: 'Teams' };

const COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'team', type: 'team', label: 'Team', nameKey: 'team_name', codeKey: 'team_code', fallbackKey: 'team_key', logoKey: 'team_logo_dark', hrefBase: '/teams/', hrefKey: 'team_key' },
  { key: 'editions', label: 'Editions', format: 'int', title: 'International editions played' },
  { key: 'matches', label: 'Matches', format: 'int' },
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
  { key: 'gpm', label: 'GPM', format: 'int', title: 'Gold per minute' },
  { key: 'dpm', label: 'DPM', format: 'int', title: 'Damage per minute' },
];

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
