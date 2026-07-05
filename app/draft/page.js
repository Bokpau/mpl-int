import { resolveSelection } from '../../lib/featured';
import DraftStatsView from '../../components/views/DraftStatsView';

export const metadata = { title: 'Draft Stats' };

export default async function DraftPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp);
  return <DraftStatsView {...sel} />;
}
