import HistorySubNav from './HistorySubNav';

export const metadata = {
  title: { default: 'History', template: '%s · History · MLBB International' },
};

// The History section is the cross-edition, all-time view. It deliberately does NOT
// show the global filter bar (hidden in Nav for /history/*) — these pages are always
// all-editions. Use the Overview tab to jump into a single edition on the main site.
export default function HistoryLayout({ children }) {
  return (
    <div className="container">
      <div className="page-head">
        <div className="page-eyebrow">All Editions</div>
        <h1>History</h1>
        <p>Every MSC and M-Series edition combined — all-time leaderboards and the full edition index.</p>
      </div>
      <HistorySubNav />
      {children}
    </div>
  );
}
