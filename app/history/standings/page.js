import { resolveSelection } from '../../../lib/featured';
import StandingsView from '../../../components/views/StandingsView';

export const metadata = { title: 'History Standings' };

export default async function HistoryStandingsPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp, false);
  return <StandingsView {...sel} />;
}
