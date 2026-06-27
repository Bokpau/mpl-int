import Link from 'next/link';
import { api } from '../../lib/api';
import { pickFeatured, featuredPin } from '../../lib/featured';
import { familyLabel, editionTitle } from '../../lib/filters';
import ErrorBox from '../../components/ErrorBox';

export const metadata = { title: 'Overview' };

// Group editions by tournament family, newest edition first within each.
function groupByFamily(editions) {
  const groups = {};
  for (const e of editions) {
    (groups[e.tournament_code] ??= []).push(e);
  }
  for (const code of Object.keys(groups)) {
    groups[code].sort((a, b) => (Number(b.season_id) || 0) - (Number(a.season_id) || 0));
  }
  // Stable family order: MSC first, then M-Series, then anything else.
  const order = ['MSC', 'MWC'];
  return Object.keys(groups)
    .sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    })
    .map((code) => ({ code, editions: groups[code] }));
}

export default async function HistoryOverview() {
  let editions = [];
  let accolades = [];
  let error = null;
  try {
    [editions, accolades] = await Promise.all([
      api.editions(),
      api.accolades()
    ]);
  } catch (e) {
    error = e.message;
  }

  if (error) return <ErrorBox error={error} />;
  if (!editions || editions.length === 0) {
    return <div className="empty">No editions available yet.</div>;
  }

  const accoladesBySeason = {};
  if (accolades && Array.isArray(accolades)) {
    for (const a of accolades) {
      if (!accoladesBySeason[a.season]) accoladesBySeason[a.season] = {};
      accoladesBySeason[a.season][a.award_type] = a;
    }
  }

  const featured = pickFeatured(editions, featuredPin());
  const isFeatured = (e) =>
    featured && e.tournament_code === featured.tournament_code && String(e.season) === String(featured.season);
  const families = groupByFamily(editions);

  return (
    <div>
      <div className="hist-intro">
        Browse every international edition. Open one to see its standings, players, teams
        and heroes on the main site — or use the tabs above for all-time leaderboards.
      </div>

      {families.map(({ code, editions: list }) => (
        <section key={code} className="edition-section">
          <h2 className="section-title">{familyLabel(code)}</h2>
          <div className="edition-grid">
            {list.map((e) => {
              const live = String(e.status).toLowerCase() === 'live';
              const href = `/?scope=${encodeURIComponent(e.tournament_code)}&season=${encodeURIComponent(e.season)}`;
              const acc = accoladesBySeason[e.season] || {};
              const champion = acc.champion?.recipient;
              const mvp = acc.finals_mvp?.recipient;
              return (
                <Link key={`${e.tournament_code}-${e.season}`} href={href} className="edition-card">
                  <div className="edition-card-top">
                    <span className="edition-name">{editionTitle(e)}</span>
                    {isFeatured(e) ? <span className="badge badge-featured">Featured</span> : null}
                  </div>
                  {champion && (
                    <div className="edition-card-detail">
                      <span className="label">Champion</span>
                      <span className="value">{champion}</span>
                    </div>
                  )}
                  {mvp && (
                    <div className="edition-card-detail">
                      <span className="label">Finals MVP</span>
                      <span className="value">{mvp}</span>
                    </div>
                  )}
                  <div className="edition-card-bottom-row">
                    <span className={`badge ${live ? 'badge-live' : 'badge-done'}`}>
                      {live ? 'Live' : 'Completed'}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
