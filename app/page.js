import Link from 'next/link';
import { api } from '../lib/api';
import { resolveSelection } from '../lib/featured';
import { img } from '../lib/images';
import { num, int, dec } from '../lib/format';
import ErrorBox from '../components/ErrorBox';
import PageHead from '../components/PageHead';
import TeamLogo from '../components/TeamLogo';

export const metadata = { title: 'Dashboard' };

// MSC 2026 Wild Card's two round-robin groups (confirmed on Liquipedia,
// liquipedia.net/mobilelegends/MSC/2026/Wildcard) -- there's no `group` column
// anywhere in the schema for this, so it's hardcoded here rather than invented
// as a new data pipeline for a one-off grouping. A 10th team, "Verso Time"
// (Group B, DQ'd 0-4), isn't in BOK's roster data yet so it's omitted below.
// NOTE: matched against the team's CURRENT identity code (intl_player_stats'
// team_code, via team_identity.display_code), not the MSC 2026 era code --
// Team Falcons' era code was "FLCM" but its persistent identity code is "FLCN".
const WILD_CARD_GROUPS = {
  A: ['FUT', 'A7', 'MGLZ', 'KOG', 'VSG'],
  B: ['HUNS', 'FLCN', 'SNR', 'NM'],
};

const ROLE_ORDER = ['EXP LANE', 'JUNGLE', 'MID LANE', 'ROAM', 'GOLD LANE'];

