import { resolveSelection } from '../../../lib/featured';
import { api } from '../../../lib/api';
import { PLAYER_COLUMNS } from '../../../lib/columns';
import PlayerStatsView from '../../../components/views/PlayerStatsView';

export const metadata = { title: 'All-Time Players' };

export default async function HistoryPlayers({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp, false); // featured=null -> aggregate by default
  
  let initialRows = [];
  try {
    initialRows = await api.leaderboard(sel.q);
  } catch (e) {
    initialRows = [];
  }

  // Format player names differently on season-filtered history pages
  const isSeasonFiltered = !!sel.eff.season;
  const configuredColumns = PLAYER_COLUMNS.map(c => {
    if (c.key === 'player') {
      return {
        ...c,
        isHistory: true,
        isSeasonFiltered,
        subKey: isSeasonFiltered ? 'latest_team_name_era' : 'latest_team',
        subFallbackKey: isSeasonFiltered ? 'latest_team_code_era' : 'latest_team_code'
      };
    }
    return c;
  });

  return (
    <PlayerStatsView
      {...sel}
      initialRows={initialRows}
      context="history"
      columns={configuredColumns}
    />
  );
}
