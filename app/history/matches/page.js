import { resolveSelection } from '../../../lib/featured';
import MatchesListView from '../../../components/views/MatchesListView';

export const metadata = { title: 'History Matches' };

export default async function HistoryMatchesPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveSelection(sp, false);
  return <MatchesListView q={sel.q} label={sel.label} isHistory={true} activeStage={sel.eff.stage} division={sel.eff.division} />;
}
