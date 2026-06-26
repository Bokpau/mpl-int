import Link from 'next/link';
import { api } from '../../lib/api';
import { intlQuery } from '../../lib/filters';
import { img } from '../../lib/images';
import { int, dec, pct, wrClass } from '../../lib/format';
import ErrorBox from '../../components/ErrorBox';

export const metadata = { title: 'Teams' };

export default async function TeamsPage({ searchParams }) {
  const sp = await searchParams;
  const q = intlQuery(sp);

  let rows = null;
  let error = null;
  try {
    rows = await api.teams(q);
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>Teams</h1>
        <p>International records grouped by stable franchise — one row spans every edition a team played.</p>
      </div>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No teams for this selection.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="l">#</th>
                <th className="l">Team</th>
                <th>Editions</th>
                <th>Matches</th>
                <th>Games</th>
                <th>Wins</th>
                <th>Win%</th>
                <th>KDA</th>
                <th>GPM</th>
                <th>DPM</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const logo = img.team(r.team_code);
                return (
                  <tr key={r.team_key} className="clickable">
                    <td className="l rank">{i + 1}</td>
                    <td className="l">
                      <Link href={`/teams/${encodeURIComponent(r.team_key)}`}>
                        <span className="idcell">
                          {logo ? <img className="avatar sq" src={logo} alt="" /> : null}
                          <span className="name">{r.team_name || r.team_code || r.team_key}</span>
                        </span>
                      </Link>
                    </td>
                    <td>{int(r.editions)}</td>
                    <td>{int(r.matches)}</td>
                    <td>{int(r.games)}</td>
                    <td>{int(r.wins)}</td>
                    <td className={wrClass(r.win_rate)}>{pct(r.win_rate)}</td>
                    <td className="accent">{dec(r.kda)}</td>
                    <td>{int(Math.round(r.gpm))}</td>
                    <td>{int(Math.round(r.dpm))}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
