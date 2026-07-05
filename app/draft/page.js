import { resolveCurrent } from '../../lib/featured';
import DraftStatsView from '../../components/views/DraftStatsView';

export const metadata = { title: 'Draft Stats' };

export default async function DraftPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveCurrent(sp);
  return <DraftStatsView {...sel} />;
}
