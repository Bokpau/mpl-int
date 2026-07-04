import Link from 'next/link';
import { api } from '../../../lib/api';
import { intlQuery } from '../../../lib/filters';
import { img } from '../../../lib/images';
import { int } from '../../../lib/format';
import ErrorBox from '../../../components/ErrorBox';
import PlayerLegacy from './PlayerLegacy';

export async function generateMetadata({ params }) {
  const { key } = await params;
  return { title: decodeURIComponent(key) };
}

// Full player legacy profile — career, per-team, per-season, hero pool, vs teams,
// vs nation, and head-to-head compare. All editions by default; the History filter
// bar (?season=…&stage=…) narrows every section the same way.
export default async function PlayerDetail({ params, searchParams }) {
  const { key } = await params;
  const sp = await searchParams;
  const q = intlQuery(sp);

  let career = null;
  let error = null;
  let notFound = false;
  try {
    career = await api.playerCareer(key, q);
  } catch (e) {
    if (String(e.message).includes('404')) notFound = true;
    else error = e.message;
  }

  if (error) {
    return (
      <div className="container">
        <div className="crumb"><Link href="/history/players">← Players</Link></div>
        <ErrorBox error={error} />
      </div>
    );
  }

  if (notFound || !career || !career.totals) {
    return (
      <div className="container">
        <div className="crumb"><Link href="/history/players">← Players</Link></div>
        <div className="empty">No international record for this player under the current filters.</div>
      </div>
    );
  }

  // The remaining sections always exist for a player with games; fall back to empty
  // shapes so one slow/failed section never blanks the whole page.
  const [seasons, heroes, vsTeams, vsNations, players] = await Promise.all([
    api.playerSeasons(key, q).catch(() => null),
    api.playerHeroes(key, q).catch(() => []),
    api.playerVsTeams(key, q).catch(() => []),
    api.playerVsNations(key, q).catch(() => []),
    api.leaderboard(q).catch(() => []),
  ]);

  const t = career.totals;
  const logo = img.team(t.latest_team_code);
  // Prefer the player's per-era photo; fall back to the team logo when there's none.
  const photo = t.photo_url;

  return (
    <div className="container">
      <div className="crumb"><Link href="/history/players">← Players</Link></div>

      <div className="detail-head">
        {photo
          ? <img className="big-avatar sq" src={photo} alt="" style={{ objectFit: 'cover', objectPosition: 'top' }} />
          : logo ? <img className="big-avatar sq" src={logo} alt="" /> : null}
        <div>
          <h1>{t.player || key}</h1>
          <div className="meta">
            {t.country_flag ? `${t.country_flag} ` : ''}
            {t.country ? `${t.country} · ` : ''}
            {t.latest_team ? `${t.latest_team} · ` : ''}
            {int(t.seasons_played)} editions · {int(t.matches_played)} matches · {int(t.games_played)} games
          </div>
        </div>
      </div>

      <PlayerLegacy
        playerKey={key}
        query={q}
        career={career}
        seasons={seasons}
        heroes={heroes}
        vsTeams={vsTeams}
        vsNations={vsNations}
        players={players}
      />
    </div>
  );
}
