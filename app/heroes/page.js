import { api } from '../../lib/api';
import { intlQuery } from '../../lib/filters';
import { getFeatured } from '../../lib/featured';
import ErrorBox from '../../components/ErrorBox';
import StatTable from '../../components/StatTable';
import StatLegend from '../../components/StatLegend';

export const metadata = { title: 'Heroes' };

const COLUMNS = [
  { key: '__rank', type: 'rank', label: '#' },
  { key: 'hero', type: 'hero', label: 'Hero', nameKey: 'hero_name', idKey: 'hero_id' },
  { key: 'picks', label: 'Picks', format: 'int' },
  { key: 'wins', label: 'Wins', format: 'int' },
  { key: 'win_rate', label: 'Win%', format: 'pct', wr: true, title: 'Win rate' },
  { key: 'kda', label: 'KDA', format: 'dec', cls: 'accent', title: '(Kills + Assists) / Deaths' },
  { key: 'players', label: 'Players', format: 'int', title: 'Distinct players who picked this hero' },
];

export default async function HeroesPage({ searchParams }) {
  const sp = await searchParams;
  const featured = await getFeatured();
  const q = intlQuery(sp, featured);

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
        <StatTable columns={COLUMNS} rows={rows} rowKey="hero_id" defaultLimit={20} />
      )}

      {rows && rows.length > 0 ? <StatLegend keys={['Win%', 'KDA', 'Picks']} /> : null}
    </div>
  );
}
