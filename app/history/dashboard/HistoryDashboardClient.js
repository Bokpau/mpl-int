'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import TeamLogo from '../../../components/TeamLogo';
import { PlayerPhoto } from '../../../components/Images';
import { img, getTournamentLogo, CDN_BASE } from '../../../lib/images';

// ── Date helpers ─────────────────────────────────────────────────────────────
// Parse date string as local date (handles both 'YYYY-MM-DD' and ISO timestamp strings).
function parseLocal(str) {
  if (!str || typeof str !== 'string') return null;
  // Take only the first 10 chars (YYYY-MM-DD) to handle ISO timestamps from PG
  const parts = str.substring(0, 10).split('-').map(Number);
  if (parts.length < 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

const MONTH = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// "Jul 10 – 14, 2024"  |  "Nov 21 – Dec 15, 2024"  |  "Nov 10 – Dec 17, 2023"
function formatDateRange(startStr, endStr) {
  const start = parseLocal(startStr);
  const end   = parseLocal(endStr);
  if (!start && !end) return '—';
  if (!start) return `${MONTH[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
  if (!end)   return `${MONTH[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()}`;

  const sy = start.getFullYear(), ey = end.getFullYear();
  const sm = start.getMonth(),    em = end.getMonth();
  const sd = start.getDate(),     ed = end.getDate();

  if (sy === ey) {
    if (sm === em)
      return `${MONTH[sm]} ${sd} – ${ed}, ${sy}`;
    return `${MONTH[sm]} ${sd} – ${MONTH[em]} ${ed}, ${sy}`;
  }
  return `${MONTH[sm]} ${sd}, ${sy} – ${MONTH[em]} ${ed}, ${ey}`;
}

// ── Runner-up fallback table for early editions without DB standings ───────
const EARLY_RUNNER_UPS = {
  'MSC 2017': { team_key: null, team_code: 'Salty Salad',   team_name: 'Salty Salad',              logo_dark: `${CDN_BASE}/intl_teamlogo/Salty_Salad_allmode.png`,        country_flag: '🇵🇭' },
  'MSC 2018': { team_key: null, team_code: 'Digital Devils', team_name: 'Digital Devils Pro Gaming', logo_dark: `${CDN_BASE}/intl_teamlogo/Digital_Devils_Pro_allmode.png`, country_flag: '🇮🇩' },
  'MSC 2019': { team_key: null, team_code: 'Louvre Esports', team_name: 'Louvre Esports',            logo_dark: `${CDN_BASE}/intl_teamlogo/Louvre_allmode.png`,             country_flag: '🇮🇩' },
};

// ── Intl team logo overrides for standings-derived runner-ups whose DB
// logo_dark is null and whose logos live in intl_teamlogo/ not teamlogo/.
const INTL_LOGO_OVERRIDES = {
  'burmese ghouls': 'Burmese_Ghouls_allmode.png',
  'bg':             'Burmese_Ghouls_allmode.png',
};

function intlLogo(code) {
  if (!code) return null;
  const file = INTL_LOGO_OVERRIDES[code.toLowerCase().trim()];
  return file ? `${CDN_BASE}/intl_teamlogo/${file}` : null;
}

// ── Inline entity display ─────────────────────────────────────────────────────
function TeamEntity({ team_key, team_code, name, logo_dark, flag, asLink = true }) {
  const inner = (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
      <TeamLogo
        src={logo_dark || intlLogo(team_code)}
        fallbackSrc={img.team(team_code)}
        alt=""
        style={{ width: '18px', height: '18px', objectFit: 'contain', flexShrink: 0 }}
      />
      {flag && <span style={{ fontSize: '12px' }}>{flag}</span>}
      <span style={{ fontWeight: 600, fontSize: '13px' }}>{name}</span>
    </span>
  );
  if (!asLink || !team_key) return inner;
  return (
    <Link href={`/teams/${team_key}?context=history`} className="clickable-link" style={{ display: 'inline-block' }}>
      {inner}
    </Link>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function HistoryDashboardClient({
  editions  = [],
  accolades = [],
  standings = [],
  teams     = [],
  eraTeams  = [],
  players   = [],
}) {
  const [activeTab,          setActiveTab]          = useState('tournaments');
  const [teamsSearch,        setTeamsSearch]        = useState('');
  const [playersSearch,      setPlayersSearch]      = useState('');
  const [visibleTeamsCount,  setVisibleTeamsCount]  = useState(25);
  const [visiblePlayersCount,setVisiblePlayersCount]= useState(25);

  // ── 1. Resolve tournaments with champ, runner-up, Finals MVP ─────────────
  const resolvedTournaments = useMemo(() => {
    const list = editions.map(e => {
      const acc = {};
      accolades
        .filter(a => String(a.season) === String(e.season))
        .forEach(a => { acc[a.award_type] = a; });

      // Champion — prefer accolade, fallback to 1st-place standing
      let champion = acc['champion'] || null;
      if (!champion) {
        const row = standings.find(
          s => String(s.tournament_code) === String(e.season) && s.placement === '1st'
        );
        if (row) champion = {
          team_key:  row.team_key,
          team_code: row.team_code,
          recipient: row.team_name,
          logo_dark: row.logo_dark,
          flag_emoji:row.country_flag,
        };
      }

      // Runner-up — early fallback map first, then standing
      let runnerUp = EARLY_RUNNER_UPS[e.season] || null;
      if (!runnerUp) {
        const row = standings.find(
          s => String(s.tournament_code) === String(e.season) && s.placement === '2nd'
        );
        if (row) runnerUp = {
          team_key:    row.team_key,
          team_code:   row.team_code,
          team_name:   row.team_name,
          logo_dark:   row.logo_dark,
          country_flag:row.country_flag,
        };
      }

      // Finals MVP
      const finalsMvp = acc['finals_mvp'] || null;

      return { ...e, champion, runnerUp, finalsMvp };
    });

    // Newest first — sort by season_id descending
    return [...list].sort((a, b) => (Number(b.season_id) || 0) - (Number(a.season_id) || 0));
  }, [editions, accolades, standings]);

  // Live season label (for badge highlighting)
  const liveSeason = useMemo(() => {
    const live = editions.find(e => String(e.status).toLowerCase() === 'live');
    return live ? live.season : null;
  }, [editions]);

  // Merge stats teams + era teams (e.g. MSC 2026 pre-games teams)
  const mergedTeams = useMemo(() => {
    const byKey = new Map();
    // Stats teams first (have full stats + seasons array)
    teams.forEach(t => { if (t.team_key) byKey.set(t.team_key, t); });

    // Add era teams not already in the map (teams registered for the live
    // edition that haven't played yet, so the stats endpoint won't have them).
    const liveEdition = editions.find(e => String(e.status).toLowerCase() === 'live');
    const liveSeasonLabel = liveEdition ? liveEdition.season : null;

    eraTeams.forEach(et => {
      if (!et.team_key || byKey.has(et.team_key)) return;
      byKey.set(et.team_key, {
        team_key:       et.team_key,
        team_code:      et.era_code,
        team_name:      et.era_name,
        team_logo_dark: et.team_logo_dark,
        team_logo_light:et.team_logo_light,
        country:        et.country,
        country_flag:   et.country_flag,
        seasons:        liveSeasonLabel ? [liveSeasonLabel] : [],
      });
    });

    // Sort by most appearances (seasons array length) desc, then alphabetically
    return [...byKey.values()].sort((a, b) => {
      const aLen = Array.isArray(a.seasons) ? a.seasons.length : 0;
      const bLen = Array.isArray(b.seasons) ? b.seasons.length : 0;
      if (bLen !== aLen) return bLen - aLen;
      return (a.team_name || '').localeCompare(b.team_name || '');
    });
  }, [teams, eraTeams, editions]);

  const filteredTeams = useMemo(() => {
    const term = teamsSearch.toLowerCase().trim();
    if (!term) return mergedTeams;
    return mergedTeams.filter(t =>
      (t.team_name  || '').toLowerCase().includes(term) ||
      (t.team_code  || '').toLowerCase().includes(term) ||
      (t.country    || '').toLowerCase().includes(term)
    );
  }, [mergedTeams, teamsSearch]);

  const filteredPlayers = useMemo(() => {
    const term = playersSearch.toLowerCase().trim();
    if (!term) return players;
    return players.filter(p =>
      (p.current_player || p.player        || '').toLowerCase().includes(term) ||
      (p.latest_team    || p.latest_team_code|| '').toLowerCase().includes(term) ||
      (p.country        || '').toLowerCase().includes(term)
    );
  }, [players, playersSearch]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getEditionUrl = (e) => {
    const scope  = e.tournament_code;
    const season = e.season;
    return `/history/dashboard?scope=${encodeURIComponent(scope)}&season=${encodeURIComponent(season)}`;
  };

  const getCleanSeasonLabel = (seasonLabel) =>
    String(seasonLabel)
      .replace('World Championship', 'WC')
      .replace(/MLBB (Mid Season Cup|Southeast Asia Cup)/, 'MSC');

  const getEditionUrlFromLabel = (seasonLabel) => {
    const matched = editions.find(e => String(e.season) === String(seasonLabel));
    const scope   = matched ? matched.tournament_code : (String(seasonLabel).startsWith('MSC') ? 'MSC' : 'MWC');
    return `/history/dashboard?scope=${encodeURIComponent(scope)}&season=${encodeURIComponent(seasonLabel)}`;
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Tabs ── */}
      <div className="db-tabs-container" style={{ marginTop: '24px' }}>
        <div className="db-tabs-header">
          {['tournaments', 'teams', 'players'].map(tab => (
            <button
              key={tab}
              type="button"
              className={`db-tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
              style={{ textTransform: 'capitalize' }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>

          {/* ══ TAB 1: TOURNAMENTS ══════════════════════════════════════════ */}
          {activeTab === 'tournaments' && (
            <div className="table-wrap">
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th className="l" style={{ width: '24%', minWidth: '160px' }}>Tournament</th>
                    <th className="l" style={{ width: '13%', minWidth: '110px' }}>Date</th>
                    <th className="l" style={{ width: '13%', minWidth: '100px' }}>Location</th>
                    <th className="l" style={{ width: '17%', minWidth: '130px' }}>Champion</th>
                    <th className="l" style={{ width: '17%', minWidth: '130px' }}>Runner-up</th>
                    <th className="l" style={{ width: '16%', minWidth: '110px' }}>Finals MVP</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedTournaments.map(e => {
                    const logoUrl = getTournamentLogo(e.season);
                    const displayName = e.official_name || e.season;
                    return (
                      <tr key={`${e.tournament_code}-${e.season}`}>
                        {/* Tournament */}
                        <td className="l">
                          <Link href={getEditionUrl(e)} className="clickable-link"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {logoUrl
                              ? <img src={logoUrl} alt="" style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }} />
                              : <span style={{
                                  width: '22px', height: '22px', borderRadius: 'var(--radius-sm)',
                                  background: 'var(--surface2)', display: 'inline-flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  fontSize: '8px', fontWeight: 'bold', flexShrink: 0,
                                }}>{e.tournament_code}</span>
                            }
                            <span style={{ fontWeight: 600, color: 'var(--accent)', fontSize: '13px' }}>
                              {displayName}
                            </span>
                          </Link>
                        </td>

                        {/* Date */}
                        <td className="l" style={{ fontSize: '12px', color: 'var(--muted2)' }}>
                          {formatDateRange(e.start_date, e.end_date)}
                        </td>

                        {/* Location */}
                        <td className="l" style={{ fontSize: '12px', color: 'var(--muted2)' }}>
                          {e.location || '—'}
                        </td>

                        {/* Champion */}
                        <td className="l">
                          {e.champion
                            ? <TeamEntity
                                team_key={e.champion.team_key}
                                team_code={e.champion.team_code || e.champion.recipient}
                                name={e.champion.recipient}
                                logo_dark={e.champion.logo_dark}
                                flag={e.champion.flag_emoji}
                              />
                            : <span style={{ color: 'var(--muted2)' }}>—</span>
                          }
                        </td>

                        {/* Runner-up */}
                        <td className="l">
                          {e.runnerUp
                            ? <TeamEntity
                                team_key={e.runnerUp.team_key}
                                team_code={e.runnerUp.team_code}
                                name={e.runnerUp.team_name}
                                logo_dark={e.runnerUp.logo_dark}
                                flag={e.runnerUp.country_flag}
                              />
                            : <span style={{ color: 'var(--muted2)' }}>—</span>
                          }
                        </td>

                        {/* Finals MVP — player name only (no team logo to save width) */}
                        <td className="l">
                          {e.finalsMvp ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' }}>
                              {e.finalsMvp.flag_emoji && <span style={{ fontSize: '12px' }}>{e.finalsMvp.flag_emoji}</span>}
                              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                                {e.finalsMvp.recipient}
                              </span>
                            </span>
                          ) : (
                            <span style={{ color: 'var(--muted2)' }}>—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ══ TAB 2: TEAMS ════════════════════════════════════════════════ */}
          {activeTab === 'teams' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search teams by name or country..."
                  value={teamsSearch}
                  onChange={ev => { setTeamsSearch(ev.target.value); setVisibleTeamsCount(25); }}
                  style={{
                    width: '100%', maxWidth: '400px', padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)', background: 'var(--surface)',
                    border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px',
                  }}
                />
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th className="l">Team</th>
                      <th className="l">Country</th>
                      <th className="r" style={{ width: '80px' }}>App.</th>
                      <th className="l">Tournaments Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.slice(0, visibleTeamsCount).map(t => (
                      <tr key={t.team_key}>
                        <td className="l">
                          <Link href={`/teams/${t.team_key}?context=history`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                            className="clickable-link">
                            <TeamLogo src={t.team_logo_dark} fallbackSrc={img.team(t.team_code)} alt=""
                              style={{ width: '22px', height: '22px', objectFit: 'contain' }} />
                            <span style={{ fontWeight: 600 }}>{t.team_name || t.team_code}</span>
                          </Link>
                        </td>
                        <td className="l">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {t.country_flag && <span style={{ fontSize: '14px' }}>{t.country_flag}</span>}
                            <span>{t.country || '—'}</span>
                          </span>
                        </td>
                        <td className="r" style={{ fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                          {Array.isArray(t.seasons) ? t.seasons.length : '—'}
                        </td>
                        <td className="l">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {Array.isArray(t.seasons)
                              ? t.seasons.map(s => {
                                  const isLive = s === liveSeason;
                                  return (
                                    <Link key={s} href={getEditionUrlFromLabel(s)}
                                      className={isLive ? 'mini-badge mini-badge--live' : 'mini-badge'}>
                                      {getCleanSeasonLabel(s)}
                                    </Link>
                                  );
                                })
                              : <span style={{ color: 'var(--muted2)' }}>—</span>
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredTeams.length === 0 && (
                      <tr>
                        <td colSpan={3} className="l" style={{ padding: '24px', color: 'var(--muted2)', textAlign: 'center' }}>
                          No teams match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredTeams.length > visibleTeamsCount && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button type="button" className="show-more-btn"
                    onClick={() => setVisibleTeamsCount(c => c + 25)}>
                    Show More
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ══ TAB 3: PLAYERS ══════════════════════════════════════════════ */}
          {activeTab === 'players' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search players by name, team, or country..."
                  value={playersSearch}
                  onChange={ev => { setPlayersSearch(ev.target.value); setVisiblePlayersCount(25); }}
                  style={{
                    width: '100%', maxWidth: '400px', padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)', background: 'var(--surface)',
                    border: '1px solid var(--border)', color: 'var(--text)', fontSize: '14px',
                  }}
                />
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th className="l">Player</th>
                      <th className="l">Nationality</th>
                      <th className="l">Tournaments Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.slice(0, visiblePlayersCount).map(p => (
                      <tr key={p.player_key}>
                        <td className="l">
                          <Link href={`/history/players/${p.player_key}`}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}
                            className="clickable-link">
                            <PlayerPhoto photoUrl={p.photo_url} name={p.current_player || p.player} size={36} />
                            <span style={{ fontWeight: 600 }}>{p.current_player || p.player}</span>
                          </Link>
                        </td>
                        <td className="l">
                          <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {p.country_flag && <span style={{ fontSize: '14px' }}>{p.country_flag}</span>}
                            <span>{p.country || '—'}</span>
                          </span>
                        </td>
                        <td className="l">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {Array.isArray(p.seasons)
                              ? p.seasons.map(s => (
                                  <Link key={s} href={getEditionUrlFromLabel(s)} className="mini-badge">
                                    {getCleanSeasonLabel(s)}
                                  </Link>
                                ))
                              : <span style={{ color: 'var(--muted2)' }}>—</span>
                            }
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredPlayers.length === 0 && (
                      <tr>
                        <td colSpan={3} className="l" style={{ padding: '24px', color: 'var(--muted2)', textAlign: 'center' }}>
                          No players match your search.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {filteredPlayers.length > visiblePlayersCount && (
                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <button type="button" className="show-more-btn"
                    onClick={() => setVisiblePlayersCount(c => c + 25)}>
                    Show More
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <style jsx global>{`
        .mini-badge {
          display: inline-block;
          font-family: var(--font-mono);
          font-size: 11px;
          padding: 3px 8px;
          border-radius: var(--radius-sm);
          background: var(--surface2);
          border: 1px solid var(--border);
          color: var(--muted);
          transition: border-color var(--dur-fast) var(--ease), color var(--dur-fast) var(--ease);
        }
        .mini-badge:hover { border-color: var(--accent); color: var(--accent); }
        .mini-badge--live {
          border-color: var(--accent);
          color: var(--accent);
          background: rgba(255, 215, 0, 0.08);
          font-weight: 700;
        }
        .mini-badge--live:hover { opacity: 0.85; }
        .clickable-link { transition: opacity var(--dur-fast) var(--ease); }
        .clickable-link:hover { opacity: 0.8; }
        .show-more-btn {
          padding: 8px 20px;
          border-radius: var(--radius-sm);
          background: var(--surface);
          border: 1px solid var(--border);
          color: var(--text);
          font-weight: 600;
          cursor: pointer;
          transition: border-color var(--dur-fast);
        }
        .show-more-btn:hover { border-color: var(--border-strong); }
      `}</style>
    </div>
  );
}
