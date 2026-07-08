import { resolveSelection } from '../../../lib/featured';
import { api } from '../../../lib/api';
import DashboardView from '../../../components/views/DashboardView';
import PageHead from '../../../components/PageHead';
import HistoryDashboardClient from './HistoryDashboardClient';

export const metadata = { title: 'History Dashboard' };

export default async function HistoryDashboardPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp, false);

  // If a specific season or scope is selected, render the original season-scoped DashboardView
  if (sp.season || sp.scope) {
    return <DashboardView {...sel} context="history" />;
  }

  // Otherwise, fetch all-time aggregate lists for the overall History Dashboard redesign
  let editions = [];
  let accolades = [];
  let standings = [];
  let teams = [];
  let players = [];
  let error = null;

  try {
    [editions, accolades, standings, teams, players] = await Promise.all([
      api.editions(),
      api.accolades(),
      api.standings(),
      api.teams(),
      api.leaderboard()
    ]);
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="container">
      <PageHead eyebrow="History" title="History Dashboard">
        The international history archive — browse tournaments, teams, and players across all editions.
      </PageHead>
      
      {error ? (
        <div className="empty" style={{ color: 'var(--loss)', marginTop: '24px' }}>
          Failed to load history data: {error}
        </div>
      ) : (
        <HistoryDashboardClient
          editions={editions}
          accolades={accolades}
          standings={standings}
          teams={teams}
          players={players}
        />
      )}
    </div>
  );
}

