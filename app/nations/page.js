import { resolveCurrent } from '../../lib/featured';
import NationsView from '../../components/views/NationsView';

export const metadata = { title: 'Nations' };

export default async function NationsPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveCurrent(sp);
  return <NationsView {...sel} />;
}
