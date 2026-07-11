import './globals.css';
import Nav from '../components/Nav';

const SITE = 'MSC and M-Series By The Bok'; // placeholder branding — rename later (D6)

export const metadata = {
  title: {
    default: `${SITE} · MSC & M-Series Stats`,
    template: `%s · ${SITE}`,
  },
  description:
    'Mid-Season Cup and M-Series World Championship statistics — players, teams, heroes, and nations across every international edition.',
  robots: { index: false, follow: false }, // keep noindex until branding/domain is decided
};

export default function RootLayout({ children }) {
  // The global edition/stage filter lives only in the History section now (it's a
  // history-browsing tool); the main pages show the featured/current edition. So the
  // shell no longer fetches editions here.
  const isDev = process.env.NODE_ENV === 'development';

  return (
    <html lang="en">
      <body>
        <a href="#main" className="skip-link">Skip to main content</a>
        <Nav siteName={SITE} siteNameShort="MSC" />
        <main id="main">{children}</main>
        {isDev && (
          <>
            {/* impeccable-live-start */}
            <script src="http://localhost:8400/live.js"></script>
            {/* impeccable-live-end */}
          </>
        )}
      </body>
    </html>
  );
}
