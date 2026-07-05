import { resolveSelection } from '../../../lib/featured';
import TeamStatsView from '../../../components/views/TeamStatsView';

export const metadata = { title: 'All-Time Teams' };

export default async function HistoryTeams({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp, false); // featured=null -> aggregate by default
  return <TeamStatsView {...sel} context="history" />;
}
