import { Suspense } from 'react';
import FilterBar from '../../components/FilterBar';
import { api } from '../../lib/api';

export const metadata = {
  title: { default: 'History', template: '%s · History · MLBB International' },
};

// The History section is where you browse across editions. The global filter
// (Event / Edition / Stage / Games) lives ONLY here — the main pages show the
// current edition. `featured={null}` means History defaults to the all-editions
// aggregate; pick an edition to narrow it.
export default async function HistoryLayout({ children }) {
  let editions = [];
  try {
    editions = await api.editions();
  } catch {
    editions = [];
  }

  return (
    <div className="container">
      <div className="page-head">
        <div className="page-eyebrow">International</div>
        <h1>History</h1>
        <p>Every MSC and M-Series edition. Filter by event, edition, stage, or games — or leave it on all-editions for the all-time leaderboards.</p>
      </div>
      <Suspense fallback={<div className="filterbar" />}>
        <FilterBar editions={editions} featured={null} />
      </Suspense>
      {children}
    </div>
  );
}
