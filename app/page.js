import { resolveSelection } from '../lib/featured';
import DashboardView from '../components/views/DashboardView';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp);
  return <DashboardView {...sel} />;
}
