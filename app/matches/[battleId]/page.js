import { MatchBreakdown } from '../../../components/MatchBreakdown';

export const revalidate = 60;
export const metadata = { title: 'Match Detail' };

export default async function MatchDetailPage({ params, searchParams }) {
  const { battleId } = await params;
  const sp = (await searchParams) || {};
  const isCurrent = sp.context !== 'history';
  const division = sp.division;
  return (
    <div className="page container">
      <MatchBreakdown battleId={battleId} isCurrent={isCurrent} division={division} />
    </div>
  );
}
