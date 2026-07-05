import { resolveSelection } from '../../../lib/featured';
import NationsView from '../../../components/views/NationsView';

export const metadata = { title: 'All-Time Nations' };

export default async function HistoryNations({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp, false); // featured=null -> aggregate by default
  return <NationsView {...sel} />;
}