function fmtSec(s) {
  const v = Math.round(num(s));
  if (!v) return '00:00';
  const m = Math.floor(v / 60), sec = v % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
function fmtHms(s) {
  const v = Math.round(num(s));
  if (!v) return '00:00:00';
  const h = Math.floor(v / 3600), m = Math.floor((v % 3600) / 60), sec = v % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}
function fmtPct(v, d = 1) {
  return v == null ? '0.0%' : `${dec(v, d)}%`;
}

function SectionHeader({ children }) {
  return <div className="section-title">{children}</div>;
}

const card = { border: '1px solid var(--border)', background: 'var(--surface)', padding: '10px 0' };
const listHead = { padding: '0 14px 8px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' };
const listRow = (last) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', borderBottom: last ? 'none' : '1px solid rgba(30,30,58,0.3)', gap: 8 });

export default async function DashboardPage({ searchParams }) {
  const sp = await searchParams;
  const { q, label, eff } = await resolveSelection(sp);

  let matches = [], schedule = [], players = [], teams = [], heroes = [], bans = [], byRole = [], error = null;
  try {
    [matches, schedule, players, teams, heroes, bans, byRole] = await Promise.all([
      api.matches(`${q}${q ? '&' : '?'}limit=2000`).catch(() => []),
      api.schedule(q).catch(() => []),
      api.leaderboard(q).catch(() => []),
      api.teams(q).catch(() => []),
      api.heroes(q).catch(() => []),
      api.heroBansSummary().catch(() => []),
      api.heroesByRole().catch(() => []),
    ]);
  } catch (e) {
    error = e.message;
  }

  const hasData = matches.length || teams.length || players.length;

  if (error) {
    return (
      <div className="container">
        <PageHead eyebrow={label} title="Dashboard" />
        <ErrorBox error={error} />
      </div>
    );
  }

  if (!hasData) {
    return (
      <div className="container">
        <PageHead eyebrow={label} title="Dashboard" />
        <div className="empty">No games yet for this selection. Choose another edition or stage above.</div>
      </div>
    );
  }

  // ── Tournament Summary ──────────────────────────────────────────────────
  const gamesPlayed = matches.length;
  const matchesPlayed = new Set(matches.map((m) => m.match_code).filter(Boolean)).size;
  let blueWins = 0, redWins = 0, sideGames = 0, totalGameSec = 0;
  for (const m of matches) {
    totalGameSec += num(m.game_time_s);
    const side = String(m.winner_side || '').toLowerCase();
    if (side === 'blue') { blueWins++; sideGames++; }
    else if (side === 'red') { redWins++; sideGames++; }
  }
  const blueWinRate = sideGames ? (blueWins / sideGames) * 100 : 0;
  const redWinRate = sideGames ? (redWins / sideGames) * 100 : 0;
  const avgGameTime = gamesPlayed ? totalGameSec / gamesPlayed : 0;
  const heroesPicked = heroes.filter((h) => num(h.picks) > 0).length;
  const heroesBannedCount = bans.length; // rich-data only; [] pre-2026 or before enough games fetched

  // ── Recent + upcoming schedule row ──────────────────────────────────────
  const recentGames = [...matches]
    .sort((a, b) => String(b.played_at || '').localeCompare(String(a.played_at || '')))
    .slice(0, 2);
  const playedMatchCodes = new Set(matches.map((m) => m.match_code));
  const upcoming = schedule
    .filter((s) => s.home_team && s.away_team && !playedMatchCodes.has(s.match_code))
    .sort((a, b) => (a.week - b.week) || (a.day - b.day) || (a.match - b.match))
    .slice(0, 2);

  // ── Standings: Wild Card (two groups) vs Main/Overall (single table) ────
  const isWildCard = eff.stage === 'qualifier';
  const groupA = isWildCard ? teams.filter((t) => WILD_CARD_GROUPS.A.includes(t.team_code)) : [];
  const groupB = isWildCard ? teams.filter((t) => WILD_CARD_GROUPS.B.includes(t.team_code)) : [];
  const standingsTeams = [...teams].sort((a, b) => (num(b.win_rate) - num(a.win_rate)) || (num(b.wins) - num(a.wins)));

  // ── Rankings ──────────────────────────────────────────────────────────
  const pKda = [...players].sort((a, b) => num(b.kda) - num(a.kda)).slice(0, 5);
  const pKills = [...players].sort((a, b) => num(b.avg_kills) - num(a.avg_kills)).slice(0, 5);
  const pGpm = [...players].sort((a, b) => num(b.gpm) - num(a.gpm)).slice(0, 5);
  const pMvps = [...players].sort((a, b) => num(b.mvps) - num(a.mvps)).slice(0, 5);

  const tKills = [...teams].sort((a, b) => num(b.avg_kills) - num(a.avg_kills)).slice(0, 3);
  const tAssists = [...teams].sort((a, b) => num(b.avg_assists) - num(a.avg_assists)).slice(0, 3);
  const tGpm = [...teams].sort((a, b) => num(b.gpm) - num(a.gpm)).slice(0, 3);
  const tDpm = [...teams].sort((a, b) => num(b.dpm) - num(a.dpm)).slice(0, 3);
  const tWinTime = [...teams].filter((t) => t.avg_win_time_s != null).sort((a, b) => num(a.avg_win_time_s) - num(b.avg_win_time_s)).slice(0, 3);

  // ── Hero rankings ─────────────────────────────────────────────────────
  const hContested = [...heroes].filter((h) => num(h.picks) > 0).sort((a, b) => num(b.picks) - num(a.picks)).slice(0, 5);
  const banMap = Object.fromEntries(bans.map((b) => [b.heroid, num(b.bans)]));
  const hBanned = [...bans].sort((a, b) => num(b.bans) - num(a.bans)).slice(0, 5);
  const hPicked = [...heroes].filter((h) => num(h.picks) > 0).sort((a, b) => num(b.picks) - num(a.picks)).slice(0, 5);

  const byRoleGrouped = ROLE_ORDER.map((role) => ({
    role,
    list: byRole.filter((r) => r.role_lane === role).sort((a, b) => num(b.games) - num(a.games)).slice(0, 3),
  }));

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Dashboard">
        The international stats hub — leading with the featured edition. Switch editions or stage above.
      </PageHead>

      {/* Schedule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <SectionHeader>Schedule</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
          {recentGames.map((m) => (
            <div key={m.game_code} style={{ ...card, borderLeft: '3px solid var(--win)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted2)' }}>
                <span>{m.stage}</span><span style={{ color: 'var(--accent)', fontWeight: 600 }}>FINAL</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamLogo fallbackSrc={img.team(m.team_a)} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  <span style={{ color: m.winner === m.team_a ? 'var(--win)' : 'var(--text)', fontWeight: m.winner === m.team_a ? 700 : 400 }}>{m.team_a}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted2)' }}>vs</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: m.winner === m.team_b ? 'var(--win)' : 'var(--text)', fontWeight: m.winner === m.team_b ? 700 : 400 }}>{m.team_b}</span>
                  <TeamLogo fallbackSrc={img.team(m.team_b)} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          ))}
          {upcoming.map((s, i) => (
            <div key={s.match_code || i} style={{ ...card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted2)' }}>
                <span>{s.phase} • D{s.day}M{s.match}</span><span>UPCOMING</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TeamLogo fallbackSrc={img.team(s.home_team)} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                  <span>{s.home_team}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted2)' }}>vs</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>{s.away_team}</span>
                  <TeamLogo fallbackSrc={img.team(s.away_team)} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                </div>
              </div>
            </div>
          ))}
          {!recentGames.length && !upcoming.length ? <div className="empty">No schedule data for this selection.</div> : null}
        </div>
        <Link href="/results" style={{ display: 'block', textAlign: 'center', padding: '8px 12px', border: '1px solid var(--border2)', background: 'var(--surface2)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text)' }}>
          View Full Schedule &amp; Matches →
        </Link>
      </div>

      {/* Tournament Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <SectionHeader>Tournament Summary</SectionHeader>
        <div className="cards">
          <div className="card"><div className="k">Matches Played</div><div className="v">{int(matchesPlayed)}</div></div>
          <div className="card"><div className="k">Games Played</div><div className="v">{int(gamesPlayed)}</div></div>
          <div className="card">
            <div className="k">Side Win Rate</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, marginTop: 4 }}>
              <span style={{ color: '#40B8FF' }}>B {blueWinRate.toFixed(0)}%</span>
              <span style={{ color: '#F0506E' }}>{redWinRate.toFixed(0)}% R</span>
            </div>
          </div>
          <div className="card"><div className="k">Total Game Time</div><div className="v" style={{ fontSize: 18 }}>{fmtHms(totalGameSec)}</div></div>
          <div className="card"><div className="k">Avg Game Time</div><div className="v">{fmtSec(avgGameTime)}</div></div>
          <div className="card"><div className="k">Heroes Picked</div><div className="v">{int(heroesPicked)}</div></div>
          <div className="card">
            <div className="k">Heroes Banned</div>
            <div className="v">{bans.length || byRole.length ? int(heroesBannedCount) : '—'}</div>
          </div>
        </div>
        {!bans.length ? (
          <div style={{ fontSize: 11, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
            Ban data is only tracked for rich-collected games (MSC 2026 onward) — shows once enough games are fetched.
          </div>
        ) : null}
      </div>

      {/* Standings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <SectionHeader>{isWildCard ? 'Wild Card Group Standings' : 'Standings'}</SectionHeader>
        {isWildCard ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
              <GroupTable title="Group A" rows={groupA} />
              <GroupTable title="Group B" rows={groupB} />
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
              Cross-Group Gauntlet &amp; Decider results (King-of-the-Hill, per Liquipedia's MSC 2026 Wild Card
              format) will appear here once those fixtures are added to the schedule and fetched.
            </div>
          </>
        ) : (
          <GroupTable title={null} rows={standingsTeams} />
        )}
      </div>

      {/* Player Rankings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <SectionHeader>Player Rankings</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          <RankList title="KDA" rows={pKda} valueFn={(p) => dec(p.kda)} />
          <RankList title="Avg Kills" rows={pKills} valueFn={(p) => dec(p.avg_kills)} />
          <RankList title="Gold / Min" rows={pGpm} valueFn={(p) => int(p.gpm)} />
          <RankList title="Game MVPs" rows={pMvps} valueFn={(p) => int(p.mvps)} />
        </div>
      </div>

      {/* Team Rankings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <SectionHeader>Team Rankings</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
          <TeamRankList title="Avg Kills" rows={tKills} valueFn={(t) => dec(t.avg_kills)} />
          <TeamRankList title="Avg Assists" rows={tAssists} valueFn={(t) => dec(t.avg_assists)} />
          <TeamRankList title="Avg GPM" rows={tGpm} valueFn={(t) => int(t.gpm)} />
          <TeamRankList title="Avg DPM" rows={tDpm} valueFn={(t) => int(t.dpm)} />
          <TeamRankList title="Avg Win Time" rows={tWinTime} valueFn={(t) => fmtSec(t.avg_win_time_s)} />
        </div>
      </div>

      {/* Hero Rankings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <SectionHeader>Hero Rankings</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          <div style={card}>
            <div style={listHead}>MOST PICKED</div>
            {hPicked.length ? hPicked.map((h, i) => (
              <div key={h.hero_id || i} style={listRow(i === hPicked.length - 1)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 11 }}>#{i + 1}</span>
                  {img.hero(h.hero_id) ? <img src={img.hero(h.hero_id)} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} /> : null}
                  <span style={{ fontSize: 13 }}>{h.hero_name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{int(h.picks)}</span>
              </div>
            )) : <div style={{ padding: 14, color: 'var(--muted2)', fontSize: 12 }}>No data.</div>}
          </div>
          <div style={card}>
            <div style={listHead}>MOST BANNED</div>
            {hBanned.length ? hBanned.map((h, i) => (
              <div key={h.heroid} style={listRow(i === hBanned.length - 1)}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 11 }}>#{i + 1}</span>
                  {img.hero(h.heroid) ? <img src={img.hero(h.heroid)} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} /> : null}
                  <span style={{ fontSize: 13 }}>{h.hero_name}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{int(h.bans)}</span>
              </div>
            )) : <div style={{ padding: 14, color: 'var(--muted2)', fontSize: 12 }}>No ban data yet (MSC 2026-forward only).</div>}
          </div>
          <div style={card}>
            <div style={listHead}>MOST CONTESTED (PICK+BAN)</div>
            {hContested.length ? hContested.map((h, i) => {
              const b = banMap[h.hero_id] || 0;
              return (
                <div key={h.hero_id || i} style={listRow(i === hContested.length - 1)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 11 }}>#{i + 1}</span>
                    {img.hero(h.hero_id) ? <img src={img.hero(h.hero_id)} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} /> : null}
                    <span style={{ fontSize: 13 }}>{h.hero_name}</span>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{int(num(h.picks) + b)}</span>
                </div>
              );
            }) : <div style={{ padding: 14, color: 'var(--muted2)', fontSize: 12 }}>No data.</div>}
          </div>
        </div>
      </div>

      {/* Top Hero Picks by Role */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionHeader>Top Hero Picks by Role</SectionHeader>
        {byRole.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
            {byRoleGrouped.map(({ role, list }) => (
              <div key={role} style={{ ...card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>{role}</div>
                {list.length ? list.map((h, i) => (
                  <div key={h.heroid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>#{i + 1}</span>
                    {img.hero(h.heroid) ? <img src={img.hero(h.heroid)} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} /> : null}
                    <span style={{ fontSize: 12 }}>{h.hero_name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>{h.games}g</span>
                  </div>
                )) : <span style={{ color: 'var(--muted2)', fontSize: 11 }}>—</span>}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Role data is only tracked for rich-collected games (MSC 2026 onward) — shows once enough games are fetched.</div>
        )}
      </div>
    </div>
  );
}

// ── Small presentational helpers ──────────────────────────────────────────
function GroupTable({ title, rows }) {
  const sorted = [...rows].sort((a, b) => (num(b.win_rate) - num(a.win_rate)) || (num(b.wins) - num(a.wins)));
  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {title ? <div style={{ ...listHead, borderBottom: '1px solid var(--border)' }}>{title.toUpperCase()}</div> : null}
      <div className="table-wrap">
        <table style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th className="l" style={{ width: 32 }}>#</th>
              <th className="l">Team</th>
              <th>GP</th>
              <th>W-L</th>
              <th>Win%</th>
            </tr>
          </thead>
          <tbody>
            {sorted.length ? sorted.map((t, i) => (
              <tr key={t.team_key}>
                <td className="l">#{i + 1}</td>
                <td className="l">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <TeamLogo src={t.team_logo_dark} fallbackSrc={img.team(t.team_code)} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                    <span>{t.team_code}</span>
                  </div>
                </td>
                <td>{int(t.games)}</td>
                <td style={{ color: 'var(--muted)' }}>{int(t.wins)}–{int(t.losses)}</td>
                <td style={{ color: 'var(--win)', fontWeight: 600 }}>{fmtPct(t.win_rate)}</td>
              </tr>
            )) : (
              <tr><td colSpan={5} className="l" style={{ color: 'var(--muted2)' }}>No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RankList({ title, rows, valueFn }) {
  return (
    <div style={card}>
      <div style={listHead}>{title.toUpperCase()}</div>
      {rows.length ? rows.map((p, i) => (
        <div key={p.player_key} style={listRow(i === rows.length - 1)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, fontSize: 11, width: 10 }}>{i + 1}</span>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.player}</span>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{p.latest_team_code}</span>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--win)' }}>{valueFn(p)}</span>
        </div>
      )) : <div style={{ padding: 14, color: 'var(--muted2)', fontSize: 12 }}>No data.</div>}
    </div>
  );
}

function TeamRankList({ title, rows, valueFn }) {
  return (
    <div style={card}>
      <div style={listHead}>{title.toUpperCase()}</div>
      {rows.length ? rows.map((t, i) => (
        <div key={t.team_key} style={listRow(i === rows.length - 1)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, fontSize: 11, width: 10 }}>{i + 1}</span>
            <TeamLogo src={t.team_logo_dark} fallbackSrc={img.team(t.team_code)} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{t.team_code}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--win)' }}>{valueFn(t)}</span>
        </div>
      )) : <div style={{ padding: 14, color: 'var(--muted2)', fontSize: 12 }}>No data.</div>}
    </div>
  );
}
