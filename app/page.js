import { Suspense } from 'react';
import { resolveCurrent } from '../lib/featured';
import DashboardView from '../components/views/DashboardView';
import FilterBar from '../components/FilterBar';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage({ searchParams }) {
  const sp = await searchParams;
  const sel = await resolveCurrent(sp);
  return (
    <>
      <Suspense fallback={<div className="filterbar" />}>
        <FilterBar editions={sel.editions} featured={sel.featured} showEvent={false} showEdition={false} />
      </Suspense>
      <DashboardView {...sel} />
    </>
  );
}
