import { resolveSelection } from '../../../lib/featured';
import RegionsView from '../../../components/views/RegionsView';

export const metadata = { title: 'History Regions' };

export default async function HistoryRegionsPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp, false);
  return <RegionsView {...sel} />;
}
