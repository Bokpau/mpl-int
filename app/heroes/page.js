import { resolveCurrent } from '../../lib/featured';
import CurrentHeroStatsView from '../../components/views/CurrentHeroStatsView';

export const metadata = { title: 'Heroes' };

export default async function HeroesPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveCurrent(sp);
  return <CurrentHeroStatsView {...sel} />;
}
