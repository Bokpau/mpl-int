import { resolveSelection } from '../../lib/featured';
import MatchesListView from '../../components/views/MatchesListView';

export const metadata = { title: 'Matches' };

export default async function ResultsPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp);
  // Client list view fetches the rich per-game data; it only needs the resolved
  // edition query string + heading label.
  return <MatchesListView q={sel.q} label={sel.label} />;
}
