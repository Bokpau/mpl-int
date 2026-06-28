import Link from 'next/link';
import { api } from '../../../lib/api';
import { intlQuery } from '../../../lib/filters';
import { int, dec, pct } from '../../../lib/format';
import { img } from '../../../lib/images';
import ErrorBox from '../../../components/ErrorBox';
import CategorySelect from './CategorySelect';
import TeamLogo from '../../../components/TeamLogo';

export const metadata = { title: 'All-Time Records' };

// ── Time formatter ─────────────────────────────────────────────
function fmtTime(s) {
  if (!s) return '--';
  const m = Math.floor(s / 60), sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

// ── Game details formatter ──────────────────────────────────────
function formatGameInfo(r) {
  if (!r) return '--';
  const parts = [r.season];
  
  const stageText = r.stage || '';
  const isQualifier = r.stage_type === 'qualifier' || 
                      stageText.toLowerCase().includes('wild') || 
                      stageText.toLowerCase().includes('qualifier') ||
                      stageText.toLowerCase().includes('qualification');
                      
  const stageTypeLabel = isQualifier ? 'Wildcard' : 'Main';
  const hasStageType = stageText.toLowerCase().includes(stageTypeLabel.toLowerCase()) || 
                      (stageTypeLabel === 'Wildcard' && stageText.toLowerCase().includes('wild card'));
                      
  if (!hasStageType) {
    parts.push(stageTypeLabel);
  }
  
  if (r.stage) parts.push(r.stage);
  if (r.phase_day) parts.push(r.phase_day);
  if (r.game_number) parts.push(`G${r.game_number}`);
  
  return parts.filter(Boolean).join(' ');
}

// ── Category Definitions ────────────────────────────────────────
const PLAYER_GROUPS = [
  {
    title: 'Combat',
    cats: [
      { key: 'kills', label: 'Most Kills', fmt: r => int(r.value), color: 'var(--loss)' },
      { key: 'kda', label: 'Highest KDA', fmt: r => dec(r.value, 2), color: 'var(--accent)' },
      { key: 'damage_taken', label: 'Most Damage Taken', fmt: r => int(r.value), color: '#ff5252' },
      { key: 'gold', label: 'Most Gold', fmt: r => int(r.value), color: '#e8b800' },
      { key: 'total_damage', label: 'Most Damage', fmt: r => int(r.value), color: '#ff7f50' },
      { key: 'building_damage', label: 'Most Building Damage', fmt: r => int(r.value), color: '#42a5f5' },
    ]
  },
  {
    title: 'Multi-Kills',
    cats: [
      { key: 'savage', label: 'Savages', fmt: r => int(r.value), color: '#e056fd' },
      { key: 'legendary', label: 'Legendaries', fmt: r => int(r.value), color: '#f9ca24' },
    ]
  },
  {
    title: 'Zero Deaths',
    cats: [
      { key: 'kills_no_deaths', label: 'Most Kills (0 Deaths)', fmt: r => int(r.value), color: 'var(--loss)' },
      { key: 'assists_no_deaths', label: 'Most Assists (0 Deaths)', fmt: r => int(r.value), color: 'var(--accent)' },
      { key: 'kda_no_deaths', label: 'Highest KDA (0 Deaths)', fmt: r => dec(r.value, 2), color: 'var(--accent)' },
    ]
  },
  {
    title: 'Per Minute',
    cats: [
      { key: 'gpm', label: 'Highest GPM', fmt: r => dec(r.value, 1), color: '#e8b800' },
      { key: 'dpm', label: 'Highest DPM', fmt: r => dec(r.value, 1), color: '#ff7f50' },
      { key: 'dtpm', label: 'Highest DTPM', fmt: r => dec(r.value, 1), color: '#ff5252' },
      { key: 'turret_dpm', label: 'Highest Turret Dmg/m', fmt: r => dec(r.value, 1), color: '#42a5f5' },
    ]
  }
];

const TEAM_GROUPS = [
  {
    title: 'Offense',
    cats: [
      { key: 'team_kills', label: 'Most Team Kills', fmt: r => int(r.value), color: 'var(--loss)' },
      { key: 'team_kills_no_deaths', label: 'Most Kills (0 Deaths)', fmt: r => int(r.value), color: 'var(--loss)' },
      { key: 'team_damage', label: 'Most Team Damage', fmt: r => int(r.value), color: '#ff7f50' },
      { key: 'team_gold', label: 'Most Team Gold', fmt: r => int(r.value), color: '#e8b800' },
      { key: 'team_building_damage', label: 'Most Team Building Dmg', fmt: r => int(r.value), color: '#42a5f5' },
    ]
  },
  {
    title: 'Defense',
    cats: [
      { key: 'team_damage_taken', label: 'Most Team Dmg Taken', fmt: r => int(r.value), color: '#ff5252' },
    ]
  },
  {
    title: 'Per Minute',
    cats: [
      { key: 'team_gpm', label: 'Highest Team GPM', fmt: r => dec(r.value, 1), color: '#e8b800' },
      { key: 'team_dpm', label: 'Highest Team DPM', fmt: r => dec(r.value, 1), color: '#ff7f50' },
    ]
  },
  {
    title: 'Combined (Both Teams)',
    cats: [
      { key: 'combined_kills_most', label: 'Most Combined Kills', fmt: r => int(r.value), color: 'var(--loss)', isCombinedLevel: true },
      { key: 'combined_kills_least', label: 'Least Combined Kills', fmt: r => int(r.value), color: '#74b9ff', isCombinedLevel: true },
      { key: 'combined_damage_most', label: 'Most Combined Damage', fmt: r => int(r.value), color: '#ff7f50', isCombinedLevel: true },
      { key: 'combined_damage_least', label: 'Least Combined Damage', fmt: r => int(r.value), color: '#55efc4', isCombinedLevel: true },
    ]
  },
  {
    title: 'Match Length',
    cats: [
      { key: 'longest_game', label: 'Longest Games', fmt: r => fmtTime(r.game_time_s), color: '#a29bfe', matchLevel: true },
      { key: 'shortest_game', label: 'Shortest Games', fmt: r => fmtTime(r.game_time_s), color: '#26c281', matchLevel: true },
    ]
  }
];

const ALL_CATS = [...PLAYER_GROUPS.flatMap(g => g.cats), ...TEAM_GROUPS.flatMap(g => g.cats)];

// Helper to construct URLs preserving existing parameters
function getUrlWithParams(base, currentParams, newParams) {
  const next = new URLSearchParams(currentParams);
  for (const [k, v] of Object.entries(newParams)) {
    if (v != null) next.set(k, String(v));
    else next.delete(k);
  }
  const qs = next.toString();
  return qs ? `${base}?${qs}` : base;
}

// Table styling shortcuts
const th = {
  padding: '12px 14px',
  fontSize: '11px',
  fontWeight: 600,
  fontFamily: 'var(--font-mono)',
  color: 'var(--muted2)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  borderBottom: '1px solid var(--border)',
  background: 'var(--surface2)',
  textAlign: 'left'
};

const td = {
  padding: '12px 14px',
  borderBottom: '1px solid var(--border)',
  whiteSpace: 'nowrap',
  // Match the left-aligned headers above. Without this, cells fall through to the
  // global `tbody td { text-align: right }` in globals.css and drift out of line.
  textAlign: 'left'
};

export default async function HistoryRecordsPage({ searchParams }) {
  const sp = await searchParams;
  const q = intlQuery(sp, null);

  let data = null;
  let error = null;
  try {
    data = await api.records(q);
  } catch (e) {
    error = e.message;
  }

  if (error) return <ErrorBox error={error} />;
  if (!data) return <div className="empty">No records loaded.</div>;

  const activeCatKey = sp.cat || null;
  const activeTab = sp.tab === 'team' ? 'team' : 'player';

  // ── Top 10 Detailed Table View ───────────────────────────────
  if (activeCatKey) {
    const cat = ALL_CATS.find(c => c.key === activeCatKey) || ALL_CATS[0];
    const catData = data[cat.key];

    // Standard list items for category dropdown (serialized to remove functions)
    const dropdownGroups = [
      { title: 'Player Records', cats: PLAYER_GROUPS.flatMap(g => g.cats).map(c => ({ key: c.key, label: c.label })) },
      { title: 'Team / Match Records', cats: TEAM_GROUPS.flatMap(g => g.cats).map(c => ({ key: c.key, label: c.label })) }
    ];

    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link
            href={getUrlWithParams('/history/records', sp, { cat: null })}
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            ← Back to all records
          </Link>
        </div>

        <div style={{ 
          background: 'var(--surface)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '20px', 
          marginBottom: '24px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}>
          <div>
            <div style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.08em' }}>
              All-Time Single-Game Leaderboard
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, margin: '4px 0 0', textTransform: 'uppercase', fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
              {cat.label}
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>SWITCH CATEGORY:</span>
            <CategorySelect activeKey={cat.key} dropdownGroups={dropdownGroups} />
          </div>
        </div>

        {!catData || !catData.rows || catData.rows.length === 0 ? (
          <div className="empty">No record rows found for this category.</div>
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead>
                <tr style={{ background: 'var(--surface)', color: 'var(--muted2)' }}>
                  <th style={{ ...th, width: '60px' }}>Rank</th>
                  {cat.matchLevel || cat.isCombinedLevel ? (
                    <>
                      <th style={th}>Matchup</th>
                      <th style={th}>Winner</th>
                    </>
                  ) : (catData?.isTeamLevel || cat.key.startsWith('team_')) ? (
                    <>
                      <th style={th}>Team</th>
                      <th style={th}>Opponent</th>
                    </>
                  ) : (
                    <>
                      <th style={th}>Player</th>
                      <th style={th}>Hero</th>
                      <th style={th}>Team</th>
                      <th style={th}>Opponent</th>
                    </>
                  )}
                  <th style={th}>W/L</th>
                  <th style={th}>Date</th>
                  <th style={th}>Tournament</th>
                  <th style={{ ...th, color: 'var(--accent)', textAlign: 'right' }}>Record {cat.label.replace('Most ', '')}</th>
                </tr>
              </thead>
              <tbody>
                {catData.rows.map((r, i) => {
                  const isPlayer = !!r.player;
                  const win = r.win === true || String(r.win) === 'true';

                  return (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)', background: i === 0 ? 'rgba(255,215,0,0.02)' : 'transparent' }}>
                      {/* Rank */}
                      <td style={{ ...td, fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
                        #{i + 1}
                      </td>

                      {/* Details based on category level */}
                      {cat.matchLevel || cat.isCombinedLevel ? (
                        <>
                          {/* Matchup */}
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {r.team_a_flag ? <span>{r.team_a_flag}</span> : null}
                              <TeamLogo src={r.team_a_logo_dark || r.team_a_logo_light} fallbackSrc={img.team(r.team_a_era || r.team_a)} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                              <span style={{ fontWeight: r.winner === r.team_a ? 600 : 400, marginRight: '4px' }}>
                                {r.team_a_era || r.team_a}
                              </span>
                              <span style={{ color: 'var(--muted2)', fontSize: '12px', marginRight: '4px' }}>vs</span>
                              {r.team_b_flag ? <span>{r.team_b_flag}</span> : null}
                              <TeamLogo src={r.team_b_logo_dark || r.team_b_logo_light} fallbackSrc={img.team(r.team_b_era || r.team_b)} alt="" style={{ width: '20px', height: '20px', objectFit: 'contain' }} />
                              <span style={{ fontWeight: r.winner === r.team_b ? 600 : 400 }}>
                                {r.team_b_era || r.team_b}
                              </span>
                            </div>
                          </td>
                          {/* Winner */}
                          <td style={td}>
                           {r.winner ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {r.winner_flag ? <span>{r.winner_flag}</span> : null}
                                <TeamLogo src={r.winner_logo_dark || r.winner_logo_light} fallbackSrc={img.team(r.winner_era || r.winner)} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                                <span style={{ color: 'var(--win)', fontWeight: 600 }}>{r.winner_era || r.winner}</span>
                              </div>
                            ) : '--'}
                          </td>
                        </>
                      ) : (catData?.isTeamLevel || cat.key.startsWith('team_')) ? (
                        <>
                          {/* Team */}
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {r.team_flag ? <span>{r.team_flag}</span> : null}
                              <TeamLogo src={r.team_logo_dark || r.team_logo_light} fallbackSrc={img.team(r.team_code_era || r.team_code)} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                              <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                                {r.team_code_era || r.team_code}
                              </span>
                            </div>
                          </td>
                          {/* Opponent */}
                          <td style={td}>
                            {r.opponent ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {r.opponent_flag ? <span>{r.opponent_flag}</span> : null}
                                <TeamLogo src={r.opponent_logo_dark || r.opponent_logo_light} fallbackSrc={img.team(r.opponent_era || r.opponent)} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                                <span style={{ color: 'var(--text)' }}>
                                  {r.opponent_era || r.opponent}
                                </span>
                              </div>
                            ) : '--'}
                          </td>
                        </>
                      ) : (
                        <>
                          {/* Player */}
                          <td style={td}>
                            <span style={{ fontWeight: 600, color: 'var(--text)' }}>
                              {r.nationality_flag ? <span style={{ marginRight: 6 }}>{r.nationality_flag}</span> : null}
                              {r.player}
                            </span>
                          </td>
                          {/* Hero */}
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              {r.hero_id && (
                                <img src={img.hero(r.hero_id)} alt="" style={{ width: '22px', height: '22px', borderRadius: '50%' }} />
                              )}
                              <span>{r.hero_name}</span>
                            </div>
                          </td>
                          {/* Team */}
                          <td style={td}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {r.team_flag ? <span>{r.team_flag}</span> : null}
                              <TeamLogo src={r.team_logo_dark || r.team_logo_light} fallbackSrc={img.team(r.team_code_era || r.team_code)} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                              <span>{r.team_code_era || r.team_code}</span>
                            </div>
                          </td>
                          {/* Opponent */}
                          <td style={td}>
                            {r.opponent ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {r.opponent_flag ? <span>{r.opponent_flag}</span> : null}
                                <TeamLogo src={r.opponent_logo_dark || r.opponent_logo_light} fallbackSrc={img.team(r.opponent_era || r.opponent)} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                                <span style={{ color: 'var(--muted)' }}>{r.opponent_era || r.opponent}</span>
                              </div>
                            ) : '--'}
                          </td>
                        </>
                      )}

                      {/* Win/Loss */}
                      <td style={td}>
                        {r.win == null ? '--' : (
                          <span style={{
                            fontWeight: 700,
                            color: win ? 'var(--win)' : 'var(--loss)',
                            fontFamily: 'var(--font-mono)'
                          }}>
                            {win ? 'W' : 'L'}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ ...td, color: 'var(--muted2)', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>
                        {r.played_at ? String(r.played_at).slice(0, 10) : '--'}
                      </td>

                      {/* Season */}
                      <td style={{ ...td, color: 'var(--muted)', fontWeight: 500 }}>
                        {formatGameInfo(r)}
                      </td>

                      {/* Value */}
                      <td style={{ ...td, textAlign: 'right', fontWeight: 700, color: 'var(--accent)', fontSize: '15px' }}>
                        {cat.isCombinedLevel ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span>{cat.fmt(r)}</span>
                            <span style={{ fontSize: '11px', color: 'var(--muted2)', fontWeight: 500, fontFamily: 'var(--font-mono)' }}>
                              ({int(r.team_a_value)} − {int(r.team_b_value)})
                            </span>
                          </div>
                        ) : (
                          cat.fmt(r)
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  // ── Dashboard Grid View (Default) ─────────────────────────────
  const isPlayerTab = activeTab === 'player';
  const activeGroups = isPlayerTab ? PLAYER_GROUPS : TEAM_GROUPS;

  return (
    <div>
      {/* Tab Selectors */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '1px' }}>
        <Link
          href={getUrlWithParams('/history/records', sp, { tab: 'player' })}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '.04em',
            borderBottom: '2px solid ' + (isPlayerTab ? 'var(--accent)' : 'transparent'),
            color: isPlayerTab ? 'var(--accent)' : 'var(--muted2)',
            transition: 'color var(--dur-fast)'
          }}
        >
          Player Records
        </Link>
        <Link
          href={getUrlWithParams('/history/records', sp, { tab: 'team' })}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
            letterSpacing: '.04em',
            borderBottom: '2px solid ' + (!isPlayerTab ? 'var(--accent)' : 'transparent'),
            color: !isPlayerTab ? 'var(--accent)' : 'var(--muted2)',
            transition: 'color var(--dur-fast)'
          }}
        >
          Team &amp; Match Records
        </Link>
      </div>

      {activeGroups.map((group) => (
        <div key={group.title} style={{ marginBottom: '32px' }}>
          <h3 style={{
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            color: 'var(--muted2)',
            textTransform: 'uppercase',
            letterSpacing: '.12em',
            marginBottom: '12px',
            borderLeft: '2.5px solid var(--accent)',
            paddingLeft: '8px',
            lineHeight: 1
          }}>
            {group.title}
          </h3>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
            gap: '16px'
          }}>
            {group.cats.map((c) => {
              const catData = data[c.key];
              const r = catData?.rows?.[0]; // index 0 is the #1 record

              if (!r) {
                return (
                  <div key={c.key} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    minHeight: '120px'
                  }}>
                    <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>
                      {c.label}
                    </div>
                    <div style={{ color: 'var(--muted2)', fontSize: '13px', marginTop: '8px' }}>No data</div>
                  </div>
                );
              }

              const win = r.win === true || String(r.win) === 'true';

              return (
                <Link
                  key={c.key}
                  href={getUrlWithParams('/history/records', sp, { cat: c.key })}
                  className="record-card-hoverable"
                  style={{
                    display: 'block',
                    background: 'rgba(20, 20, 31, 0.6)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    color: 'inherit',
                    textDecoration: 'none',
                    transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s',
                    position: 'relative',
                    cursor: 'pointer'
                  }}
                >
                  {/* Category Title */}
                  <div style={{
                    fontSize: '10.5px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--muted2)',
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <span>{c.label}</span>
                    <span style={{ color: 'var(--accent)', fontSize: '9px', fontWeight: 600 }}>TOP 10 →</span>
                  </div>

                  {/* Value */}
                  <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '32px',
                    color: 'var(--accent)',
                    lineHeight: '1.2',
                    margin: '6px 0 2px',
                    letterSpacing: '.02em'
                  }}>
                    {c.fmt(r)}
                  </div>

                  {/* Record Holder Info */}
                  <div style={{ marginTop: '8px', borderTop: '1px solid var(--border)', paddingTop: '8px' }}>
                    {/* Player Info (If player category) */}
                    {!c.matchLevel && !c.isCombinedLevel ? (
                      isPlayerTab ? (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                            {r.hero_id && (
                              <img src={img.hero(r.hero_id)} alt="" style={{ width: '18px', height: '18px', borderRadius: '50%' }} />
                            )}
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                              {r.nationality_flag ? <span style={{ marginRight: 5 }}>{r.nationality_flag}</span> : null}
                              {r.player}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--muted2)' }}>
                            {r.team_flag ? <span>{r.team_flag}</span> : null}
                            <TeamLogo src={r.team_logo_dark || r.team_logo_light} fallbackSrc={img.team(r.team_code_era || r.team_code)} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                            <span style={{ color: win ? 'var(--win)' : 'var(--text)', fontWeight: 600, marginRight: '4px' }}>
                              {r.team_code_era || r.team_code}
                            </span>
                            <span style={{ marginRight: '4px' }}>vs</span>
                            {r.opponent_flag ? <span>{r.opponent_flag}</span> : null}
                            <TeamLogo src={r.opponent_logo_dark || r.opponent_logo_light} fallbackSrc={img.team(r.opponent_era || r.opponent)} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                            <span>
                              {r.opponent_era || r.opponent}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                            {r.team_flag ? <span>{r.team_flag}</span> : null}
                            <TeamLogo src={r.team_logo_dark || r.team_logo_light} fallbackSrc={img.team(r.team_code_era || r.team_code)} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                            <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                              {r.team_code_era || r.team_code}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: 'var(--muted2)' }}>
                            <span style={{ marginRight: '4px' }}>vs</span>
                            {r.opponent_flag ? <span>{r.opponent_flag}</span> : null}
                            <TeamLogo src={r.opponent_logo_dark || r.opponent_logo_light} fallbackSrc={img.team(r.opponent_era || r.opponent)} alt="" style={{ width: '14px', height: '14px', objectFit: 'contain' }} />
                            <span>
                              {r.opponent_flag && false ? <span style={{ marginRight: '4px' }}>{r.opponent_flag}</span> : null}
                              {r.opponent_era || r.opponent}
                            </span>
                          </div>
                        </>
                      )
                    ) : c.isCombinedLevel ? (
                      <>
                        {/* Combined team info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                          {r.team_a_flag ? <span>{r.team_a_flag}</span> : null}
                          <TeamLogo src={r.team_a_logo_dark || r.team_a_logo_light} fallbackSrc={img.team(r.team_a_era || r.team_a)} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                          <span style={{ marginRight: '4px' }}>
                            {r.team_a_era || r.team_a}
                          </span>
                          <span style={{ color: 'var(--muted2)', fontWeight: 400, fontSize: '11px', marginRight: '4px' }}>vs</span>
                          {r.team_b_flag ? <span>{r.team_b_flag}</span> : null}
                          <TeamLogo src={r.team_b_logo_dark || r.team_b_logo_light} fallbackSrc={img.team(r.team_b_era || r.team_b)} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                          <span>
                            {r.team_b_era || r.team_b}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--muted2)', fontFamily: 'var(--font-mono)' }}>
                          Split: {int(r.team_a_value)} − {int(r.team_b_value)}
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Matchup info */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>
                          {r.team_a_flag ? <span>{r.team_a_flag}</span> : null}
                          <TeamLogo src={r.team_a_logo_dark || r.team_a_logo_light} fallbackSrc={img.team(r.team_a_era || r.team_a)} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                          <span style={{ marginRight: '4px' }}>
                            {r.team_a_flag && false ? <span style={{ marginRight: '4px' }}>{r.team_a_flag}</span> : null}
                            {r.team_a_era || r.team_a}
                          </span>
                          <span style={{ color: 'var(--muted2)', fontWeight: 400, fontSize: '11px', marginRight: '4px' }}>vs</span>
                          {r.team_b_flag ? <span>{r.team_b_flag}</span> : null}
                          <TeamLogo src={r.team_b_logo_dark || r.team_b_logo_light} fallbackSrc={img.team(r.team_b_era || r.team_b)} alt="" style={{ width: '16px', height: '16px', objectFit: 'contain' }} />
                          <span>
                            {r.team_b_flag && false ? <span style={{ marginRight: '4px' }}>{r.team_b_flag}</span> : null}
                            {r.team_b_era || r.team_b}
                          </span>
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--win)', fontWeight: 600 }}>
                          Winner: {r.winner_era || r.winner}
                        </div>
                      </>
                    )}

                    {/* Metadata Footer */}
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      fontSize: '10px', 
                      color: 'var(--muted2)', 
                      fontFamily: 'var(--font-mono)', 
                      marginTop: '6px' 
                    }}>
                      <span>{formatGameInfo(r)}</span>
                      <span>{r.played_at ? String(r.played_at).slice(0, 10) : '--'}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* Embedded CSS for hover transitions on cards */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .record-card-hoverable:hover {
            border-color: var(--accent) !important;
            transform: translateY(-3px) !important;
            box-shadow: 0 4px 20px rgba(255, 215, 0, 0.1) !important;
          }
        `
      }} />
    </div>
  );
}
