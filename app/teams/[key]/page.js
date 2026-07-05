import Link from 'next/link';
import { api } from '../../../lib/api';
import { intlQuery } from '../../../lib/filters';
import { img } from '../../../lib/images';
import { int, dec, pct, wrClass } from '../../../lib/format';
import ErrorBox from '../../../components/ErrorBox';
import StatTable from '../../../components/StatTable';
import TeamLogo from '../../../components/TeamLogo';

const ROSTER_COLUMNS = [
  { key: 'player', type: 'player', label: 'Player', nameKey: 'player', fallbackKey: 'player_key', photoKey: 'photo_url', hrefBase: '/players/', hrefKey: 'player_key' },
  { key: 'nationality', type: 'text', label: 'Nat.' },
  { key: 'games', label: 'Games', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
];

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

export default async function TeamDetail({ params, searchParams }) {
  const { key } = await params;
  const sp = await searchParams;
  const isCurrent = sp.context !== 'history';
  const crumbLink = isCurrent ? '/teams' : '/history/teams';
  const q = intlQuery(sp);

  let data = null;
  let error = null;
  let notFound = false;
  try {
    data = await api.team(key, q);
  } catch (e) {
    if (String(e.message).includes('404')) notFound = true;
    else error = e.message;
  }

  if (error) {
    return (
      <div className="container">
        <div className="crumb"><Link href={crumbLink}>← Teams</Link></div>
        <ErrorBox error={error} />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="container">
        <div className="crumb"><Link href={crumbLink}>← Teams</Link></div>
        <div className="empty">No international record for this team under the current filters.</div>
      </div>
    );
  }

  const t = data.totals;

  return (
    <div className="container">
      <div className="crumb"><Link href={crumbLink}>← Teams</Link></div>

      <div className="detail-head">
        <TeamLogo src={t.team_logo_dark} fallbackSrc={img.team(t.team_code)} alt="" className="big-avatar sq" />
        <div>
          <h1>{t.team_name || t.team_code || data.team_key}</h1>
          <div className="meta">
            {int(t.event_families)} event{int(t.event_families) === 1 ? '' : 's'} · {int(t.editions)} editions · {int(t.matches)} matches
          </div>
        </div>
      </div>

      <div className="cards">
        <Stat k="Games" v={int(t.games)} />
        <Stat k="Wins" v={int(t.wins)} />
        <Stat k="Win%" v={pct(t.win_rate)} cls={wrClass(t.win_rate)} />
        <Stat k="KDA" v={dec(t.kda)} cls="accent" />
        <Stat k="GPM" v={int(Math.round(t.gpm))} />
        <Stat k="DPM" v={int(Math.round(t.dpm))} />
        <Stat k="Lords" v={int(t.lords)} />
        <Stat k="Turtles" v={int(t.turtles)} />
      </div>

      <div className="section-title">By Edition</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="l">Event</th>
              <th className="l">Edition</th>
              <th>Matches</th>
              <th>Games</th>
              <th>Wins</th>
            </tr>
          </thead>
          <tbody>
            {data.by_edition.map((e, i) => {
              return (
                <tr key={i}>
                  <td className="l">{e.tournament_code}</td>
                  <td className="l">
                    <span className="idcell">
                      <TeamLogo src={e.team_logo_dark} fallbackSrc={img.team(e.team_code_era)} alt="" className="avatar sq" />
                      <span className="name">{e.season}{e.team_name_era ? ` · ${e.team_name_era}` : ''}</span>
                    </span>
                  </td>
                  <td>{int(e.matches)}</td>
                  <td>{int(e.games)}</td>
                  <td>{int(e.wins)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="section-title">Roster</div>
      <StatTable
        columns={ROSTER_COLUMNS}
        rows={data.roster}
        rowKey="player_key"
        rowHref={{ base: '/players/', key: 'player_key' }}
      />

      <div className="section-title">Most Picked Heroes</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="l">Hero</th>
              <th>Picks</th>
              <th>Wins</th>
              <th>Win%</th>
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
                  <td>{int(h.picks)}</td>
                  <td>{int(h.wins)}</td>
                  <td className={wrClass(h.win_rate)}>{pct(h.win_rate)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
