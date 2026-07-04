import { resolveSelection } from '../../lib/featured';
import PlayerStatsView from '../../components/views/PlayerStatsView';

export const metadata = { title: 'Player Stats' };

export default async function PlayersPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp);
  return <PlayerStatsView {...sel} />;
}
