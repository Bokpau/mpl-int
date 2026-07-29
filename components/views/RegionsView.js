import { api } from '../../lib/api';
import ErrorBox from '../ErrorBox';
import PageHead from '../PageHead';
import StatTable from '../StatTable';
import H2HSection from '../H2HSection';

const COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'country', type: 'country', label: 'Region', nameKey: 'country', codeKey: 'country_code', flagKey: 'flag_emoji' },
  { key: 'region_group', type: 'text', label: 'Group' },
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
];

// Region (team-slot) standings + head-to-head for one selection. Selection-agnostic
// — the caller resolves `q`/`label`.
export default async function RegionsView({ q, label }) {
  let data = null;
  let error = null;
  try {
    data = await api.regions(q);
  } catch (e) {
    error = e.message;
  }

  const standings = data?.standings || [];
  const h2h = data?.h2h || [];
  const matchH2h = data?.match_h2h || [];

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Regions">
        By the country a team&apos;s <em>slot</em> represents (e.g. ONIC PH = PH) — not player nationality.
      </PageHead>

      {error ? (
        <ErrorBox error={error} />
      ) : standings.length === 0 ? (
        <div className="empty">No region data for this selection.</div>
      ) : (
        <>
          <div className="section-title">Standings</div>
          <StatTable columns={COLUMNS} rows={standings} rowKey="country_code" defaultLimit={20} />

          <div className="section-title" style={{ marginTop: 40 }}>Head-to-Head</div>
          <H2HSection standings={standings} h2h={h2h} matchH2h={matchH2h} match_h2h={matchH2h} />
        </>
      )}
    </div>
  );
}
