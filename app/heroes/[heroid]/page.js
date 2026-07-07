import Link from 'next/link';
import { api } from '../../../lib/api';
import { resolveCurrent } from '../../../lib/featured';
import ErrorBox from '../../../components/ErrorBox';
import CurrentHeroDashboard from './CurrentHeroDashboard';

export async function generateMetadata({ params }) {
  const { heroid } = await params;
  try {
    const overview = await api.heroOverview(heroid);
    return { title: overview?.hero_name || `Hero ${heroid}` };
  } catch {
    return { title: `Hero ${heroid}` };
  }
}

// Specific hero detail page locked strictly to the current tournament.
export default async function HeroDetail({ params, searchParams }) {
  const { heroid } = await params;
  const sp = await searchParams;

  const sel = await resolveCurrent(sp);

  let initialOverview = null;
  let error = null;
  let notFound = false;
  try {
    initialOverview = await api.heroOverview(heroid, sel.q);
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

  if (notFound || !initialOverview) {
    return (
      <div className="container">
        <div className="crumb"><Link href="/heroes">← Heroes</Link></div>
        <div className="empty">Unknown hero.</div>
      </div>
    );
  }

  return (
    <CurrentHeroDashboard
      heroid={heroid}
      scope={sel.eff.scope || 'MSC'}
      season={sel.eff.season || '2026'}
      initialOverview={initialOverview}
    />
  );
}
