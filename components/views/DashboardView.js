import { Suspense } from 'react';
import Link from 'next/link';
import { api } from '../../lib/api';
import { img } from '../../lib/images';
import { num, int, dec } from '../../lib/format';
import ErrorBox from '../ErrorBox';
import PageHead from '../PageHead';
import TeamLogo from '../TeamLogo';
import FilterBar from '../FilterBar';

// MSC 2026 Wild Card's two round-robin groups (confirmed on Liquipedia,
// liquipedia.net/mobilelegends/MSC/2026/Wildcard) -- there's no `group` column
// anywhere in the schema for this, so it's hardcoded here rather than invented
// as a new data pipeline for a one-off grouping. A 10th team, "Verso Time"
// (Group B, DQ'd 0-4), isn't in BOK's roster data yet so it's omitted below.
// NOTE: matched against the team's MSC 2026 ERA code (team_era_name.era_code) --
// what each team was called AT this edition, not its persistent franchise
// display_code. Only Team Falcons differs: era "FLCM" (shown), franchise "FLCN".
const WILD_CARD_GROUPS = {
  A: ['FUT', 'A7', 'MGLZ', 'KOG', 'VSG'],
  B: ['HUNS', 'FLCM', 'SNR', 'NM'],
};

// Stopgap for 2 MSC 2026 players whose player_era_photo row hasn't been seeded
// yet (KEI, MUIMINET). Their photo files DO exist on the CDN, so fall back to
// them by IGN until the DB seed lands — then this map can be deleted. See
// database/seed_player_photos_msc2026.sql (their player_name_alias rows are the
// real gap).
const PHOTO_FALLBACK = {
  KEI: 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/int_player/mlbb_mgz_cut_kei_f.png',
  MUIMINET: 'https://raw.githubusercontent.com/Bokpau/mlbb-tool/main/int_player/mlbb_sun_muiminet_cut_f.png',
};

// Decider bracket SEEDING (Liquipedia MSC 2026 Wild Card): Semifinal Match 1 on
// top, Match 2 below, Match 3 is the Grand Final. Real scores are overlaid from
// the DB when those series exist (they're qualifier-stage Bo3s played after the
// Gauntlet); until a series is played it shows as a placeholder. The pairings
// are the two group winners vs the two Gauntlet qualifiers.
const DECIDER = {
  semifinals: [
    { label: 'Match 1', a: 'HUNS', b: 'A7' },
    { label: 'Match 2', a: 'FUT', b: 'FLCM' },
  ],
  final: { label: 'Match 3 · Grand Final' },
};
// How many Bo3 series make up the Cross-Group Gauntlet (2 rounds × 2). Bo3 series
// beyond this many are the Decider (semifinals + grand final).
const GAUNTLET_SERIES = 4;

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
// Pick/Ban rate helper: count vs total games in the current selection.
function ratePct(count, total, d = 1) {
  if (!total) return '0.0%';
  return `${dec((num(count) / total) * 100, d)}%`;
}

// Collapse per-game `matches` rows into one series per match_code, tallying game
// wins per side (winner_key vs the fixed team keys) so we get the Bo-N score.
function buildSeries(matches) {
  const byMatch = new Map();
  for (const m of matches) {
    if (!m.match_code) continue;
    let s = byMatch.get(m.match_code);
    if (!s) {
      s = {
        match_code: m.match_code, stage: m.stage, match_name: m.match_name,
        // era code (what the team was called at this edition), not franchise code
        team_a: m.team_a_era || m.team_a, team_b: m.team_b_era || m.team_b,
        team_a_key: m.team_a_key, team_b_key: m.team_b_key,
        team_a_flag: m.team_a_flag, team_b_flag: m.team_b_flag,
        a_wins: 0, b_wins: 0, games: 0, played_at: m.played_at,
      };
      byMatch.set(m.match_code, s);
    }
    s.games++;
    if (m.winner_key && m.winner_key === s.team_a_key) s.a_wins++;
    else if (m.winner_key && m.winner_key === s.team_b_key) s.b_wins++;
    if (String(m.played_at || '') > String(s.played_at || '')) s.played_at = m.played_at;
  }
  const out = [...byMatch.values()];
  for (const s of out) {
    s.winner_key = s.a_wins > s.b_wins ? s.team_a_key : s.b_wins > s.a_wins ? s.team_b_key : null;
    s.winner_code = s.winner_key === s.team_a_key ? s.team_a : s.winner_key === s.team_b_key ? s.team_b : null;
  }
  return out;
}

