export const metadata = { title: 'Privacy Policy' };

const SECTION = { margin: '0 0 28px' };
const H2 = { fontSize: 18, fontWeight: 700, color: 'var(--text)', margin: '0 0 8px' };
const P = { color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, margin: '0 0 10px' };
const UL = { color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, margin: '0 0 10px', paddingLeft: 20 };

export default function PrivacyPage() {
  return (
    <div className="container" style={{ maxWidth: 760, padding: '32px 20px 80px' }}>
      <div className="page-head">
        <div className="page-eyebrow">Legal</div>
        <h1>Privacy Policy</h1>
        <p>Last updated: 25 July 2026</p>
      </div>

      <div style={SECTION}>
        <p style={P}>
          This site (MSC &amp; M-Series Stats, "the site") publishes public Mobile Legends: Bang Bang
          esports statistics. It does not require an account, does not accept user submissions, and
          does not knowingly collect personal information from visitors. This page explains what
          limited data is collected and how it is used.
        </p>
      </div>

      <div style={SECTION}>
        <h2 style={H2}>What we collect</h2>
        <p style={P}>
          We use Vercel Web Analytics to understand overall traffic — for example, which pages are
          popular and roughly where visitors come from. This analytics tool:
        </p>
        <ul style={UL}>
          <li>Does not use cookies</li>
          <li>Does not store IP addresses</li>
          <li>Does not track individual visitors across sessions or across other websites</li>
          <li>Only reports aggregated, anonymized numbers (e.g. "500 visits to /players this week")</li>
        </ul>
        <p style={P}>
          We do not use advertising trackers, and we do not run our own visitor logging beyond this.
        </p>
      </div>

      <div style={SECTION}>
        <h2 style={H2}>Accounts and forms</h2>
        <p style={P}>
          The site has no login, no sign-up, and no contact or comment forms. We do not collect
          names, emails, or any other personal data through the site itself.
        </p>
      </div>

      <div style={SECTION}>
        <h2 style={H2}>Third-party services</h2>
        <p style={P}>
          Player/team photos and logos are served through the jsDelivr CDN. Loading an image may
          share your IP address with jsDelivr in the same way it would with any CDN, under their own
          privacy policy. No other third-party services run on this site.
        </p>
      </div>

      <div style={SECTION}>
        <h2 style={H2}>Your rights</h2>
        <p style={P}>
          Because we do not collect or store personal data, there is nothing tied to you to access,
          correct, or delete. If you believe that has changed or have any privacy question, contact
          us using the details below and we will look into it.
        </p>
      </div>

      <div style={SECTION}>
        <h2 style={H2}>Children's privacy</h2>
        <p style={P}>
          The site is a public sports-statistics reference and is not directed at children. We do
          not knowingly collect personal information from anyone, including children.
        </p>
      </div>

      <div style={SECTION}>
        <h2 style={H2}>Changes to this policy</h2>
        <p style={P}>
          If what we collect changes (for example, if we add a feature that needs personal data),
          we will update this page and the "last updated" date above.
        </p>
      </div>

      <div style={SECTION}>
        <h2 style={H2}>Data &amp; image credits</h2>
        <p style={P}>
          This is an unofficial, fan-made statistics site. It is not affiliated with, endorsed by,
          or sponsored by MOONTON Games or any tournament organizer.
        </p>
        <ul style={UL}>
          <li>Mobile Legends: Bang Bang, hero art, and in-game assets are © MOONTON Games.</li>
          <li>Team logos, team names, and player photos belong to their respective teams, organizations, and players.</li>
          <li>Match results, brackets, and biographical data are sourced from official tournament broadcasts/organizers and Liquipedia.</li>
        </ul>
        <p style={P}>
          All such material is used for informational, non-commercial statistical reporting.
          Rights holders who want an image or credit corrected or removed can reach us using the
          contact details below.
        </p>
      </div>

      <div style={SECTION}>
        <h2 style={H2}>Contact</h2>
        <p style={P}>
          Questions about this policy: <a href="mailto:deguzmanpaulo.jpdg@gmail.com">deguzmanpaulo.jpdg@gmail.com</a>
        </p>
      </div>
    </div>
  );
}
