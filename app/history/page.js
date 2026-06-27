import Link from 'next/link';
import { api } from '../../lib/api';
import { pickFeatured, featuredPin } from '../../lib/featured';
import { familyLabel, editionTitle } from '../../lib/filters';
import { int, dec } from '../../lib/format';
import ErrorBox from '../../components/ErrorBox';

export const metadata = { title: 'Overview' };

// Duration formatter: seconds -> "Hh Mm" or "Mm Ss"
function fmtDuration(sec) {
  if (sec == null) return '--';
  const n = parseInt(sec);
  if (isNaN(n) || n <= 0) return '--';
  const h = Math.floor(n / 3600);
  const m = Math.floor((n % 3600) / 60);
  const s = n % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s}s`;
}

// Group editions by tournament family, newest edition first within each.
function groupByFamily(editions) {
  const groups = {};
  for (const e of editions) {
    (groups[e.tournament_code] ??= []).push(e);
  }
  for (const code of Object.keys(groups)) {
    groups[code].sort((a, b) => (Number(b.season_id) || 0) - (Number(a.season_id) || 0));
  }
  const order = ['MSC', 'MWC'];
  return Object.keys(groups)
    .sort((a, b) => {
      const ia = order.indexOf(a), ib = order.indexOf(b);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    })
    .map((code) => ({ code, editions: groups[code] }));
}

// th and td styles matching the design
const th = { 
  padding: '12px 14px', 
  textAlign: 'left', 
  fontSize: '11px', 
  fontWeight: 600, 
  fontFamily: 'var(--font-mono)', 
  color: 'var(--muted2)', 
  textTransform: 'uppercase', 
  letterSpacing: '.06em', 
  borderBottom: '1px solid var(--border)',
  background: 'var(--surface2)'
};

const tdWithLink = { 
  padding: 0,
  borderBottom: '1px solid var(--border)' 
};

export default async function HistoryOverview() {
  let editions = [];
  let accolades = [];
  let overview = null;
  let error = null;
  try {
    [editions, accolades, overview] = await Promise.all([
      api.editions(),
      api.accolades(),
      api.overview()
    ]);
  } catch (e) {
    error = e.message;
  }

  if (error) return <ErrorBox error={error} />;
  if (!editions || editions.length === 0) {
    return <div className="empty">No editions available yet.</div>;
  }

  // Group accolades by season for quick lookup
  const accoladesBySeason = {};
  if (accolades && Array.isArray(accolades)) {
    for (const a of accolades) {
      if (!accoladesBySeason[a.season]) accoladesBySeason[a.season] = {};
      accoladesBySeason[a.season][a.award_type] = a;
    }
  }

  // Sort editions newest first for the list table
  const seasonsDesc = [...editions].sort((a, b) => (Number(b.season_id) || 0) - (Number(a.season_id) || 0));

  // Timeline groups (sorted oldest to newest)
  const mscSeasons = editions
    .filter(e => e.tournament_code === 'MSC')
    .sort((a, b) => (Number(a.season_id) || 0) - (Number(b.season_id) || 0));

  const mwcSeasons = editions
    .filter(e => e.tournament_code === 'MWC')
    .sort((a, b) => (Number(a.season_id) || 0) - (Number(b.season_id) || 0));

  const featured = pickFeatured(editions, featuredPin());
  const isFeatured = (e) =>
    featured && e.tournament_code === featured.tournament_code && String(e.season) === String(featured.season);

  return (
    <div>
      <div className="hist-intro" style={{ marginBottom: '24px' }}>
        Browse every international edition. Click on any card or table row to view its full details scoped on the main site.
      </div>

      {/* ── Champion Timelines ── */}
      <div className="section-title" style={{ marginTop: '32px', marginBottom: '16px', fontSize: '18px' }}>Champion Timelines</div>
      
      {/* MSC Timeline */}
      {mscSeasons.length > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            Mid-Season Cup (MSC)
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px' }}>
            {mscSeasons.map(e => {
              const href = `/?scope=${encodeURIComponent(e.tournament_code)}&season=${encodeURIComponent(e.season)}`;
              const acc = accoladesBySeason[e.season] || {};
              const ch = acc.champion;
              const logo = ch?.logo_dark || ch?.logo_light;
              const teamCode = ch?.team_code || ch?.recipient || '—';
              return (
                <Link key={e.season} href={href}
                  className="edition-card"
                  style={{
                    minWidth: '120px', padding: '12px 10px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                    color: 'var(--text)', flexShrink: 0,
                    transition: 'border-color 0.15s, transform 0.15s',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    {e.season.replace('MSC ', '')}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '6px 0', height: '36px' }}>
                    {logo
                      ? <img src={logo} alt={teamCode} style={{ maxHeight: '32px', maxWidth: '32px', objectFit: 'contain' }} />
                      : <span style={{ fontSize: '18px', color: 'var(--muted2)' }}>—</span>}
                  </div>
                  <div style={{
                    fontSize: '10px', color: 'var(--text)', fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px'
                  }}>
                    {teamCode}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* M-Series Timeline */}
      {mwcSeasons.length > 0 && (
        <div style={{ marginBottom: '32px' }}>
          <div style={{ fontSize: '10px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '1.2px', marginBottom: '8px', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
            M-Series World Championship
          </div>
          <div style={{ display: 'flex', overflowX: 'auto', gap: '8px', paddingBottom: '8px' }}>
            {mwcSeasons.map(e => {
              const href = `/?scope=${encodeURIComponent(e.tournament_code)}&season=${encodeURIComponent(e.season)}`;
              const acc = accoladesBySeason[e.season] || {};
              const ch = acc.champion;
              const logo = ch?.logo_dark || ch?.logo_light;
              const teamCode = ch?.team_code || ch?.recipient || '—';
              return (
                <Link key={e.season} href={href}
                  className="edition-card"
                  style={{
                    minWidth: '120px', padding: '12px 10px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    textAlign: 'center',
                    color: 'var(--text)', flexShrink: 0,
                    transition: 'border-color 0.15s, transform 0.15s',
                    borderRadius: 'var(--radius-sm)'
                  }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                    {e.season}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: '6px 0', height: '36px' }}>
                    {logo
                      ? <img src={logo} alt={teamCode} style={{ maxHeight: '32px', maxWidth: '32px', objectFit: 'contain' }} />
                      : <span style={{ fontSize: '18px', color: 'var(--muted2)' }}>—</span>}
                  </div>
                  <div style={{
                    fontSize: '10px', color: 'var(--text)', fontWeight: 600,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    textTransform: 'uppercase', fontFamily: 'var(--font-mono)', letterSpacing: '0.5px'
                  }}>
                    {teamCode}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Champions & MVPs Table ── */}
      <div className="section-title" style={{ fontSize: '18px', marginBottom: '16px' }}>Champions & MVPs</div>
      {seasonsDesc.length > 0 && (
        <div style={{ overflowX: 'auto', marginBottom: '40px', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: 'var(--surface)', color: 'var(--muted2)' }}>
                <th style={th}>Tournament</th>
                <th style={th}>Champion</th>
                <th style={th}>Finals MVP</th>
              </tr>
            </thead>
            <tbody>
              {seasonsDesc.map(e => {
                const live = String(e.status).toLowerCase() === 'live';
                const href = `/?scope=${encodeURIComponent(e.tournament_code)}&season=${encodeURIComponent(e.season)}`;
                const acc = accoladesBySeason[e.season] || {};
                const ch = acc.champion;
                const mvp = acc.finals_mvp;
                const champLogo = ch?.logo_dark || ch?.logo_light;
                const mvpLogo = mvp?.logo_dark || mvp?.logo_light;

                return (
                  <tr key={`${e.tournament_code}-${e.season}`}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background-color 0.15s' }}
                    className="clickable">
                    <td style={tdWithLink}>
                      <Link href={href} style={{ display: 'block', padding: '12px 14px', width: '100%', height: '100%', fontWeight: 700, color: 'var(--accent)' }}>
                        {editionTitle(e)}
                      </Link>
                    </td>
                    <td style={tdWithLink}>
                      <Link href={href} style={{ display: 'block', padding: '12px 14px', width: '100%', height: '100%' }}>
                        {live ? (
                          <span className="badge badge-live">Live Now</span>
                        ) : ch ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {champLogo && <img src={champLogo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />}
                            <span style={{ fontWeight: 700, color: 'var(--text)' }}>{ch.recipient}</span>
                          </div>
                        ) : <span style={{ color: 'var(--muted2)' }}>—</span>}
                      </Link>
                    </td>
                    <td style={tdWithLink}>
                      <Link href={href} style={{ display: 'block', padding: '12px 14px', width: '100%', height: '100%' }}>
                        {live ? (
                          <span style={{ color: 'var(--muted2)' }}>—</span>
                        ) : mvp ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {mvpLogo && <img src={mvpLogo} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain' }} />}
                            <span style={{ color: 'var(--text)', fontWeight: 600 }}>{mvp.recipient}</span>
                            <span className="sub" style={{ fontSize: '11px', color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
                              ({mvp.team_code})
                            </span>
                          </div>
                        ) : <span style={{ color: 'var(--muted2)' }}>—</span>}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ── International Overview ── */}
      <div className="section-title" style={{ fontSize: '18px', marginBottom: '16px' }}>International Overview</div>
      {!overview && <p style={{ color: 'var(--muted2)' }}>Loading overview…</p>}
      {overview && (() => {
        const { totals: T, per_game: P, season_highs: H } = overview;
        const sh = (key) => {
          const h = H?.[key];
          if (!h || !h.season) return null;
          return `${h.season} — ${int(h.value)}`;
        };
        const shTime = (key) => {
          const h = H?.[key];
          if (!h || !h.season) return null;
          return `${h.season} — ${fmtDuration(h.value)}`;
        };

        const STATS = [
          { label: 'Seasons', val: int(T.seasons), avg: null, high: null },
          { label: 'Matches', val: int(T.matches), avg: null, high: sh('matches') },
          { label: 'Games', val: int(T.games), avg: null, high: sh('games') },
          { label: 'Game Time', val: fmtDuration(T.game_time_s), avg: fmtDuration(P.game_time_s), high: shTime('game_time_s') },
          { label: 'Kills', val: int(T.kills), avg: dec(P.kills, 1), high: sh('kills') },
          { label: 'Deaths', val: int(T.deaths), avg: dec(P.deaths, 1), high: sh('deaths') },
          { label: 'Assists', val: int(T.assists), avg: dec(P.assists, 1), high: sh('assists') },
          { label: 'Gold', val: int(T.gold), avg: int(P.gold), high: sh('gold') },
          { label: 'Dmg Dealt', val: int(T.damage_dealt), avg: int(P.damage_dealt), high: sh('damage_dealt') },
          { label: 'Dmg Taken', val: int(T.damage_taken), avg: int(P.damage_taken), high: sh('damage_taken') },
          { label: 'Savages', val: int(T.savages), avg: null, high: sh('savages') },
          { label: 'Turtles', val: int(T.turtles), avg: null, high: sh('turtles') },
          { label: 'Lords', val: int(T.lords), avg: null, high: sh('lords') },
          { label: 'Turrets', val: int(T.turrets), avg: null, high: sh('turrets') },
          { label: 'Unique Heroes', val: int(T.unique_heroes), avg: null, high: sh('unique_heroes') },
        ];

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '8px', marginTop: '10px' }}>
            {STATS.map(s => (
              <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '4px' }}>{s.label}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--text)', marginBottom: '2px' }}>{s.val}</div>
                {s.avg && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--muted2)' }}>Avg/game: {s.avg}</div>}
                {s.high && <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--accent)', marginTop: '4px' }}>Best: {s.high}</div>}
              </div>
            ))}
          </div>
        );
      })()}
    </div>
  );
}
