import Link from 'next/link';
import { redirect } from 'next/navigation';
import { api } from '../../../lib/api';
import { getFeatured } from '../../../lib/featured';
import ErrorBox from '../../../components/ErrorBox';
import CurrentPlayerDashboard from './CurrentPlayerDashboard';

export async function generateMetadata({ params }) {
  const { key } = await params;
  return { title: decodeURIComponent(key) };
}

// Current-tournament player dashboard (rich, MSC/MWC current edition only). Locked to
// the featured edition. If the player has no rows in the current edition, we redirect
// to their historical career profile — the two pages are otherwise independent (no
// shared layout, no cross-links). See plans/recreate-player-page-plan.md.
export default async function CurrentPlayerPage({ params }) {
  const { key } = await params;

  const featured = await getFeatured();
  // No featured edition resolvable -> there is no "current" context to show; send the
  // visitor to the standalone history profile.
  if (!featured) redirect(`/history/players/${encodeURIComponent(key)}`);

  const scope = featured.tournament_code;
  const season = featured.season;
  const q = `?scope=${encodeURIComponent(scope)}&season=${encodeURIComponent(season)}`;

  let initial = null;
  let error = null;
  let notCurrent = false;
  try {
    initial = await api.currentPlayer(key, q);
  } catch (e) {
    // 404 from the backend = player not in the current edition -> history redirect.
    // Any other error (e.g. backend unreachable) surfaces, so a transient failure
    // never silently punts a real participant to history.
    if (String(e.message).includes('404')) notCurrent = true;
    else error = e.message;
  }

  if (notCurrent) redirect(`/history/players/${encodeURIComponent(key)}`);

  if (error) {
    return (
      <div className="container">
        <div className="crumb"><Link href="/players">← Players</Link></div>
        <ErrorBox error={error} />
      </div>
    );
  }

  return (
    <CurrentPlayerDashboard
      playerKey={key}
      scope={scope}
      season={season}
      initial={initial}
    />
  );
}
