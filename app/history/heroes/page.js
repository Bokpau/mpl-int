import { resolveSelection } from '../../../lib/featured';
import HeroStatsView from '../../../components/views/HeroStatsView';

export const metadata = { title: 'All-Time Heroes' };

export default async function HistoryHeroes({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp, false); // featured=null -> aggregate by default
  return <HeroStatsView {...sel} />;
}
