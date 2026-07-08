'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import TeamLogo from '../../../components/TeamLogo';
import { PlayerPhoto } from '../../../components/Images';
import { img, getTournamentLogo } from '../../../lib/images';
import { editionTitle } from '../../../lib/filters';

// Local fallback mapping for early tournament runner-ups that lack standings rows in the DB
const EARLY_RUNNER_UPS = {
  'MSC 2017': {
    team_key: 'xteam-saltysalad',
    team_code: 'Salty Salad',
    team_name: 'Salty Salad',
    logo_dark: 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/intl_teamlogo/Salty_Salad_allmode.png',
    logo_light: 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/intl_teamlogo/Salty_Salad_allmode.png',
    country_flag: '🇵🇭'
  },
  'MSC 2018': {
    team_key: '68a44841982458382c28696a',
    team_code: 'DD PRO',
    team_name: 'Digital Devils Pro Gaming',
    logo_dark: 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/intl_teamlogo/Digital_Devils_Pro_allmode.png',
    logo_light: 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/intl_teamlogo/Digital_Devils_Pro_allmode.png',
    country_flag: '🇵🇭'
  },
  'MSC 2019': {
    team_key: 'xteam-louvreesports',
    team_code: 'Louvre Esports',
    team_name: 'Louvre Esports',
    logo_dark: 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/intl_teamlogo/Louvre_allmode.png',
    logo_light: 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/intl_teamlogo/Louvre_allmode.png',
    country_flag: '🇮🇩'
  }
};

// Date formatter: start_date, end_date -> "Jul 10 - 14, 2024" or "Nov 10 - Dec 1, 2025"
function formatDateRange(startStr, endStr) {
  if (!startStr && !endStr) return '—';
  if (!startStr) return endStr;
  if (!endStr) return startStr;

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return `${startStr} - ${endStr}`;
  }

  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  
  if (start.getFullYear() === end.getFullYear()) {
    if (start.getMonth() === end.getMonth()) {
      return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.getDate()}, ${start.getFullYear()}`;
    }
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${start.getFullYear()}`;
  }
  return `${start.toLocaleDateString('en-US', options)} - ${end.toLocaleDateString('en-US', options)}`;
}

