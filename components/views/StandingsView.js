import { api } from '../../lib/api';
import ErrorBox from '../ErrorBox';
import PageHead from '../PageHead';
import StatTable from '../StatTable';
import { num } from '../../lib/format';

// League-table view: a leaner, wins-first cut of the team data.
const STANDINGS_COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'team', type: 'team', label: 'Team', nameKey: 'team_name', codeKey: 'team_code', fallbackKey: 'team_key', logoKey: 'team_logo_dark', hrefBase: '/teams/', hrefKey: 'team_key' },
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'losses', label: 'Losses', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
];

// Team standings for one selection. Selection-agnostic — the caller resolves
// `q`/`label` (resolveSelection for history, resolveCurrent for the live edition).
export default async function StandingsView({ q, label, eff, context = 'current' }) {
  let rows = null;
  let error = null;
  try {
    const teams = await api.teams(q);
    // Derive losses from games − wins (the endpoint exposes games + wins).
    rows = teams.map((t) => ({ ...t, losses: Math.max(0, num(t.games) - num(t.wins)) }));
  } catch (e) {
    error = e.message;
  }

  const isSeasonFiltered = context === 'current' || (eff && !!eff.season);
  const configuredColumns = STANDINGS_COLUMNS.map(c => {
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
      <PageHead eyebrow={label} title="Standings">
        Team standings for the selected edition, ranked by wins. Click a team for its full history.
      </PageHead>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No standings for this selection.</div>
      ) : (
        <StatTable
          columns={configuredColumns}
          rows={rows}
          rowKey="team_key"
          rowHref={{ base: '/teams/', key: 'team_key', query: { context } }}
          initialSort={{ key: 'wins', dir: 'desc' }}
        />
      )}
    </div>
  );
}
