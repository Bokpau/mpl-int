import { Suspense } from 'react';
import { resolveCurrent } from '../../lib/featured';
import MatchesListView from '../../components/views/MatchesListView';
import FilterBar from '../../components/FilterBar';

export const metadata = { title: 'Matches' };

export default async function MatchesPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveCurrent(sp);
  return (
    <>
      <Suspense fallback={<div className="filterbar" />}>
        <FilterBar editions={sel.editions} featured={sel.featured} showEvent={false} showEdition={false} />
      </Suspense>
      <MatchesListView q={sel.q} label={sel.label} />
    </>
  );
}
