import { resolveSelection } from '../../lib/featured';
import RegionsView from '../../components/views/RegionsView';

export const metadata = { title: 'Regions' };

export default async function RegionsPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp);
  return <RegionsView {...sel} />;
}
