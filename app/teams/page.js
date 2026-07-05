import { resolveCurrent } from '../../lib/featured';
import TeamStatsView from '../../components/views/TeamStatsView';

export const metadata = { title: 'Teams' };

export default async function TeamsPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveCurrent(sp);
  return <TeamStatsView {...sel} context="current" />;
}
