import Link from 'next/link';
import { api } from '../../../lib/api';
import { intlQuery } from '../../../lib/filters';
import { img } from '../../../lib/images';
import { int, dec, pct, wrClass } from '../../../lib/format';
import ErrorBox from '../../../components/ErrorBox';

export async function generateMetadata({ params }) {
  const { key } = await params;
  return { title: decodeURIComponent(key) };
}

function Stat({ k, v, cls }) {
  return (
    <div className="card">
      <div className="k">{k}</div>
      <div className={`v ${cls || ''}`}>{v}</div>
    </div>
  );
}

export default async function PlayerDetail({ params, searchParams }) {
  const { key } = await params;
  const sp = await searchParams;
  const q = intlQuery(sp);

  let data = null;
  let error = null;
  let notFound = false;
  try {
    data = await api.player(key, q);
  } catch (e) {
    if (String(e.message).includes('404')) notFound = true;
    else error = e.message;
  }

  if (error) {
    return (
      <div className="container">
        <div className="crumb"><Link href="/">← Players</Link></div>
        <ErrorBox error={error} />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="container">
        <div className="crumb"><Link href="/">← Players</Link></div>
        <div className="empty">No international record for this player under the current filters.</div>
      </div>
    );
  }

  const t = data.totals;

  return (
    <div className="container">
      <div className="crumb"><Link href="/">← Players</Link></div>

      <div className="detail-head">
        <div>
          <h1>{t.player || data.player_key}</h1>
          <div className="meta">
            {t.latest_team ? `${t.latest_team} · ` : ''}
            {t.nationality ? `${t.nationality} · ` : ''}
            {int(t.event_families)} event{int(t.event_families) === 1 ? '' : 's'} · {int(t.editions)} editions
          </div>
        </div>
      </div>

      <div className="cards">
        <Stat k="Games" v={int(t.games)} />
        <Stat k="Win%" v={pct(t.win_rate)} cls={wrClass(t.win_rate)} />
        <Stat k="KDA" v={dec(t.kda)} cls="accent" />
        <Stat k="KP%" v={t.kp == null ? '—' : pct(t.kp)} />
        <Stat k="GPM" v={int(Math.round(t.gpm))} />
        <Stat k="DPM" v={int(Math.round(t.dpm))} />
        <Stat k="MVPs" v={int(t.mvps)} />
        <Stat k="Heroes" v={int(t.unique_heroes)} />
      </div>

      <div className="section-title">By Edition</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="l">Event</th>
              <th className="l">Edition</th>
              <th className="l">Team</th>
              <th>Games</th>
              <th>Wins</th>
              <th>KDA</th>
            </tr>
          </thead>
          <tbody>
            {data.by_edition.map((e, i) => (
              <tr key={i}>
                <td className="l">{e.tournament_code}</td>
                <td className="l">{e.season}</td>
                <td className="l sub">{e.team_code || '—'}</td>
                <td>{int(e.games)}</td>
                <td>{int(e.wins)}</td>
                <td className="accent">{dec(e.kda)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="section-title">Hero Pool</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="l">Hero</th>
              <th>Games</th>
              <th>Wins</th>
              <th>KDA</th>
              <th>Avg K</th>
            </tr>
          </thead>
          <tbody>
            {data.by_hero.map((h, i) => {
              const portrait = img.hero(h.hero_id);
              return (
                <tr key={i}>
                  <td className="l">
                    <span className="idcell">
                      {portrait ? <img className="avatar" src={portrait} alt="" /> : null}
                      <span className="name">{h.hero_name || '—'}</span>
                    </span>
                  </td>
                  <td>{int(h.games)}</td>
                  <td>{int(h.wins)}</td>
                  <td className="accent">{dec(h.kda)}</td>
                  <td>{dec(h.avg_kills)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
