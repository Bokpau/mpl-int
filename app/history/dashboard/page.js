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

  // No edition selected — show a prompt to pick one via the filter bar above
  return (
    <div style={{ marginTop: '32px', color: 'var(--muted2)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
      Select an edition using the filter above to view its tournament dashboard.
    </div>
  );
}


