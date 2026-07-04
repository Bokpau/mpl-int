import { resolveSelection } from '../../lib/featured';
import TeamStatsView from '../../components/views/TeamStatsView';

export const metadata = { title: 'Teams' };

export default async function TeamsPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp);
  return <TeamStatsView {...sel} />;
}
