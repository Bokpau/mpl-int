import { api } from '../../lib/api';
import { intlQuery } from '../../lib/filters';
import { num, int, pct, wrClass } from '../../lib/format';
import ErrorBox from '../../components/ErrorBox';

export const metadata = { title: 'Regions' };

// How many countries to include in the head-to-head matrix (by games played).
const MATRIX_N = 8;

export default async function RegionsPage({ searchParams }) {
  const sp = await searchParams;
  const q = intlQuery(sp);

  let data = null;
  let error = null;
  try {
    data = await api.regions(q);
  } catch (e) {
    error = e.message;
  }

  const standings = data?.standings || [];
  const h2h = data?.h2h || [];

  // Directed wins lookup: "WINNER|LOSER" -> wins.
  const wmap = {};
  for (const r of h2h) wmap[`${r.winner_country}|${r.loser_country}`] = num(r.wins);

  // Top countries by games for the matrix; carry flag for headers.
  const top = [...standings].sort((a, b) => num(b.games) - num(a.games)).slice(0, MATRIX_N);

  return (
    <div className="container">
      <div className="page-head">
        <h1>Regions</h1>
        <p>By the country a team&apos;s <em>slot</em> represents (e.g. ONIC PH = PH) — not player nationality.</p>
      </div>

      {error ? (
        <ErrorBox error={error} />
      ) : standings.length === 0 ? (
        <div className="empty">No region data for this selection.</div>
      ) : (
        <>
          <div className="section-title">Standings</div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th className="l">#</th>
                  <th className="l">Region</th>
                  <th className="l">Group</th>
                  <th>Games</th>
                  <th>Wins</th>
                  <th>Win%</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((r, i) => (
                  <tr key={r.country_code}>
                    <td className="l rank">{i + 1}</td>
                    <td className="l">
                      <span className="idcell">
                        <span style={{ fontSize: 18 }}>{r.flag_emoji || '🏳️'}</span>
                        <span className="name">{r.country || r.country_code}</span>
                      </span>
                    </td>
                    <td className="l sub">{r.region_group || '—'}</td>
                    <td>{int(r.games)}</td>
                    <td>{int(r.wins)}</td>
                    <td className={wrClass(r.win_rate)}>{pct(r.win_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="section-title">Head-to-Head</div>
          <p className="sub" style={{ margin: '0 0 10px' }}>
            Top {top.length} regions by games. Cell = row region&apos;s wins over the column region (win% shaded).
          </p>
          <div className="table-wrap">
            <table className="h2h">
              <thead>
                <tr>
                  <th className="l corner">vs</th>
                  {top.map((c) => (
                    <th key={c.country_code} title={c.country || c.country_code}>
                      <span style={{ fontSize: 15 }}>{c.flag_emoji || ''}</span> {c.country_code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {top.map((row) => (
                  <tr key={row.country_code}>
                    <td className="l corner">
                      <span style={{ fontSize: 15 }}>{row.flag_emoji || ''}</span> {row.country_code}
                    </td>
                    {top.map((col) => {
                      if (row.country_code === col.country_code) return <td key={col.country_code} className="diag">—</td>;
                      const a = wmap[`${row.country_code}|${col.country_code}`] || 0;
                      const b = wmap[`${col.country_code}|${row.country_code}`] || 0;
                      const total = a + b;
                      if (!total) return <td key={col.country_code} className="sub">·</td>;
                      const wr = (a / total) * 100;
                      return (
                        <td key={col.country_code} className={wr >= 50 ? 'pos' : 'neg'} title={`${a}–${b}`}>
                          {a}<span className="sub">–{b}</span>
                        </td>
                      );
                    })}
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
