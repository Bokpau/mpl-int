'use client';

import Link from 'next/link';
import TeamLogo from './TeamLogo';
import { img } from '../lib/images';

// Ported from the PH site's MatchCard, adapted to the intl /api/intl/matches/rich
// shape. Key differences from PH: every rich row (teams/picks/game_mvp) is tagged
// with team_key + team_era by the backend, so sides are grouped by team_key (stable
// across a series) and hero rings are colored by campid (blue/red side that game) —
// no collector-code string matching. Map-picker and PRIO chips are PH regular-season
// mechanics with no international equivalent, so they are intentionally absent.

const BLUE_CLR = 'var(--blue-side)'; // camp 1 / blue side
const RED_CLR = 'var(--red-side)';  // camp 2 / red side

function fmtSec(s) {
  if (!s) return '--';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// Team logo (era-resolved), falling back to the CDN code logo like the Dashboard.
function TeamMark({ meta, era, size = 40 }) {
  return (
    <TeamLogo
      src={meta?.team_logo_dark}
      fallbackSrc={img.team(era)}
      alt=""
      style={{ width: size, height: size, objectFit: 'contain', flexShrink: 0 }}
    />
  );
}

function HeroPick({ heroid, campid, size = 28 }) {
  const ring = campid === 1 ? BLUE_CLR : campid === 2 ? RED_CLR : 'transparent';
  const url = img.hero(heroid);
  return (
    <div className="game-row__hero-pick" style={{
      flexShrink: 0, width: size, height: size,
      borderRadius: '50%',
      boxShadow: `0 0 0 2px ${ring}`,
      overflow: 'hidden',
    }}>
      {url && <img src={url} alt="" width={size} height={size} className="game-row__hero-pick-img" style={{ display: 'block' }} />}
    </div>
  );
}

function GameMvpChip({ label, player }) {
  if (!player?.roleid) return null;
  const heroUrl = img.hero(player.heroid);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      background: 'rgba(64,184,255,0.07)',
      border: '1px solid rgba(64,184,255,0.25)',
      padding: '4px 8px',
    }}>
      {heroUrl && (
        <div style={{ flexShrink: 0, borderRadius: '50%', boxShadow: `0 0 0 1.5px ${BLUE_CLR}`, overflow: 'hidden', width: 22, height: 22 }}>
          <img src={heroUrl} alt="" width={22} height={22} style={{ display: 'block' }} />
        </div>
      )}
      <div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--blue)', letterSpacing: '.1em' }}>★ {label}</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, color: 'var(--text)', lineHeight: 1 }}>{player.player_name}</div>
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted2)' }}>{player.team_era}</span>
    </div>
  );
}

function MatchMvpCard({ player }) {
  if (!player?.roleid) return null;
  const heroes = player.heroes || [];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      background: 'rgba(255,215,0,0.08)',
      border: '1px solid rgba(255,215,0,0.35)',
      padding: '6px 12px',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 2, background: 'var(--accent)' }} />
      <div style={{ marginRight: 4 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--accent)', letterSpacing: '.12em', marginBottom: 2 }}>
          ★ MATCH MVP
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--text)', lineHeight: 1 }}>
          {player.player_name}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent)', opacity: 0.7, marginTop: 2 }}>
          {player.team_code}
        </div>
      </div>
      {heroes.length > 0 && (
        <div style={{ display: 'flex', gap: 5, alignItems: 'center', borderLeft: '1px solid rgba(255,215,0,0.2)', paddingLeft: 10 }}>
          {heroes.map((h, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <div style={{ borderRadius: '50%', boxShadow: '0 0 0 1.5px var(--accent)', overflow: 'hidden', width: 26, height: 26, flexShrink: 0 }}>
                {img.hero(h.heroid) && <img src={img.hero(h.heroid)} alt="" width={26} height={26} style={{ display: 'block' }} />}
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 7, color: 'var(--muted2)' }}>G{h.game_number}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MapPill({ gameNum, mapName }) {
  if (!mapName) return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 5,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      padding: '3px 8px',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted2)' }}>G{gameNum}</span>
      <span style={{ color: 'var(--border2)' }}>·</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text)' }}>{mapName}</span>
    </div>
  );
}

