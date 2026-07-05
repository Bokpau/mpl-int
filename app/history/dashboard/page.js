import { resolveSelection } from '../../../lib/featured';
import DashboardView from '../../../components/views/DashboardView';

export const metadata = { title: 'History Dashboard' };

export default async function HistoryDashboardPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp, false);
  return <DashboardView {...sel} />;
}
