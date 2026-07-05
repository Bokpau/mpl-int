import { MatchBreakdown } from '../../../components/MatchBreakdown';

export const revalidate = 60;
export const metadata = { title: 'Match Detail' };

export default async function MatchDetailPage({ params }) {
  const { battleId } = await params;
  return (
    <div className="page container">
      <MatchBreakdown battleId={battleId} />
    </div>
  );
}
