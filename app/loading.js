// Shown during navigation while a page's server data is fetched. Mirrors the
// page shell (head + table) so filter changes don't look frozen.
export default function Loading() {
  return (
    <div className="container" aria-hidden="true">
      <div className="page-head">
        <div className="skeleton sk-title" />
        <div className="skeleton sk-sub" />
      </div>
      <div className="skeleton-table">
        {Array.from({ length: 10 }).map((_, i) => (
          <div className="skeleton sk-row" key={i} />
        ))}
      </div>
    </div>
  );
}
