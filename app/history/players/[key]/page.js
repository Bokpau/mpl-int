import Link from 'next/link';
import { api } from '../../../../lib/api';
import { intlQuery } from '../../../../lib/filters';
import { resolveTeam } from '../../../../lib/identity';
import { int } from '../../../../lib/format';
import { cdnify } from '../../../../lib/images';
import ErrorBox from '../../../../components/ErrorBox';
import PlayerLegacy from '../../../players/[key]/PlayerLegacy';
import { PlayerPhoto } from '../../../../components/Images';

export async function generateMetadata({ params }) {
  const { key } = await params;
  return { title: decodeURIComponent(key) };
}

// Historical / legacy player profile — the full career rollup across all editions:
// career, per-team, per-season, hero pool, vs teams, vs nation, head-to-head compare.
// Fully filterable via the History FilterBar (?season=…&stage=…&min_games=…) provided
// by app/history/layout.js. Standalone from the current-tournament dashboard at
// /players/[key] — no rich dashboard here, no link back to the current page.
export default async function HistoryPlayerDetail({ params, searchParams }) {
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
      <>
        <div className="crumb"><Link href="/history/players">← Players</Link></div>
        <ErrorBox error={error} />
      </>
    );
  }

  if (notFound || !career || !career.totals) {
    return (
      <>
        <div className="crumb"><Link href="/history/players">← Players</Link></div>
        <div className="empty">No international record for this player under the current filters.</div>
      </>
    );
  }

  const [seasons, heroes, vsTeams, vsNations, players] = await Promise.all([
    api.playerSeasons(key, q).catch(() => null),
    api.playerHeroes(key, q).catch(() => []),
    api.playerVsTeams(key, q).catch(() => []),
    api.playerVsNations(key, q).catch(() => []),
    api.leaderboard(q).catch(() => []),
  ]);

  const t = career.totals;
  // History/all-time context: franchise identity (e.g. FLCN / Team Falcons). See lib/identity.js.
  const team = resolveTeam(t, 'alltime');
  const logo = team.logo;
  const photo = t.photo_url;

  return (
    <>
      <div className="crumb"><Link href="/history/players">← Players</Link></div>

      <div className="detail-head">
        <PlayerPhoto photoUrl={photo} name={t.player || key} size={88} zoom={1.3} style={{ borderRadius: 12 }} />
        <div>
          <h1>{t.player || key}</h1>
          <div className="meta">
            {t.country_flag ? `${t.country_flag} ` : ''}
            {t.country ? `${t.country} · ` : ''}
            {team.name ? `${team.name} · ` : ''}
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
    </>
  );
}
