import Link from 'next/link';
import { api } from '../../lib/api';
import { intlQuery } from '../../lib/filters';
import { getFeatured } from '../../lib/featured';
import { num, int, pct } from '../../lib/format';
import ErrorBox from '../../components/ErrorBox';
import StatTable from '../../components/StatTable';

export const metadata = { title: 'Nations' };

const COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'country', type: 'country', label: 'Country', nameKey: 'country', codeKey: 'country_code', flagKey: 'flag_emoji' },
  { key: 'region_group', type: 'text', label: 'Region' },
  { key: 'players', label: 'Players', format: 'int' },
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
];

// "By Region" now uses the TEAM-SLOT basis (represented country -> region_group),
// from /api/intl/regions, so these cards match the Regions page exactly. The
// country table below stays player-nationality (what the Nations page is about).
function regionCards(standings) {
  const m = {};
  for (const r of standings) {
    const g = r.region_group || 'Other';
    (m[g] ??= { region: g, countries: 0, games: 0, wins: 0 });
    m[g].countries += 1;
    m[g].games += num(r.games);
    m[g].wins += num(r.wins);
  }
  return Object.values(m)
    .map((x) => ({ ...x, win_rate: x.games ? (x.wins / x.games) * 100 : 0 }))
    .sort((a, b) => b.games - a.games);
}

export default async function NationsPage({ searchParams }) {
  const sp = await searchParams;
  const featured = await getFeatured();
  const q = intlQuery(sp, featured);

  // Country table is primary (player nationality); region cards are the team-slot
  // rollup. Fetch both; only a failed nations call blocks the page.
  const [natRes, regRes] = await Promise.allSettled([api.nations(q), api.regions(q)]);
  const rows = natRes.status === 'fulfilled' ? natRes.value : null;
  const error = natRes.status === 'rejected' ? natRes.reason?.message : null;
  const regions = regRes.status === 'fulfilled' ? regionCards(regRes.value.standings || []) : [];

  return (
    <div className="container">
      <div className="page-head">
        <h1>Nations</h1>
        <p>Players by nationality. The region cards use team representation — see <Link href="/regions" className="accent">Regions</Link> for head-to-head.</p>
      </div>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No nationality data for this selection.</div>
      ) : (
        <>
          {regions.length > 0 && (
            <>
              <div className="section-title">By Region <span className="sub">(team representation)</span></div>
              <div className="cards">
                {regions.map((r) => (
                  <div className="card" key={r.region}>
                    <div className="k">{r.region}</div>
                    <div className="v">{pct(r.win_rate)}</div>
                    <div className="sub">{int(r.countries)} countries · {int(r.games)} games</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div className="section-title">By Country <span className="sub">(player nationality)</span></div>
          <StatTable columns={COLUMNS} rows={rows} rowKey="country_code" defaultLimit={20} />
        </>
      )}
    </div>
  );
}
