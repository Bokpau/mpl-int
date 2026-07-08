import { api } from '../lib/api';
import Link from 'next/link';
import TeamLogo from './TeamLogo';
import { img } from '../lib/images';
import { HeroImg, HeroBanImg, RoleImg, PlayerPhoto } from './Images';
import { MatchAnalysis } from './MatchAnalysis';
import { StatsAdvantageChart } from './StatsAdvantageChart';
import { MatchViewer } from './MatchViewer';
import { ItemTimings } from './ItemTimings';
import { BoxScore } from './BoxScore';
import { PlayerTable } from './PlayerTable';

// International match-detail (Phase 4a — the static breakdown that works for every
// fetched game). Ported from the PH MatchBreakdown; the rich tables are LIKE their
// PH counterparts so BoxScore / PlayerTable / MatchAnalysis port unchanged. Team
// codes are shown as this edition's ERA codes (from the endpoint's `era` block;
// camp 1 = team_a, camp 2 = team_b). The realtime collapsibles (Stats Advantage /
// Map Viewer / Item Progression) are Phase 4b (Wild Card Day 1 data only).

const BLUE = '#4da6ff';
const RED = '#ff4757';

function fmtTime(s) {
  if (!s && s !== 0) return '--';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function HeroCircle({ heroid, campid, size = 36 }) {
  const ring = campid === 1 ? BLUE : campid === 2 ? RED : 'var(--border)';
  return (
    <div style={{ flexShrink: 0, borderRadius: '50%', boxShadow: `0 0 0 2px ${ring}`, overflow: 'hidden', width: size, height: size }}>
      <HeroImg heroid={heroid} size={size} style={{ display: 'block' }} />
    </div>
  );
}

export async function MatchBreakdown({ battleId, isCurrent = true }) {
  let data = null;
  try { data = await api.match(battleId); } catch { }
  if (!data) return <div className="empty">Match not found.</div>;

  const { match, era, teams, players, draft, events = [], gameMvp, matchMvp } = data;

  // Era code / key per camp (camp 1 = team_a, camp 2 = team_b).
  const eraCode = { 1: era?.team_a_era, 2: era?.team_b_era };
  const eraKey = { 1: era?.team_a_key, 2: era?.team_b_key };

  const raw1 = teams.find(t => t.campid === 1);
  const raw2 = teams.find(t => t.campid === 2);
  const camp1 = raw1 ? { ...raw1, team_code: eraCode[1] || raw1.team_code } : null;
  const camp2 = raw2 ? { ...raw2, team_code: eraCode[2] || raw2.team_code } : null;
  const camp1players = players.filter(p => p.campid === 1);
  const camp2players = players.filter(p => p.campid === 2);
  const picks = draft.filter(d => d.action === 'pick');
  const bans = draft.filter(d => d.action === 'ban');

  const mins = match.game_time_seconds ? fmtTime(match.game_time_seconds) : '--';

  // Team logos for this edition, keyed by team_key (same source as the rest of the site).
  let teamByKey = {};
  if (era) {
    try {
      const ts = await api.teams(`?scope=${era.tournament_code}&season=${encodeURIComponent(era.season)}`);
      for (const t of ts) if (t.team_key) teamByKey[t.team_key] = t;
    } catch { }
  }
  const Logo = ({ campid, size = 36 }) => (
    <TeamLogo src={teamByKey[eraKey[campid]]?.team_logo_dark} fallbackSrc={img.team(eraCode[campid])} alt=""
      style={{ width: size, height: size, objectFit: 'contain' }} />
  );

  const gameMvpTeam = gameMvp ? eraCode[gameMvp.campid] || gameMvp.team_code : null;

  const playerMap = Object.fromEntries(
    players.map(p => [String(p.roleid), { heroid: p.heroid, campid: p.campid, name: p.player_name }])
  );

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <Link href={isCurrent ? "/matches" : "/history/matches"} style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
          ← Matches
        </Link>
      </div>

      {/* Masthead */}
      <div className="masthead" style={{ padding: '20px 0', borderBottom: '1px solid var(--border)', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 24 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
          {era?.stage || ''}{match.week_number ? ` · W${match.week_number}` : ''}
          {match.game_number ? ` · Game ${match.game_number}` : ''}
          {match.match_code ? ` · ${match.match_code}` : ''}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, margin: '8px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1', justifyContent: 'flex-end' }}>
            {camp1?.is_winner && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 800, color: 'var(--win)', letterSpacing: '.12em', border: '1px solid var(--win)', padding: '2px 6px' }}>WIN</span>
            )}
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, textTransform: 'uppercase', color: 'var(--text)' }}>{camp1?.team_code}</span>
            <Logo campid={1} />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, display: 'flex', gap: 8, letterSpacing: '0.1em' }}>
            <span style={{ color: 'var(--text)' }}>{camp1?.total_kills}</span>
            <span style={{ color: 'var(--muted2)' }}>–</span>
            <span style={{ color: 'var(--text)' }}>{camp2?.total_kills}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1', justifyContent: 'flex-start' }}>
            <Logo campid={2} />
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 28, textTransform: 'uppercase', color: 'var(--text)' }}>{camp2?.team_code}</span>
            {camp2?.is_winner && (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 800, color: 'var(--win)', letterSpacing: '.12em', border: '1px solid var(--win)', padding: '2px 6px' }}>WIN</span>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted2)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
          <span>{mins}</span>
          {match.map_name && (<><span>·</span><span>{match.map_name}</span></>)}
        </div>
      </div>

      {/* Team stats + MVPs/Draft */}
      <div className="match-summary-grid mb-6">
        <div><BoxScore camp1={camp1} camp2={camp2} /></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {(gameMvp?.roleid || matchMvp?.roleid) && (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {gameMvp?.roleid && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid var(--accent)', padding: '10px 16px', flex: '1 1 200px', maxWidth: 280, background: 'var(--surface)' }}>
                  {gameMvp.heroid && <HeroCircle heroid={gameMvp.heroid} campid={0} size={44} />}
                  <PlayerPhoto photoUrl={gameMvp.photo_url} name={gameMvp.player_name} size={44} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '.12em', marginBottom: 2 }}>★ GAME MVP</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {gameMvp.player_key ? <Link href={`/players/${encodeURIComponent(gameMvp.player_key)}`} style={{ color: 'inherit' }}>{gameMvp.player_name}</Link> : gameMvp.player_name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{gameMvpTeam}</div>
                  </div>
                </div>
              )}
              {matchMvp?.roleid && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #e8b800', padding: '10px 16px', flex: '1 1 200px', maxWidth: 280, background: 'var(--surface)' }}>
                  {matchMvp.heroid && <HeroCircle heroid={matchMvp.heroid} campid={0} size={44} />}
                  <PlayerPhoto photoUrl={matchMvp.photo_url} name={matchMvp.player_name} size={44} />
                  <div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: '#e8b800', letterSpacing: '.12em', marginBottom: 2 }}>★ MATCH MVP</div>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>
                      {matchMvp.player_key ? <Link href={`/players/${encodeURIComponent(matchMvp.player_key)}`} style={{ color: 'inherit' }}>{matchMvp.player_name}</Link> : matchMvp.player_name}
                    </div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>{matchMvp.team_code}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {draft.length > 0 && (
            <div>
              <div className="section-header" style={{ marginTop: (gameMvp?.roleid || matchMvp?.roleid) ? 12 : 0 }}>Draft</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[camp1, camp2].map(t => {
                  if (!t) return null;
                  const isBlue = t.campid === 1;
                  const sideClr = isBlue ? BLUE : RED;
                  const teamPicks = picks.filter(d => d.campid === t.campid).sort((a, b) => a.order_num - b.order_num);
                  const teamBans = bans.filter(d => d.campid === t.campid).sort((a, b) => a.order_num - b.order_num);
                  return (
                    <div key={t.campid}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: sideClr, marginBottom: 8, letterSpacing: '.1em', fontWeight: 700 }}>
                        {t.team_code} — {isBlue ? 'BLUE' : 'RED'}
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', marginBottom: 4 }}>PICKS</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {teamPicks.map(d => {
                            const player = players.find(p => p.heroid === d.heroid && p.campid === t.campid);
                            const role = player?.role_lane;
                            return (
                              <div key={d.order_num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                                <div style={{ position: 'relative', width: 36, height: 36 }}>
                                  <div style={{ borderRadius: '50%', boxShadow: `0 0 0 1.5px ${sideClr}`, overflow: 'hidden', width: 36, height: 36 }}>
                                    <HeroImg heroid={d.heroid} size={36} style={{ display: 'block' }} />
                                  </div>
                                  {role && (
                                    <div style={{ position: 'absolute', bottom: -2, right: -2, background: 'var(--bg)', borderRadius: '50%', padding: 0.5, border: `1px solid ${sideClr}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <RoleImg role={role} size={10} />
                                    </div>
                                  )}
                                </div>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--text)', maxWidth: 40, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.hero_name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)', marginBottom: 4 }}>BANS</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {teamBans.map(d => (
                            <div key={d.order_num} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: 0.7 }}>
                              <div style={{ width: 28, height: 28, overflow: 'hidden', borderRadius: 4 }}>
                                <HeroBanImg heroid={d.heroid} size={28} style={{ filter: 'grayscale(60%)', display: 'block' }} />
                              </div>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted)', maxWidth: 32, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.hero_name}</span>
                            </div>
                          ))}
                          {Array.from({ length: Math.max(0, 5 - teamBans.length) }).map((_, idx) => (
                            <div key={`empty-ban-${idx}`} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, opacity: 0.4 }}>
                              <div style={{ width: 28, height: 28, background: 'var(--surface2)', border: '1px dashed var(--border)', borderRadius: 4 }} />
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted2)' }}>--</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      <PlayerTable camp1={camp1} camp2={camp2} camp1players={camp1players} camp2players={camp2players} />

      {/* Realtime panels (Phase 4b) — populate only for games whose per-second CSVs
          were imported; otherwise each shows its own "no data" state. */}
      <details className="collapsible mt-8" open>
        <summary><span className="section-header" style={{ marginBottom: 0 }}><span className="disclosure">▶</span>Stats Advantage</span></summary>
        <div className="collapsible-body">
          <div className="card">
            <StatsAdvantageChart battleId={battleId} camp1Code={camp1?.team_code} camp2Code={camp2?.team_code} matchEvents={events} />
          </div>
        </div>
      </details>

      <details className="collapsible mt-8" open>
        <summary><span className="section-header" style={{ marginBottom: 0 }}><span className="disclosure">▶</span>Map Viewer</span></summary>
        <div className="collapsible-body">
          <MatchViewer
            battleId={battleId}
            mapId={match.play_mode_id}
            camp1Code={camp1?.team_code}
            camp2Code={camp2?.team_code}
            matchEvents={events}
            playerMap={playerMap}
            camp1={camp1}
            camp2={camp2}
            players={players}
          />
        </div>
      </details>

      <details className="collapsible mt-8">
        <summary><span className="section-header" style={{ marginBottom: 0 }}><span className="disclosure">▶</span>Match Analysis</span></summary>
        <div className="collapsible-body">
          <MatchAnalysis players={players} camp1={camp1} camp2={camp2} />
        </div>
      </details>

      <details className="collapsible mt-8">
        <summary><span className="section-header" style={{ marginBottom: 0 }}><span className="disclosure">▶</span>Item Progression</span></summary>
        <div className="collapsible-body">
          <div className="card">
            <ItemTimings battleId={battleId} camp1Code={camp1?.team_code} camp2Code={camp2?.team_code} />
          </div>
        </div>
      </details>
    </>
  );
}
