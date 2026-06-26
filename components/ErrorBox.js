// Shown when an intl API call fails — most likely because the backend's /api/intl/*
// routes aren't deployed yet. Keeps the page shell (nav + filters) usable.
export default function ErrorBox({ error }) {
  return (
    <div className="error-box">
      <strong>Couldn&apos;t load data.</strong>{' '}
      The international API didn&apos;t respond. If the backend was just deployed, give it a
      moment; otherwise confirm the <code>/api/intl/*</code> routes are live and{' '}
      <code>BACKEND_URL</code> / <code>INTERNAL_API_KEY</code> are set.
      {error ? <div className="sub error-detail">{String(error)}</div> : null}
    </div>
  );
}
