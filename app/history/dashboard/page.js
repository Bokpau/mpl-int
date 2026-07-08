import { redirect } from 'next/navigation';
import { resolveSelection } from '../../../lib/featured';
import DashboardView from '../../../components/views/DashboardView';

export const metadata = { title: 'History Dashboard' };

export default async function HistoryDashboardPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp, false);

  // If a specific season or scope is selected, render the original season-scoped DashboardView
  if (sp.season || sp.scope) {
    return <DashboardView {...sel} context="history" />;
  }

  // Otherwise, redirect to the History Home page (which now has the aggregate tables)
  redirect('/history');
}


