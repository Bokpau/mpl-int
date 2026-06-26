import Link from 'next/link';
import { api } from '../../lib/api';
import { intlQuery } from '../../lib/filters';
import { num, int, dec, pct, wrClass } from '../../lib/format';
import ErrorBox from '../../components/ErrorBox';

export const metadata = { title: 'Nations' };

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
  const q = intlQuery(sp);

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
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="l">#</th>
                  <th className="l">Country</th>
                  <th className="l">Region</th>
                  <th>Players</th>
                  <th>Games</th>
                  <th>Wins</th>
                  <th>Win%</th>
                  <th>KDA</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.country_code}>
                    <td className="l rank">{i + 1}</td>
                    <td className="l">
                      <span className="idcell">
                        <span style={{ fontSize: 18 }}>{r.flag_emoji || '🏳️'}</span>
                        <span className="name">{r.country || r.country_code}</span>
                      </span>
                    </td>
                    <td className="l sub">{r.region_group || '—'}</td>
                    <td>{int(r.players)}</td>
                    <td>{int(r.games)}</td>
                    <td>{int(r.wins)}</td>
                    <td className={wrClass(r.win_rate)}>{pct(r.win_rate)}</td>
                    <td className="accent">{dec(r.kda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
