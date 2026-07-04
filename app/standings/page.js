import { resolveSelection } from '../../lib/featured';
import StandingsView from '../../components/views/StandingsView';

export const metadata = { title: 'Standings' };

export default async function StandingsPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp);
  return <StandingsView {...sel} />;
}
