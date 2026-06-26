import { api } from '../../lib/api';
import { intlQuery } from '../../lib/filters';
import { img } from '../../lib/images';
import { int, dec, pct, wrClass } from '../../lib/format';
import ErrorBox from '../../components/ErrorBox';

export const metadata = { title: 'Heroes' };

export default async function HeroesPage({ searchParams }) {
  const sp = await searchParams;
  const q = intlQuery(sp);

  let rows = null;
  let error = null;
  try {
    rows = await api.heroes(q);
  } catch (e) {
    error = e.message;
  }

  return (
    <div className="container">
      <div className="page-head">
        <h1>Heroes</h1>
        <p>Pick counts, win rate and KDA across international play for the current selection.</p>
      </div>

      {error ? (
        <ErrorBox error={error} />
      ) : !rows || rows.length === 0 ? (
        <div className="empty">No hero data for this selection.</div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th className="l">#</th>
                <th className="l">Hero</th>
                <th>Picks</th>
                <th>Wins</th>
                <th>Win%</th>
                <th>KDA</th>
                <th>Players</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const portrait = img.hero(r.hero_id);
                return (
                  <tr key={`${r.hero_name}-${i}`}>
                    <td className="l rank">{i + 1}</td>
                    <td className="l">
                      <span className="idcell">
                        {portrait ? <img className="avatar" src={portrait} alt="" /> : null}
                        <span className="name">{r.hero_name || '—'}</span>
                      </span>
                    </td>
                    <td>{int(r.picks)}</td>
                    <td>{int(r.wins)}</td>
                    <td className={wrClass(r.win_rate)}>{pct(r.win_rate)}</td>
                    <td className="accent">{dec(r.kda)}</td>
                    <td>{int(r.players)}</td>
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