// `info` is the first game of the series (carries match-level meta). `games` is the
// array of that match's games. `teamByKey` maps team_key -> team meta (logo/flag).
export default function MatchCard({ info, games, match_mvp, teamByKey = {}, roundTag = null, isHistory = false }) {
  const sorted = [...games].sort((a, b) => (a.game_number || 0) - (b.game_number || 0));

  // Series' two teams, stable across games (sides swap game-to-game, keys don't).
  const aKey = info.team_a_key, bKey = info.team_b_key;
  const aEra = info.team_a_era || '—', bEra = info.team_b_era || '—';
  const aMeta = teamByKey[aKey], bMeta = teamByKey[bKey];

  let aWins = 0, bWins = 0;
  for (const g of sorted) {
    if (!g.winner_key) continue;
    if (g.winner_key === aKey) aWins++;
    else if (g.winner_key === bKey) bWins++;
  }
  const aWon = aWins > bWins;
  const bWon = bWins > aWins;
  const winColor = aWon ? BLUE_CLR : bWon ? RED_CLR : 'var(--border2)';

  const totalSec = sorted.reduce((s, g) => s + (g.game_time_seconds || 0), 0);
  const avgSec = sorted.length ? Math.round(totalSec / sorted.length) : 0;
  const hasMvps = match_mvp?.roleid || sorted.some(g => g.game_mvp?.roleid);
  const hasMaps = sorted.some(g => g.map_name);

  return (
    <div className="match-card">
      {/* ── Meta strip ─────────────────────────────────────── */}
      <div style={{
        padding: '8px 14px',
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border)',
        background: 'rgba(15,15,26,0.5)',
        flexWrap: 'wrap', gap: 8,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            {info.phase || info.stage || ''}
          </span>
          {(info.week_number || info.day_number) && (
            <span className="badge badge-purple">
              {info.week_number ? `W${info.week_number}` : ''}
              {info.day_number ? ` D${info.day_number}` : ''}
            </span>
          )}
          {info.match_number && (
            <span className="badge badge-gold">
              Match {info.match_number}
            </span>
          )}
          {info.match_count && (
            <span className="badge badge-role">{info.match_count}</span>
          )}
          {roundTag && (
            <span className="badge badge-role">{roundTag}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {totalSec > 0 && (
            <>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>
                Total <span style={{ color: 'var(--text)' }}>{fmtSec(totalSec)}</span>
              </span>
              <span style={{ color: 'var(--border2)' }}>·</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>
                Avg <span style={{ color: 'var(--text)' }}>{fmtSec(avgSec)}</span>
              </span>
              <span style={{ color: 'var(--border2)' }}>·</span>
            </>
          )}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--border2)', letterSpacing: '.04em' }}>
            {info.match_code || ''}
          </span>
        </div>
      </div>

      {/* ── MVP + Map info strip ────────────────────────────── */}
      {(hasMvps || hasMaps) && (
        <div style={{
          padding: '7px 14px',
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          background: 'rgba(255,255,255,0.012)',
        }}>
          <MatchMvpCard player={match_mvp} />
          {sorted.map(g => g.game_mvp?.roleid ? (
            <GameMvpChip key={`mvp-${g.battle_id}`} label={`G${g.game_number || ''} MVP`} player={g.game_mvp} />
          ) : null)}
          {hasMvps && hasMaps && (
            <div style={{ width: 1, height: 24, background: 'var(--border2)', alignSelf: 'center' }} />
          )}
          {sorted.map(g => (
            <MapPill key={`map-${g.battle_id}`} gameNum={g.game_number || 1} mapName={g.map_name} />
          ))}
        </div>
      )}

      {/* Score + game rows: desktop 5-col .game-row needs ~480px min; .game-row
          restacks to 3 rows at sm/xs (see globals.css) so no scroll is needed there. */}
      <div className="match-card-scroll">
      <div className="match-card-inner">
      {/* ── Score row ──────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center',
        padding: '14px 20px',
        borderBottom: sorted.length ? '1px solid var(--border)' : 'none',
        gap: 12,
        background: `linear-gradient(135deg, ${winColor}06, transparent 60%)`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <TeamMark meta={aMeta} era={aEra} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, color: 'var(--text)', whiteSpace: 'nowrap' }}>
              {aKey ? <Link href={`/teams/${encodeURIComponent(aKey)}`} style={{ color: 'inherit' }}>{aEra}</Link> : aEra}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: BLUE_CLR, letterSpacing: '.12em', marginTop: 3, visibility: aWon ? 'visible' : 'hidden' }}>● WINNER</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: aWon ? BLUE_CLR : 'var(--muted)' }}>{aWins}</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--border2)', letterSpacing: '.1em' }}>VS</span>
          <span style={{ fontFamily: 'var(--font-display)', fontSize: 40, lineHeight: 1, color: bWon ? RED_CLR : 'var(--muted)' }}>{bWins}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'flex-end', minWidth: 0 }}>
          <div style={{ textAlign: 'right', minWidth: 0 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, lineHeight: 1, color: 'var(--text)', whiteSpace: 'nowrap' }}>
              {bKey ? <Link href={`/teams/${encodeURIComponent(bKey)}`} style={{ color: 'inherit' }}>{bEra}</Link> : bEra}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, color: RED_CLR, letterSpacing: '.12em', marginTop: 3, visibility: bWon ? 'visible' : 'hidden' }}>● WINNER</div>
          </div>
          <TeamMark meta={bMeta} era={bEra} />
        </div>
      </div>

      {/* ── Per-game rows ───────────────────────────────────── */}
      <div>
        {sorted.map((g, gi) => {
          const picks = Array.isArray(g.picks) ? g.picks.filter(p => p?.heroid) : [];
          const aPicks = picks.filter(p => p.team_key === aKey).sort((x, y) => x.order_num - y.order_num);
          const bPicks = picks.filter(p => p.team_key === bKey).sort((x, y) => x.order_num - y.order_num);
          const gameNum = g.game_number || gi + 1;
          const aWinsGame = g.winner_key && g.winner_key === aKey;
          const winClr = aWinsGame ? BLUE_CLR : RED_CLR;

          return (
            <div key={g.battle_id} className="game-row" style={{
              background: gi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
            }}>
              <div className="game-row__num">G{gameNum}</div>

              <div className="game-row__picks-container home">
                <div className="game-row__picks">
                  {aPicks.map(p => (
                    <HeroPick key={`a${p.heroid}_${p.order_num}`} heroid={p.heroid} campid={p.campid} size={28} />
                  ))}
                </div>
                {aWinsGame && (
                  <span className="game-row__win-badge" style={{ color: winClr, border: `1px solid ${winClr}`, background: `${winClr}12` }}>WIN</span>
                )}
              </div>

              <div className="game-row__center">
                <span className="game-row__time" style={{ color: g.winner_key ? winClr : 'var(--muted2)' }}>
                  {fmtSec(g.game_time_seconds)}
                </span>
              </div>

              <div className="game-row__picks-container away">
                {!aWinsGame && g.winner_key && (
                  <span className="game-row__win-badge" style={{ color: winClr, border: `1px solid ${winClr}`, background: `${winClr}12` }}>WIN</span>
                )}
                <div className="game-row__picks">
                  {bPicks.map(p => (
                    <HeroPick key={`b${p.heroid}_${p.order_num}`} heroid={p.heroid} campid={p.campid} size={28} />
                  ))}
                </div>
              </div>

              <Link href={`/matches/${g.battle_id}${isHistory ? '?context=history' : ''}`} className="game-row__detail-btn">
                DETAIL →
              </Link>
            </div>
          );
        })}
      </div>
      </div>{/* minWidth: 420 */}
      </div>{/* overflowX: auto scroll container */}
    </div>
  );
}
