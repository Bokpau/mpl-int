import Link from 'next/link';

/* ── Site footer ───────────────────────────────────────────────────────────
   Ported from the PH site (mpl-ph-s17/components/Footer.js) so both sites
   carry the same legal block and sitemap shape. Two deliberate differences:

   - No "data updated" stamp. This app is render-only with no database of its
     own, so the date would need a new endpoint on mpl-ph-s17-backend.
   - The link lists are spelled out here rather than imported from Nav.js,
     which is a client component. Keep them in step with the NAV const there.
   ------------------------------------------------------------------------ */
const SOCIALS = [
  { label: 'Facebook', href: 'https://www.facebook.com/jpaulodg' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com/in/john-paulo-de-guzman-b97708255/' },
];

const CONTACT_EMAIL = 'deguzmanpaulo.jpdg@gmail.com';

const STATS_LINKS = [
  { label: 'Player Stats', href: '/players' },
  { label: 'Hero Stats', href: '/heroes' },
  { label: 'Team Stats', href: '/teams' },
  { label: 'Draft Stats', href: '/draft' },
  { label: 'Nations', href: '/nations' },
  { label: 'Regions', href: '/regions' },
  { label: 'Matches', href: '/matches' },
];

const HISTORY_LINKS = [
  { label: 'History Home', href: '/history' },
  { label: 'Tournament', href: '/history/dashboard' },
  { label: 'Matches', href: '/history/matches' },
  { label: 'Players', href: '/history/players' },
  { label: 'Teams', href: '/history/teams' },
  { label: 'Heroes', href: '/history/heroes' },
  { label: 'Nations', href: '/history/nations' },
  { label: 'Regions', href: '/history/regions' },
  { label: 'Records', href: '/history/records' },
];

function FooterCol({ title, links }) {
  return (
    <div className="footer-col">
      <div className="footer-col-title">{title}</div>
      <ul className="footer-col-list">
        {links.map(l => (
          <li key={l.href}>
            <Link href={l.href} className="footer-link">{l.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="container footer-inner">

        {/* Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            MSC &amp; <span className="footer-logo-accent">M-Series</span>
          </div>
          <div className="footer-byline">by the Bok</div>
          <p className="footer-blurb">
            Player, team, hero and nation statistics across every international
            Mobile Legends edition.
          </p>
          {SOCIALS.length > 0 && (
            <div className="footer-socials">
              {SOCIALS.map(s => (
                <a
                  key={s.href}
                  href={s.href}
                  className="footer-link"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {s.label}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Sitemap */}
        <FooterCol title="Stats" links={STATS_LINKS} />
        <FooterCol title="History" links={HISTORY_LINKS} />
      </div>

      {/* Legal bar */}
      <div className="container footer-legal">
        <div className="footer-legal-row">
          <span>© {year} BytheBok. All rights reserved.</span>
          <span className="footer-sep">·</span>
          <Link href="/privacy" className="footer-link">Privacy Policy</Link>
          <span className="footer-sep">·</span>
          <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link">Contact</a>
          <span className="footer-sep">·</span>
          <a
            href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('MSC & M-Series Stats — data correction')}`}
            className="footer-link"
          >
            Report a data error
          </a>
        </div>

        <p className="footer-source">
          Statistics compiled from official MSC and M-Series match data.
        </p>

        <p className="footer-disclaimer">
          Unofficial fan project. Not affiliated with, endorsed by, or sponsored by
          Moonton or any participating team or organization. Mobile Legends:
          Bang&nbsp;Bang and all related game assets are the property of Shanghai
          Moonton Technology Co., Ltd. Team names, logos and player likenesses are
          the property of their respective owners and are used here for
          identification purposes only.
        </p>
      </div>
    </footer>
  );
}
