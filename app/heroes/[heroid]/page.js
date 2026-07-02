import Link from 'next/link';
import { api } from '../../../lib/api';
import { intlQuery } from '../../../lib/filters';
import { img } from '../../../lib/images';
import { int, dec } from '../../../lib/format';
import ErrorBox from '../../../components/ErrorBox';
import HeroDetailTabs from './HeroDetailTabs';

export async function generateMetadata({ params }) {
  const { heroid } = await params;
  return { title: `Hero ${heroid}` };
}

// Hero detail page. Overview/synergy/vs-teams/win-loss/players work for every
// edition (box-score data). Role distribution and ban stats only populate for
// MSC 2026-forward games (sourced from the intl_ rich mirror tables) — older,
// CSV-imported editions never captured a role or ban field, so those sections
// render an empty state instead of erroring for those editions.
export default async function HeroDetail({ params, searchParams }) {
  const { heroid } = await params;
  const sp = await searchParams;
  const q = intlQuery(sp);

  let overview = null;
  let error = null;
  let notFound = false;
  try {
    overview = await api.heroOverview(heroid, q);
  } catch (e) {
    if (String(e.message).includes('404')) notFound = true;
    else error = e.message;
  }

  if (error) {
    return (
      <div className="container">
        <div className="crumb"><Link href="/heroes">← Heroes</Link></div>
        <ErrorBox error={error} />
      </div>
    );
  }

  if (notFound || !overview) {
    return (
      <div className="container">
        <div className="crumb"><Link href="/heroes">← Heroes</Link></div>
        <div className="empty">Unknown hero.</div>
      </div>
    );
  }

  // Sections that never error the page — a slow/failed one just renders empty.
  const [synergy, vsTeams, winLoss, roles, bans, players] = await Promise.all([
    api.heroSynergy(heroid, q).catch(() => ({ played_with: [], played_against: [] })),
    api.heroVsTeams(heroid, q).catch(() => []),
    api.heroWinLoss(heroid, q).catch(() => []),
    api.heroRoles(heroid).catch(() => ({ role_distribution: [], primary_role: null, role_matchup: [] })),
    api.heroBans(heroid).catch(() => ({ bans: 0, games_with_draft: 0, ban_rate: null })),
    api.leaderboard(q, heroid).catch(() => []),
  ]);

  const portrait = img.hero(heroid);

  return (
    <div className="container">
      <div className="crumb"><Link href="/heroes">← Heroes</Link></div>

      <div className="detail-head">
        {portrait ? <img className="big-avatar" src={portrait} alt="" /> : null}
        <div>
          <h1>{overview.hero_name || `Hero ${heroid}`}</h1>
          <div className="meta">
            {int(overview.picks)} picks · {overview.win_rate != null ? `${dec(overview.win_rate, 1)}% win rate` : '—'} ·{' '}
            {overview.kda != null ? `${dec(overview.kda)} KDA` : '—'}
          </div>
        </div>
      </div>

      <HeroDetailTabs
        heroid={heroid}
        overview={overview}
        synergy={synergy}
        vsTeams={vsTeams}
        winLoss={winLoss}
        roles={roles}
        bans={bans}
        players={players}
      />
    </div>
  );
}
