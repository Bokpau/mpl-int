import { resolveSelection } from '../../lib/featured';
import MatchesView from '../../components/views/MatchesView';

export const metadata = { title: 'Results' };

export default async function ResultsPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp);
  return <MatchesView {...sel} />;
}