function SectionHeader({ children }) {
  return <div className="section-title">{children}</div>;
}

const card = { border: '1px solid var(--border)', background: 'var(--surface)', padding: '10px 0' };
const listHead = { padding: '0 14px 8px 14px', borderBottom: '1px solid var(--border)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent)' };
const listRow = (last) => ({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 14px', borderBottom: last ? 'none' : '1px solid rgba(30,30,58,0.3)', gap: 8 });

// Full international dashboard for one selection. `q`/`label`/`eff`/`editions`/
// `featured` come from a selection resolver (resolveSelection for history,
// resolveCurrent for the live edition) — the view itself is selection-agnostic.
export default async function DashboardView({ q, label, eff, editions = [], featured = null }) {
  let matches = [], schedule = [], players = [], teams = [], heroes = [], bans = [], byRole = [], error = null;
  try {
    [matches, schedule, players, teams, heroes, bans, byRole] = await Promise.all([
      api.matches(`${q}${q ? '&' : '?'}limit=2000`).catch(() => []),
      api.schedule(q).catch(() => []),
      api.leaderboard(q).catch(() => []),
      api.teams(q).catch(() => []),
      api.heroes(q).catch(() => []),
      api.heroBansSummary(q).catch(() => []),
      api.heroesByRole(q).catch(() => []),
    ]);
  } catch (e) {
    error = e.message;
  }

  const hasData = matches.length || teams.length || players.length;

  const head = (
    <>
      <PageHead eyebrow={label} title="Dashboard">
        The international stats hub — leading with the featured edition. Filter by
        stage (Overall / Wild Card / Main) and minimum games.
      </PageHead>
      <Suspense fallback={<div className="filterbar" />}>
        <FilterBar editions={editions} featured={featured} showEvent={false} showEdition={false} />
      </Suspense>
    </>
  );

  if (error) {
    return <div className="container">{head}<ErrorBox error={error} /></div>;
  }
  if (!hasData) {
    return (
      <div className="container">{head}
        <div className="empty">No games yet for this selection. Choose another edition or stage above.</div>
      </div>
    );
  }

  // ── Team lookup (logo + represented-country flag) ───────────────────────────
  // Keyed by BOTH franchise display code AND this edition's era code, so a lookup
  // works with "FLCN" (display) or "FLCM" (era). Era codes + the display→era map
  // come from the matches rows (which carry both).
  const teamByKey = Object.fromEntries(teams.map((t) => [t.team_key, t]));
  const teamMeta = {};
  for (const t of teams) teamMeta[t.team_code] = t;
  const displayToEra = {};
  for (const m of matches) {
    for (const [disp, era, key] of [[m.team_a, m.team_a_era, m.team_a_key], [m.team_b, m.team_b_era, m.team_b_key]]) {
      if (disp && era) displayToEra[disp] = era;
      const meta = teamByKey[key] || teamMeta[disp];
      if (era && meta && !teamMeta[era]) teamMeta[era] = meta;
    }
  }
  // Franchise display code -> this edition's era code (teams/leaderboard rows only
  // carry the display code). Identity: show the era name per edition.
  const eCode = (c) => displayToEra[c] || c;
  const teamsEra = teams.map((t) => ({ ...t, team_code: eCode(t.team_code) }));
  const playersEra = players.map((p) => ({ ...p, latest_team_code: eCode(p.latest_team_code) }));

  // ── Tournament Summary ──────────────────────────────────────────────────
  const gamesPlayed = matches.length;
  const totalGames = gamesPlayed; // denominator for hero pick/ban rates
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
  const heroesBannedCount = bans.length;

  // ── Schedule: recent SERIES (with Bo-N score) + upcoming fixtures ───────────
  // Schedule row per match_code, for the phase / day / match / detail labels.
  const schedByCode = Object.fromEntries(schedule.map((s) => [s.match_code, s]));
  const scheduleLabel = (matchCode, fallbackPhase) => {
    const sc = schedByCode[matchCode] || {};
    const phase = sc.phase || fallbackPhase || '';
    const mNum = sc.match ?? ((String(matchCode).match(/M(\d+)$/) || [])[1]);
    const bits = [phase];
    if (sc.day != null) bits.push(`Day ${sc.day}`);
    if (mNum != null) bits.push(`Match ${mNum}`);
    return bits.filter(Boolean).join(' · ');
  };
  const allSeries = buildSeries(matches);
  // Newest 3 series, but displayed oldest→newest so the LATEST game is rightmost.
  const recentSeries = [...allSeries]
    .sort((a, b) => String(b.played_at || '').localeCompare(String(a.played_at || '')))
    .slice(0, 3)
    .reverse();
  const playedMatchCodes = new Set(matches.map((m) => m.match_code));
  const upcoming = schedule
    .filter((s) => s.home_team && s.away_team && !playedMatchCodes.has(s.match_code))
    .sort((a, b) => (a.week - b.week) || (a.day - b.day) || (a.match - b.match))
    .slice(0, 3);

  // ── Standings: Wild Card (Groups + Gauntlet + Decider) vs single table ─────
  const isWildCard = eff.stage === 'qualifier';
  // Group stage = single-game (Bo1) series. The Bo3 series are, in order, the
  // Cross-Group Gauntlet (first GAUNTLET_SERIES of them) then the Decider.
  const groupSeries = isWildCard ? allSeries.filter((s) => s.games <= 1) : [];
  const bo3Series = isWildCard
    ? allSeries.filter((s) => s.games > 1)
        .sort((a, b) => String(a.played_at || '').localeCompare(String(b.played_at || '')) || a.match_code.localeCompare(b.match_code))
    : [];
  const gauntletSeries = bo3Series.slice(0, GAUNTLET_SERIES);
  const deciderSeries = bo3Series.slice(GAUNTLET_SERIES);
  // Match a seeded pairing to a played Decider series (order-independent).
  const findDecider = (a, b) => deciderSeries.find(
    (s) => (s.team_a === a && s.team_b === b) || (s.team_a === b && s.team_b === a)
  );
  // Overlay real results onto the seeded semifinals; derive the Grand Final.
  const deciderSemis = DECIDER.semifinals.map((m) => ({ ...m, series: findDecider(m.a, m.b) || null }));
  const semiWinners = deciderSemis.map((x) => x.series?.winner_code).filter(Boolean);
  const finalSeries = deciderSeries.find(
    (s) => !DECIDER.semifinals.some((m) => (s.team_a === m.a && s.team_b === m.b) || (s.team_a === m.b && s.team_b === m.a))
  ) || null;
  const finalA = finalSeries?.team_a || (semiWinners.length === 2 ? semiWinners[0] : null);
  const finalB = finalSeries?.team_b || (semiWinners.length === 2 ? semiWinners[1] : null);
  // The Grand Final winner is the last team to qualify for the Main Stage.
  const mainStageQualifier = finalSeries?.winner_code || null;

  function groupStandings(codes) {
    const rec = Object.fromEntries(codes.map((c) => [c, { code: c, w: 0, l: 0 }]));
    for (const s of groupSeries) {
      const aWon = s.a_wins > s.b_wins;
      if (rec[s.team_a]) { aWon ? rec[s.team_a].w++ : rec[s.team_a].l++; }
      if (rec[s.team_b]) { aWon ? rec[s.team_b].l++ : rec[s.team_b].w++; }
    }
    return Object.values(rec).sort((a, b) => (b.w - b.l) - (a.w - a.l) || b.w - a.w);
  }
  const groupA = isWildCard ? groupStandings(WILD_CARD_GROUPS.A) : [];
  const groupB = isWildCard ? groupStandings(WILD_CARD_GROUPS.B) : [];
  const gauntletR1 = gauntletSeries.slice(0, 2);
  const gauntletR2 = gauntletSeries.slice(2, 4);
  const qualified = gauntletR2.map((s) => s.winner_code).filter(Boolean);

  const standingsTeams = [...teamsEra].sort((a, b) => (num(b.win_rate) - num(a.win_rate)) || (num(b.wins) - num(a.wins)));

  // ── Player rankings ────────────────────────────────────────────────────
  const pKda = [...playersEra].sort((a, b) => num(b.kda) - num(a.kda)).slice(0, 5);
  const pKills = [...playersEra].sort((a, b) => num(b.avg_kills) - num(a.avg_kills)).slice(0, 5);
  const pAssists = [...playersEra].sort((a, b) => num(b.avg_assists) - num(a.avg_assists)).slice(0, 5);
  const pGpm = [...playersEra].sort((a, b) => num(b.gpm) - num(a.gpm)).slice(0, 5);
  const pMvps = [...playersEra].sort((a, b) => num(b.mvps) - num(a.mvps)).slice(0, 5);

  // ── Team rankings ──────────────────────────────────────────────────────
  const tKills = [...teamsEra].sort((a, b) => num(b.avg_kills) - num(a.avg_kills)).slice(0, 3);
  const tAssists = [...teamsEra].sort((a, b) => num(b.avg_assists) - num(a.avg_assists)).slice(0, 3);
  const tGpm = [...teamsEra].sort((a, b) => num(b.gpm) - num(a.gpm)).slice(0, 3);
  const tDpm = [...teamsEra].sort((a, b) => num(b.dpm) - num(a.dpm)).slice(0, 3);
  const tWinTime = [...teamsEra].filter((t) => t.avg_win_time_s != null).sort((a, b) => num(a.avg_win_time_s) - num(b.avg_win_time_s)).slice(0, 3);

  // ── Hero rankings ──────────────────────────────────────────────────────
  const banMap = Object.fromEntries(bans.map((b) => [b.heroid, num(b.bans)]));
  const hPicked = [...heroes].filter((h) => num(h.picks) > 0).sort((a, b) => num(b.picks) - num(a.picks)).slice(0, 5);
  const hBanned = [...bans].sort((a, b) => num(b.bans) - num(a.bans)).slice(0, 5);
  const hContested = [...heroes].filter((h) => num(h.picks) > 0)
    .map((h) => ({ ...h, contest: num(h.picks) + (banMap[h.hero_id] || 0) }))
    .sort((a, b) => b.contest - a.contest).slice(0, 5);

  const byRoleGrouped = ROLE_ORDER.map((role) => ({
    role,
    list: byRole.filter((r) => r.role_lane === role).sort((a, b) => num(b.games) - num(a.games)).slice(0, 3),
  }));

  return (
    <div className="container">
      {head}

      {/* Schedule */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
        <SectionHeader>Schedule</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {recentSeries.map((s) => (
            <ScheduleCard key={s.match_code} status="FINAL" accent teamMeta={teamMeta}
              detail={scheduleLabel(s.match_code, s.stage)}
              a={s.team_a} b={s.team_b} aFlag={s.team_a_flag} bFlag={s.team_b_flag}
              aScore={s.a_wins} bScore={s.b_wins} winner={s.winner_code} />
          ))}
          {upcoming.map((s, i) => (
            <ScheduleCard key={s.match_code || i} status="UPCOMING" teamMeta={teamMeta}
              detail={scheduleLabel(s.match_code, s.phase)}
              a={s.home_team} b={s.away_team} aFlag={s.home_flag} bFlag={s.away_flag} />
          ))}
          {!recentSeries.length && !upcoming.length ? <div className="empty">No schedule data for this selection.</div> : null}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
        <SectionHeader>{isWildCard ? 'Wild Card Standings' : 'Standings'}</SectionHeader>
        {isWildCard ? (
          <>
            {/* Group Stage */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SubHead>Group Stage</SubHead>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                <GroupTable title="Group A" rows={groupA} teamMeta={teamMeta} />
                <GroupTable title="Group B" rows={groupB} teamMeta={teamMeta} />
              </div>
            </div>

            {/* Cross-Group Gauntlet */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SubHead>Cross-Group Gauntlet</SubHead>
              {gauntletSeries.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, alignItems: 'start' }}>
                  <BracketCol title="Round 1" series={gauntletR1} teamMeta={teamMeta} />
                  <BracketCol title="Round 2" series={gauntletR2} teamMeta={teamMeta} />
                  <QualifiedCol codes={qualified} teamMeta={teamMeta} />
                </div>
              ) : (
                <div className="empty">Gauntlet fixtures not fetched yet for this selection.</div>
              )}
            </div>

            {/* Decider — semifinals → grand final → Main Stage qualifier */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SubHead>Decider</SubHead>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, alignItems: 'center' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {deciderSemis.map((m) => (
                    m.series
                      ? <SeriesBox key={m.label} title={m.label} teamMeta={teamMeta} compact
                          aCode={m.series.team_a} bCode={m.series.team_b}
                          aScore={m.series.a_wins} bScore={m.series.b_wins} winner={m.series.winner_code} />
                      : <SeriesBox key={m.label} title={m.label} teamMeta={teamMeta} compact aCode={m.a} bCode={m.b} scaffold />
                  ))}
                </div>
                {finalSeries
                  ? <SeriesBox title={DECIDER.final.label} teamMeta={teamMeta} compact
                      aCode={finalSeries.team_a} bCode={finalSeries.team_b}
                      aScore={finalSeries.a_wins} bScore={finalSeries.b_wins} winner={finalSeries.winner_code} />
                  : <SeriesBox title={DECIDER.final.label} teamMeta={teamMeta} compact aCode={finalA} bCode={finalB} scaffold />}
                <QualifiedCol title="To Main Stage" codes={mainStageQualifier ? [mainStageQualifier] : []} teamMeta={teamMeta} />
              </div>
              {!finalSeries ? (
                <div style={{ fontSize: 10, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
                  Fills in as each series is played; the Grand Final winner qualifies for the Main Stage.
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <StandingsTable rows={standingsTeams} />
        )}
      </div>

      {/* Player Rankings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <SectionHeader>Player Rankings</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
          <RankList title="KDA" rows={pKda} teamMeta={teamMeta} valueFn={(p) => dec(p.kda)} />
          <RankList title="Avg Kills" rows={pKills} teamMeta={teamMeta} valueFn={(p) => dec(p.avg_kills)} />
          <RankList title="Avg Assists" rows={pAssists} teamMeta={teamMeta} valueFn={(p) => dec(p.avg_assists)} />
          <RankList title="Gold / Min" rows={pGpm} teamMeta={teamMeta} valueFn={(p) => int(p.gpm)} />
          <RankList title="Game MVPs" rows={pMvps} teamMeta={teamMeta} valueFn={(p) => int(p.mvps)} />
        </div>
      </div>

      {/* Team Rankings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 28 }}>
        <SectionHeader>Team Rankings</SectionHeader>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
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
            <div style={listHead}>MOST PICKED · PICK %</div>
            {hPicked.length ? hPicked.map((h, i) => (
              <HeroRow key={h.hero_id || i} rank={i + 1} last={i === hPicked.length - 1} id={h.hero_id} name={h.hero_name}
                main={int(h.picks)} pct={ratePct(h.picks, totalGames)} />
            )) : <Empty />}
          </div>
          <div style={card}>
            <div style={listHead}>MOST BANNED · BAN %</div>
            {hBanned.length ? hBanned.map((h, i) => (
              <HeroRow key={h.heroid} rank={i + 1} last={i === hBanned.length - 1} id={h.heroid} name={h.hero_name}
                main={int(h.bans)} pct={ratePct(h.bans, totalGames)} />
            )) : <div style={{ padding: 14, color: 'var(--muted2)', fontSize: 12 }}>No ban data yet (MSC 2026-forward only).</div>}
          </div>
          <div style={card}>
            <div style={listHead}>MOST CONTESTED · BAN+PICK %</div>
            {hContested.length ? hContested.map((h, i) => (
              <HeroRow key={h.hero_id || i} rank={i + 1} last={i === hContested.length - 1} id={h.hero_id} name={h.hero_name}
                main={int(h.contest)} pct={ratePct(h.contest, totalGames)} />
            )) : <Empty />}
          </div>
        </div>
      </div>

      {/* Top Hero Picks by Role */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <SectionHeader>Top Hero Picks by Role</SectionHeader>
        {byRole.length ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: 14 }}>
            {byRoleGrouped.map(({ role, list }) => (
              <div key={role} style={{ ...card, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>{role}</div>
                {list.length ? list.map((h, i) => (
                  <div key={h.heroid} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>#{i + 1}</span>
                    {img.hero(h.heroid) ? <img src={img.hero(h.heroid)} alt="" style={{ width: 20, height: 20, borderRadius: '50%' }} /> : null}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                      <span style={{ fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.hero_name}</span>
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted2)' }}>
                        {dec(h.pick_rate, 1)}% pick · {dec(h.win_rate, 1)}% win
                      </span>
                    </div>
                    <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>{int(h.games)}g</span>
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
function SubHead({ children }) {
  return <div style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{children}</div>;
}
function Empty() {
  return <div style={{ padding: 14, color: 'var(--muted2)', fontSize: 12 }}>No data.</div>;
}
function Flag({ emoji }) {
  return emoji ? <span style={{ fontSize: 13 }} aria-hidden="true">{emoji}</span> : null;
}

function ScheduleCard({ status, accent, phase, detail, a, b, aFlag, bFlag, aScore, bScore, winner, teamMeta = {} }) {
  const hasScore = aScore != null && bScore != null;
  const side = (code, flag, score, alignRight) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexDirection: alignRight ? 'row-reverse' : 'row', minWidth: 0 }}>
      <TeamLogo src={teamMeta[code]?.team_logo_dark} fallbackSrc={img.team(code)} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
      <Flag emoji={flag} />
      <span style={{ color: winner && winner === code ? 'var(--win)' : 'var(--text)', fontWeight: winner && winner === code ? 700 : 400, fontSize: 13 }}>{code}</span>
    </div>
  );
  return (
    <div style={{ ...card, borderLeft: accent ? '3px solid var(--win)' : undefined, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted2)', gap: 6 }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{detail || phase}</span>
        <span style={{ color: accent ? 'var(--accent)' : 'var(--muted2)', fontWeight: 600, flexShrink: 0 }}>{status}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
        {side(a, aFlag, aScore, false)}
        {hasScore
          ? <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700 }}><span style={{ color: winner === a ? 'var(--win)' : 'var(--text)' }}>{aScore}</span><span style={{ color: 'var(--muted2)' }}>–</span><span style={{ color: winner === b ? 'var(--win)' : 'var(--text)' }}>{bScore}</span></span>
          : <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted2)' }}>vs</span>}
        {side(b, bFlag, bScore, true)}
      </div>
    </div>
  );
}

function GroupTable({ title, rows, teamMeta }) {
  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {title ? <div style={{ ...listHead, borderBottom: '1px solid var(--border)' }}>{title.toUpperCase()}</div> : null}
      <div className="table-wrap">
        <table style={{ marginBottom: 0 }}>
          <thead>
            <tr>
              <th className="l" style={{ width: 32 }}>#</th>
              <th className="l">Team</th>
              <th>Match</th>
              <th>Diff</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? rows.map((t, i) => {
              const meta = teamMeta[t.code] || {};
              const diff = t.w - t.l;
              return (
                <tr key={t.code}>
                  <td className="l">#{i + 1}</td>
                  <td className="l">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <TeamLogo src={meta.team_logo_dark} fallbackSrc={img.team(t.code)} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                      <Flag emoji={meta.country_flag} />
                      <span>{t.code}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text)', fontWeight: 600 }}>{t.w}–{t.l}</td>
                  <td style={{ color: diff > 0 ? 'var(--win)' : diff < 0 ? 'var(--loss, #F0506E)' : 'var(--muted)' }}>{diff > 0 ? `+${diff}` : diff}</td>
                </tr>
              );
            }) : (
              <tr><td colSpan={4} className="l" style={{ color: 'var(--muted2)' }}>No data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Full team standings table for the non-Wild-Card (Total / Main) view.
function StandingsTable({ rows }) {
  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
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
            {rows.length ? rows.map((t, i) => (
              <tr key={t.team_key}>
                <td className="l">#{i + 1}</td>
                <td className="l">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <TeamLogo src={t.team_logo_dark} fallbackSrc={img.team(t.team_code)} alt="" style={{ width: 18, height: 18, objectFit: 'contain' }} />
                    <Flag emoji={t.country_flag} />
                    <span>{t.team_code}</span>
                  </div>
                </td>
                <td>{int(t.games)}</td>
                <td style={{ color: 'var(--muted)' }}>{int(t.wins)}–{int(t.losses)}</td>
                <td style={{ color: 'var(--win)', fontWeight: 600 }}>{fmtPct(t.win_rate)}</td>
              </tr>
            )) : <tr><td colSpan={5} className="l" style={{ color: 'var(--muted2)' }}>No data.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// One bracket column (a round) of Gauntlet series.
function BracketCol({ title, series, teamMeta }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>{title}</div>
      {series.length ? series.map((s) => (
        <SeriesBox key={s.match_code} teamMeta={teamMeta}
          aCode={s.team_a} bCode={s.team_b} aScore={s.a_wins} bScore={s.b_wins} winner={s.winner_code} />
      )) : <div style={{ color: 'var(--muted2)', fontSize: 11, textAlign: 'center' }}>—</div>}
    </div>
  );
}

function QualifiedCol({ codes, teamMeta, title = 'Qualified' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', textAlign: 'center' }}>{title}</div>
      {codes.length ? codes.map((c) => {
        const meta = teamMeta[c] || {};
        return (
          <div key={c} style={{ border: '1px solid var(--win)', background: 'var(--surface)', padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TeamLogo src={meta.team_logo_dark} fallbackSrc={img.team(c)} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
            <Flag emoji={meta.country_flag} />
            <span style={{ fontWeight: 700, color: 'var(--win)' }}>{c}</span>
          </div>
        );
      }) : <div style={{ color: 'var(--muted2)', fontSize: 11, textAlign: 'center' }}>—</div>}
    </div>
  );
}

// A single series box (two stacked teams + score). `scaffold` = TBD placeholder,
// `compact` = tighter padding for dense brackets (Decider).
function SeriesBox({ title, aCode, bCode, aScore, bScore, winner, teamMeta = {}, scaffold, compact }) {
  const pad = compact ? '4px 10px' : '7px 10px';
  const sz = compact ? 16 : 18;
  const row = (code) => {
    const meta = teamMeta[code] || {};
    const isWin = winner && winner === code;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: pad }}>
        {code ? <TeamLogo src={meta.team_logo_dark} fallbackSrc={img.team(code)} alt="" style={{ width: sz, height: sz, objectFit: 'contain' }} /> : <span style={{ width: sz }} />}
        {code ? <Flag emoji={meta.country_flag} /> : null}
        <span style={{ fontSize: 13, color: code ? (isWin ? 'var(--win)' : 'var(--text)') : 'var(--muted2)', fontWeight: isWin ? 700 : 400 }}>{code || 'TBD'}</span>
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: isWin ? 'var(--win)' : 'var(--muted2)' }}>
          {scaffold ? '–' : (code === aCode ? aScore : bScore)}
        </span>
      </div>
    );
  };
  return (
    <div style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}>
      {title ? <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted2)', padding: compact ? '4px 10px 0' : '6px 10px 0' }}>{title}</div> : null}
      {row(aCode)}
      <div style={{ borderTop: '1px solid rgba(30,30,58,0.4)' }} />
      {row(bCode)}
    </div>
  );
}

function RankList({ title, rows, valueFn, teamMeta = {} }) {
  return (
    <div style={card}>
      <div style={listHead}>{title.toUpperCase()}</div>
      {rows.length ? rows.map((p, i) => {
        const photo = p.photo_url || PHOTO_FALLBACK[String(p.player || '').toUpperCase()];
        return (
        <div key={p.player_key} style={listRow(i === rows.length - 1)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontWeight: 700, fontSize: 11, width: 10 }}>{i + 1}</span>
            {photo
              ? <img src={photo} alt="" referrerPolicy="no-referrer" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', background: 'var(--surface2)' }} />
              : <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--surface2)', flexShrink: 0 }} />}
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.player}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <TeamLogo src={teamMeta[p.latest_team_code]?.team_logo_dark} fallbackSrc={img.team(p.latest_team_code)} alt="" style={{ width: 12, height: 12, objectFit: 'contain' }} />
                <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--muted)' }}>{p.latest_team_code}</span>
              </span>
            </div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--win)' }}>{valueFn(p)}</span>
        </div>
        );
      }) : <Empty />}
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
            <Flag emoji={t.country_flag} />
            <span style={{ fontSize: 12, fontWeight: 600 }}>{t.team_code}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--win)' }}>{valueFn(t)}</span>
        </div>
      )) : <Empty />}
    </div>
  );
}

function HeroRow({ rank, last, id, name, main, pct }) {
  return (
    <div style={listRow(last)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent)', fontSize: 11 }}>#{rank}</span>
        {img.hero(id) ? <img src={img.hero(id)} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} /> : null}
        <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flexShrink: 0 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>{main}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--win)' }}>{pct}</span>
      </div>
    </div>
  );
}
