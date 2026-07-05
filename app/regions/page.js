import { resolveCurrent } from '../../lib/featured';
import RegionsView from '../../components/views/RegionsView';

export const metadata = { title: 'Regions' };

export default async function RegionsPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveCurrent(sp);
  return <RegionsView {...sel} />;
}
