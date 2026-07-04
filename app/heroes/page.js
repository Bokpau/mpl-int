import { resolveSelection } from '../../lib/featured';
import HeroStatsView from '../../components/views/HeroStatsView';

export const metadata = { title: 'Heroes' };

export default async function HeroesPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp);
  return <HeroStatsView {...sel} />;
}
