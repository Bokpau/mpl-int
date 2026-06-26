import Link from 'next/link';
import { api } from '../lib/api';
import { intlQuery } from '../lib/filters';
import { int, dec, pct, wrClass } from '../lib/format';
import ErrorBox from '../components/ErrorBox';

export const metadata = { title: 'Players' };

export default async function PlayersPage({ searchParams }) {
  const sp = await searchParams;
  const q = intlQuery(sp);

  let rows = null;
  let error = null;
  try {
    rows = await api.leaderboard(q + (q ? '&' : '?') + 'min_games=5');
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>Player Leaderboard</h1>
        <p>International careers grouped by stable player — rename- and account-proof. Min. 5 games.</p>
      </div>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No players for this selection.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="l">#</th>
                <th className="l">Player</th>
                <th>Editions</th>
                <th>Games</th>
                <th>Win%</th>
                <th>KDA</th>
                <th>KP%</th>
                <th>GPM</th>
                <th>DPM</th>
                <th>MVPs</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.player_key} className="clickable">
                  <td className="l rank">{i + 1}</td>
                  <td className="l">
                    <Link href={`/players/${encodeURIComponent(r.player_key)}`}>
                      <span className="idcell">
                        <span className="name">{r.player || r.player_key}</span>
                      </span>
                      <span className="sub">{r.latest_team || r.latest_team_code || ''}</span>
                    </Link>
                  </td>
                  <td>{int(r.editions)}</td>
                  <td>{int(r.games)}</td>
                  <td className={wrClass(r.win_rate)}>{pct(r.win_rate)}</td>
                  <td className="accent">{dec(r.kda)}</td>
                  <td>{r.kp == null ? '—' : pct(r.kp)}</td>
                  <td>{int(Math.round(r.gpm))}</td>
                  <td>{int(Math.round(r.dpm))}</td>
                  <td>{int(r.mvps)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
