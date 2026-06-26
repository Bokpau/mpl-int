import { api } from '../../lib/api';
import { intlQuery } from '../../lib/filters';
import { num, int, dec, pct, wrClass } from '../../lib/format';
import ErrorBox from '../../components/ErrorBox';

export const metadata = { title: 'Nations' };

// Roll the per-country rows up into region groups (SEA, LATAM, …) for the summary.
function byRegion(rows) {
  const m = {};
  for (const r of rows) {
    const g = r.region_group || 'Other';
    (m[g] ??= { region: g, countries: 0, players: 0, games: 0, wins: 0 });
    m[g].countries += 1;
    m[g].players += num(r.players);
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

  let rows = null;
  let error = null;
  try {
    rows = await api.nations(q);
  } catch (e) {
    error = e.message;
  }

  const regions = rows ? byRegion(rows) : [];

  return (
    <div className="container">
      <div className="page-head">
        <h1>Nations</h1>
        <p>International performance by player nationality. Players with no recorded nationality are omitted.</p>
      </div>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No nationality data for this selection.</div>
      ) : (
        <>
          <div className="section-title">By Region</div>
          <div className="cards">
            {regions.map((r) => (
              <div className="card" key={r.region}>
                <div className="k">{r.region}</div>
                <div className="v">{pct(r.win_rate)}</div>
                <div className="sub">{int(r.countries)} countries · {int(r.players)} players · {int(r.games)} games</div>
              </div>
            ))}
          </div>

          <div className="section-title">By Country</div>
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
