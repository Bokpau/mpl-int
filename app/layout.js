import './globals.css';
import Nav from '../components/Nav';
import { api } from '../lib/api';

const SITE = 'MLBB International'; // placeholder branding — rename later (D6)

export const metadata = {
  title: {
    default: `${SITE} · MSC & M-Series Stats`,
    template: `%s · ${SITE}`,
  },
  description:
    'Mid-Season Cup and M-Series World Championship statistics — players, teams, heroes, and nations across every international edition.',
  robots: { index: false, follow: false }, // keep noindex until branding/domain is decided
};

export default async function RootLayout({ children }) {
  // Fetch the edition list once for the filter bar. Stay resilient: if the backend
  // isn't reachable yet (intl routes not deployed), render with no editions rather
  // than crashing the whole app.
  let editions = [];
  try {
    editions = await api.editions();
  } catch {
    editions = [];
  }

  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <Nav siteName={SITE} editions={editions} />
        <main id="main">{children}</main>
      </body>
    </html>
  );
}
