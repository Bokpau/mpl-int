import { resolveCurrent } from '../../lib/featured';
import { api } from '../../lib/api';
import PlayerStatsView from '../../components/views/PlayerStatsView';

export const metadata = { title: 'Player Stats' };

export default async function PlayersPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveCurrent(sp);
  let initialRows = [];
  try {
    initialRows = await api.leaderboard(sel.q);
  } catch (e) {
    initialRows = [];
  }
  return <PlayerStatsView {...sel} initialRows={initialRows} context="current" />;
}