export default function HistoryDashboardClient({
  editions = [],
  accolades = [],
  standings = [],
  teams = [],
  players = []
}) {
  const [activeTab, setActiveTab] = useState('tournaments');
  const [teamsSearch, setTeamsSearch] = useState('');
  const [playersSearch, setPlayersSearch] = useState('');
  
  // Pagination counts
  const [visibleTeamsCount, setVisibleTeamsCount] = useState(25);
  const [visiblePlayersCount, setVisiblePlayersCount] = useState(25);

  // 1. Resolve Tournament/Edition List (Champ & Runner Up)
  const resolvedTournaments = useMemo(() => {
    const list = editions.map(e => {
      // Champion: Check accolades first, fallback to standings (1st)
      let champion = accolades.find(a => String(a.season) === String(e.season) && a.award_type === 'champion');
      if (!champion) {
        const champStanding = standings.find(s => String(s.tournament_code) === String(e.season) && s.placement === '1st');
        if (champStanding) {
          champion = {
            team_key: champStanding.team_key,
            team_code: champStanding.team_code,
            recipient: champStanding.team_name,
            logo_dark: champStanding.logo_dark,
            logo_light: champStanding.logo_light,
            flag_emoji: champStanding.country_flag
          };
        }
      }

      // Runner Up: Check early hand-curated map first, fallback to standings (2nd)
      let runnerUp = EARLY_RUNNER_UPS[e.season] || null;
      if (!runnerUp) {
        const ruStanding = standings.find(s => String(s.tournament_code) === String(e.season) && s.placement === '2nd');
        if (ruStanding) {
          runnerUp = {
            team_key: ruStanding.team_key,
            team_code: ruStanding.team_code,
            team_name: ruStanding.team_name,
            logo_dark: ruStanding.logo_dark,
            logo_light: ruStanding.logo_light,
            country_flag: ruStanding.country_flag
          };
        }
      }

      return {
        ...e,
        champion,
        runnerUp
      };
    });

    // Sort descending by season_number / ID
    return [...list].sort((a, b) => (Number(b.season_id) || 0) - (Number(a.season_id) || 0));
  }, [editions, accolades, standings]);

  // 2. Filter Teams
  const filteredTeams = useMemo(() => {
    const term = teamsSearch.toLowerCase().trim();
    if (!term) return teams;
    return teams.filter(t => 
      (t.team_name || '').toLowerCase().includes(term) ||
      (t.team_code || '').toLowerCase().includes(term) ||
      (t.country || '').toLowerCase().includes(term)
    );
  }, [teams, teamsSearch]);

  // 3. Filter Players
  const filteredPlayers = useMemo(() => {
    const term = playersSearch.toLowerCase().trim();
    if (!term) return players;
    return players.filter(p => 
      (p.current_player || p.player || '').toLowerCase().includes(term) ||
      (p.latest_team || p.latest_team_code || '').toLowerCase().includes(term) ||
      (p.country || '').toLowerCase().includes(term)
    );
  }, [players, playersSearch]);

  // Helper to parse tournament season into scope/season parameters for URL mapping
  const getEditionUrl = (seasonLabel) => {
    const matched = editions.find(e => String(e.season) === String(seasonLabel));
    const scope = matched ? matched.tournament_code : (String(seasonLabel).startsWith('MSC') ? 'MSC' : 'MWC');
    return `/history/dashboard?scope=${encodeURIComponent(scope)}&season=${encodeURIComponent(seasonLabel)}`;
  };

  const getCleanSeasonLabel = (seasonLabel) => {
    return String(seasonLabel).replace('World Championship', 'WC').replace('Southeast Asia Cup', 'MSC');
  };

  return (
    <div>
      <div className="db-tabs-container" style={{ marginTop: '24px' }}>
        <div className="db-tabs-header">
          <button
            type="button"
            className={`db-tab-btn ${activeTab === 'tournaments' ? 'active' : ''}`}
            onClick={() => setActiveTab('tournaments')}
          >
            Tournaments
          </button>
          <button
            type="button"
            className={`db-tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            Teams
          </button>
          <button
            type="button"
            className={`db-tab-btn ${activeTab === 'players' ? 'active' : ''}`}
            onClick={() => setActiveTab('players')}
          >
            Players
          </button>
        </div>

        <div className="db-tabs-content" style={{ marginTop: '20px' }}>
          
          {/* TAB 1: TOURNAMENTS */}
          {activeTab === 'tournaments' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th className="l">Tournament</th>
                    <th className="l">Date</th>
                    <th className="l">Champion</th>
                    <th className="l">Runner-up</th>
                  </tr>
                </thead>
                <tbody>
                  {resolvedTournaments.map(e => {
                    const logoUrl = getTournamentLogo(e.season);
                    return (
                      <tr key={`${e.tournament_code}-${e.season}`} style={{ borderBottom: '1px solid var(--border)' }}>
                        {/* Tournament Column */}
                        <td className="l">
                          <Link href={getEditionUrl(e.season)} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }} className="clickable-link">
                            {logoUrl ? (
                              <img src={logoUrl} alt="" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
                            ) : (
                              <div style={{ width: '24px', height: '24px', borderRadius: '4px', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '9px', fontWeight: 'bold' }}>
                                {e.tournament_code}
                              </div>
                            )}
                            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{editionTitle(e)}</span>
                          </Link>
                        </td>
                        
                        {/* Date Column */}
                        <td className="l" style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--muted2)' }}>
                          {formatDateRange(e.start_date, e.end_date)}
                        </td>

                        {/* Champion Column */}
                        <td className="l">
                          {e.champion ? (
                            <Link href={`/teams/${e.champion.team_key}?context=history`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} className="clickable-link">
                              <TeamLogo 
                                src={e.champion.logo_dark} 
                                fallbackSrc={img.team(e.champion.team_code || e.champion.recipient)} 
                                alt="" 
                                style={{ width: '20px', height: '20px', objectFit: 'contain' }} 
                              />
                              {e.champion.flag_emoji && <span style={{ fontSize: '13px' }}>{e.champion.flag_emoji}</span>}
                              <span style={{ fontWeight: 600 }}>{e.champion.recipient}</span>
                            </Link>
                          ) : (
                            <span style={{ color: 'var(--muted2)' }}>—</span>
                          )}
                        </td>

                        {/* Runner-up Column */}
                        <td className="l">
                          {e.runnerUp ? (
                            <Link href={`/teams/${e.runnerUp.team_key}?context=history`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} className="clickable-link">
                              <TeamLogo 
                                src={e.runnerUp.logo_dark} 
                                fallbackSrc={img.team(e.runnerUp.team_code)} 
                                alt="" 
                                style={{ width: '20px', height: '20px', objectFit: 'contain' }} 
                              />
                              {e.runnerUp.country_flag && <span style={{ fontSize: '13px' }}>{e.runnerUp.country_flag}</span>}
                              <span style={{ fontWeight: 600 }}>{e.runnerUp.team_name}</span>
                            </Link>
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

          {/* TAB 2: TEAMS */}
          {activeTab === 'teams' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search teams by name or country..."
                  value={teamsSearch}
                  onChange={(e) => {
                    setTeamsSearch(e.target.value);
                    setVisibleTeamsCount(25); // Reset pagination on search
                  }}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '14px',
                  }}
                />
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th className="l">Team</th>
                      <th className="l">Country</th>
                      <th className="l">Tournaments Played</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeams.slice(0, visibleTeamsCount).map(t => (
                      <tr key={t.team_key} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="l">
                          <Link href={`/teams/${t.team_key}?context=history`} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }} className="clickable-link">
                            <TeamLogo 
                              src={t.team_logo_dark} 
                              fallbackSrc={img.team(t.team_code)} 
                              alt="" 
                              style={{ width: '24px', height: '24px', objectFit: 'contain' }} 
                            />
                            <span style={{ fontWeight: 600 }}>{t.team_name || t.team_code}</span>
                          </Link>
                        </td>
                        <td className="l">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {t.country_flag && <span style={{ fontSize: '14px' }}>{t.country_flag}</span>}
                            <span>{t.country || '—'}</span>
                          </div>
                        </td>
                        <td className="l">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {Array.isArray(t.seasons) ? (
                              t.seasons.map(s => (
                                <Link 
                                  key={s} 
                                  href={getEditionUrl(s)}
                                  className="mini-badge"
                                >
                                  {getCleanSeasonLabel(s)}
                                </Link>
                              ))
                            ) : (
                              <span style={{ color: 'var(--muted2)' }}>—</span>
                            )}
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
                  <button
                    type="button"
                    onClick={() => setVisibleTeamsCount(prev => prev + 25)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'border-color var(--dur-fast)'
                    }}
                    className="show-more-btn"
                  >
                    Show More
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PLAYERS */}
          {activeTab === 'players' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <input
                  type="text"
                  placeholder="Search players by name, team, or country..."
                  value={playersSearch}
                  onChange={(e) => {
                    setPlayersSearch(e.target.value);
                    setVisiblePlayersCount(25); // Reset pagination on search
                  }}
                  style={{
                    width: '100%',
                    maxWidth: '400px',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    color: 'var(--text)',
                    fontSize: '14px',
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
                      <tr key={p.player_key} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td className="l">
                          <Link href={`/history/players/${p.player_key}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }} className="clickable-link">
                            <PlayerPhoto 
                              photoUrl={p.photo_url} 
                              name={p.current_player || p.player} 
                              size={36} 
                            />
                            <span style={{ fontWeight: 600 }}>{p.current_player || p.player}</span>
                          </Link>
                        </td>
                        <td className="l">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {p.country_flag && <span style={{ fontSize: '14px' }}>{p.country_flag}</span>}
                            <span>{p.country || '—'}</span>
                          </div>
                        </td>
                        <td className="l">
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {Array.isArray(p.seasons) ? (
                              p.seasons.map(s => (
                                <Link 
                                  key={s} 
                                  href={getEditionUrl(s)}
                                  className="mini-badge"
                                >
                                  {getCleanSeasonLabel(s)}
                                </Link>
                              ))
                            ) : (
                              <span style={{ color: 'var(--muted2)' }}>—</span>
                            )}
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
                  <button
                    type="button"
                    onClick={() => setVisiblePlayersCount(prev => prev + 25)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      transition: 'border-color var(--dur-fast)'
                    }}
                    className="show-more-btn"
                  >
                    Show More
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
      
      {/* Visual support for CSS classes that match "The Arena Archive" design style */}
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
        .mini-badge:hover {
          border-color: var(--accent);
          color: var(--accent);
        }
        .clickable-link {
          transition: color var(--dur-fast) var(--ease);
        }
        .clickable-link:hover span {
          color: var(--accent) !important;
        }
        .show-more-btn:hover {
          border-color: var(--border-strong) !important;
        }
      `}</style>
    </div>
  );
}
