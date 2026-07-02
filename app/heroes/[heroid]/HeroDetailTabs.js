'use client';

import { useState, useEffect } from 'react';
import { num, int, dec } from '../../../lib/format';
import { img } from '../../../lib/images';
import TeamLogo from '../../../components/TeamLogo';
import StatTable from '../../../components/StatTable';
import { PLAYER_COLUMNS, STAT_GROUPS } from '../../../lib/columns';

const big = (v) => int(v);
const d2 = (v, d = 2) => dec(v, d);
const winPct = (w, g) => {
  const games = num(g);
  return games > 0 ? `${dec((num(w) / games) * 100, 1)}%` : '--';
};

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 8px)', padding: 16, marginBottom: 16 };
// Same header/cell alignment rule as PlayerLegacy — both sides of a column always match.
const th = { padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
const thL = { ...th, textAlign: 'left' };
const td = { padding: '8px 10px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', textAlign: 'right' };
const tdL = { ...td, textAlign: 'left' };
const tabBtn = (active) => ({ padding: '7px 16px', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500, background: active ? 'rgba(255,215,0,0.07)' : 'transparent', color: active ? 'var(--accent)' : 'var(--muted2)' });

function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>;
}

const SECTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'draft', label: 'Draft' },
  { id: 'synergy', label: 'Synergy' },
  { id: 'vsteams', label: 'vs Teams' },
  { id: 'winloss', label: 'Win/Loss' },
  { id: 'players', label: 'Players' },
  { id: 'compare', label: 'Compare' },
];

export default function HeroDetailTabs({ heroid, overview, synergy, vsTeams, winLoss, roles, bans, players }) {
  const [active, setActive] = useState('overview');

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 20px' }}>
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" style={tabBtn(active === s.id)} onClick={() => setActive(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {active === 'overview' && <OverviewSection t={overview} />}
      {active === 'draft' && <DraftSection roles={roles} bans={bans} />}
      {active === 'synergy' && <SynergySection data={synergy} />}
      {active === 'vsteams' && <VsTeamsSection rows={vsTeams} />}
      {active === 'winloss' && <WinLossSection rows={winLoss} />}
      {active === 'players' && <PlayersSection rows={players} />}
      {active === 'compare' && <CompareSection heroid={heroid} thisHero={overview} />}
    </div>
  );
}

// ── Overview ──────────────────────────────────────────────────────────────────
function OverviewSection({ t }) {
  const Row = ({ label, value, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted2)', fontSize: 12 }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || 'var(--text)' }}>{value}</span>
    </div>
  );
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
      <div style={card}>
        <SectionTitle>Record</SectionTitle>
        <Row label="Picks" value={big(t.picks)} />
        <Row label="Wins" value={big(t.wins)} color="var(--win)" />
        <Row label="Losses" value={big(t.losses)} color="var(--loss)" />
        <Row label="Win Rate" value={t.win_rate != null ? `${d2(t.win_rate, 1)}%` : '--'} color="var(--win)" />
        <Row label="KDA" value={t.kda != null ? d2(t.kda) : '--'} />
        <Row label="Distinct Players" value={big(t.players)} />
      </div>
      <div style={card}>
        <SectionTitle>Per-Game Averages</SectionTitle>
        <Row label="Kills" value={d2(t.avg_kills)} />
        <Row label="Deaths" value={d2(t.avg_deaths)} />
        <Row label="Assists" value={d2(t.avg_assists)} />
        <Row label="Gold" value={big(t.gpm)} />
        <Row label="GPM" value={d2(t.gpm, 1)} />
        <Row label="Damage" value={big(t.avg_damage)} />
        <Row label="DPM" value={d2(t.dpm, 1)} />
        <Row label="Damage Taken" value={big(t.avg_damage_taken)} />
      </div>
      <div style={card}>
        <SectionTitle>Objectives</SectionTitle>
        <Row label="Turtles" value={d2(t.avg_turtles)} />
        <Row label="Turtle%" value={t.turtle_pct != null ? `${d2(t.turtle_pct, 1)}%` : '--'} />
        <Row label="Lords" value={d2(t.avg_lords)} />
        <Row label="Lord%" value={t.lord_pct != null ? `${d2(t.lord_pct, 1)}%` : '--'} />
        <Row label="Turrets" value={d2(t.avg_turrets)} />
        <Row label="Turret%" value={t.turret_pct != null ? `${d2(t.turret_pct, 1)}%` : '--'} />
        <Row label="First Blood%" value={t.first_blood_pct != null ? `${d2(t.first_blood_pct, 1)}%` : '--'} />
      </div>
      <div style={card}>
        <SectionTitle>Milestones &amp; Totals</SectionTitle>
        <Row label="MVPs" value={big(t.mvps)} />
        <Row label="Savages" value={big(t.savages)} />
        <Row label="Maniacs" value={big(t.maniacs)} />
        <Row label="Total Kills" value={big(t.total_kills)} />
        <Row label="Total Deaths" value={big(t.total_deaths)} />
        <Row label="Total Assists" value={big(t.total_assists)} />
        <Row label="Total Gold" value={big(t.total_gold)} />
        <Row label="Total Damage" value={big(t.total_damage)} />
      </div>
    </div>
  );
}

// ── Draft (roles + bans — MSC 2026-forward only) ───────────────────────────────
function DraftSection({ roles, bans }) {
  const roleRows = roles?.role_distribution || [];
  const matchupRows = roles?.role_matchup || [];
  const hasBans = bans && (bans.games_with_draft || 0) > 0;

  if (!roleRows.length && !hasBans) {
    return (
      <div className="empty">
        No draft data for this selection — role and ban stats are only tracked for
        rich-collected editions (MSC 2026 onward), not the older box-score-imported
        editions.
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
      {roleRows.length > 0 && (
        <div style={card}>
          <SectionTitle>Role Distribution</SectionTitle>
          {roleRows.map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted2)', fontSize: 12 }}>{r.role_lane || 'Unknown'}</span>
              <span style={{ fontWeight: 700 }}>{big(r.games)}</span>
            </div>
          ))}
        </div>
      )}
      {hasBans && (
        <div style={card}>
          <SectionTitle>Ban Rate</SectionTitle>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted2)', fontSize: 12 }}>Bans</span>
            <span style={{ fontWeight: 700 }}>{big(bans.bans)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
            <span style={{ color: 'var(--muted2)', fontSize: 12 }}>Ban Rate</span>
            <span style={{ fontWeight: 700 }}>{bans.ban_rate != null ? `${d2(bans.ban_rate, 1)}%` : '--'}</span>
          </div>
        </div>
      )}
      {matchupRows.length > 0 && (
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <SectionTitle>Role Matchup ({roles.primary_role})</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={thL}>Opposing Hero</th>
                  <th style={th}>Games</th>
                  <th style={th}>This Hero's Win%</th>
                </tr>
              </thead>
              <tbody>
                {matchupRows.map((r, i) => (
                  <tr key={i}>
                    <td style={tdL}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {img.hero(r.heroid) ? <img src={img.hero(r.heroid)} alt="" style={{ width: 22, height: 22, borderRadius: '50%' }} /> : null}
                        <span>{r.hero_name}</span>
                      </div>
                    </td>
                    <td style={td}>{big(r.games)}</td>
                    <td style={{ ...td, color: 'var(--win)', fontWeight: 600 }}>{winPct(r.wins, r.games)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Synergy ───────────────────────────────────────────────────────────────────
function SynergyTable({ title, rows }) {
  if (!rows.length) return <div className="empty">No data.</div>;
  return (
    <div style={card}>
      <SectionTitle>{title}</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thL}>Hero</th>
              <th style={th}>Games</th>
              <th style={th}>Win%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={tdL}>{r.hero_name}</td>
                <td style={td}>{big(r.games)}</td>
                <td style={{ ...td, color: 'var(--win)', fontWeight: 600 }}>{winPct(r.wins, r.games)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
function SynergySection({ data }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
      <SynergyTable title="Played With" rows={data?.played_with || []} />
      <SynergyTable title="Played Against" rows={data?.played_against || []} />
    </div>
  );
}

// ── vs Teams ──────────────────────────────────────────────────────────────────
function VsTeamsSection({ rows }) {
  if (!rows.length) return <div className="empty">No opponent data.</div>;
  return (
    <div style={card}>
      <SectionTitle>Record vs Teams</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thL}>Opponent</th>
              <th style={th}>Games</th>
              <th style={th}>Win%</th>
              <th style={th}>Avg K</th>
              <th style={th}>Avg D</th>
              <th style={th}>Avg Dmg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td style={tdL}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <TeamLogo src={null} fallbackSrc={img.team(r.opp_team)} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                    <span>{r.opp_team || '--'}</span>
                  </div>
                </td>
                <td style={td}>{big(r.games)}</td>
                <td style={{ ...td, color: 'var(--win)', fontWeight: 600 }}>{winPct(r.wins, r.games)}</td>
                <td style={td}>{d2(r.avg_kills)}</td>
                <td style={td}>{d2(r.avg_deaths)}</td>
                <td style={td}>{big(r.avg_damage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Win/Loss ──────────────────────────────────────────────────────────────────
function WinLossSection({ rows }) {
  if (!rows.length) return <div className="empty">No data.</div>;
  const win = rows.find((r) => r.win === true || r.win === 't' || r.win === 'true');
  const loss = rows.find((r) => r.win === false || r.win === 'f' || r.win === 'false');
  return (
    <div style={card}>
      <SectionTitle>Win vs Loss</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thL}></th>
              <th style={th}>Games</th>
              <th style={th}>Avg K</th>
              <th style={th}>Avg D</th>
              <th style={th}>Avg A</th>
              <th style={th}>Avg Dmg</th>
            </tr>
          </thead>
          <tbody>
            {[{ label: 'Wins', r: win, color: 'var(--win)' }, { label: 'Losses', r: loss, color: 'var(--loss)' }].map(({ label, r, color }) => (
              <tr key={label}>
                <td style={{ ...tdL, color, fontWeight: 700 }}>{label}</td>
                <td style={td}>{big(r?.games)}</td>
                <td style={td}>{d2(r?.avg_kills)}</td>
                <td style={td}>{d2(r?.avg_deaths)}</td>
                <td style={td}>{d2(r?.avg_assists)}</td>
                <td style={td}>{big(r?.avg_damage)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Players who played this hero ──────────────────────────────────────────────
function PlayersSection({ rows }) {
  if (!rows || !rows.length) return <div className="empty">No player data.</div>;
  return <StatTable columns={PLAYER_COLUMNS} groups={STAT_GROUPS} rows={rows} rowKey="player_key" defaultLimit={20} />;
}

// ── Compare vs another hero ─────────────────────────────────────────────────
function CompareSection({ heroid, thisHero }) {
  const [otherId, setOtherId] = useState('');
  const [heroes, setHeroes] = useState([]);
  const [otherData, setOtherData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/intl/heroes')
      .then((r) => r.json())
      .then((d) => setHeroes(Array.isArray(d) ? d.filter((h) => h.hero_id && String(h.hero_id) !== String(heroid)) : []))
      .catch(() => setHeroes([]));
  }, [heroid]);

  useEffect(() => {
    if (!otherId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch(`/api/intl/heroes/${encodeURIComponent(otherId)}/overview`)
      .then((r) => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) setOtherData(d); })
      .catch((e) => { if (!cancelled) { setError(e.message); setOtherData(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [otherId]);

  const ROWS = [
    { key: 'picks', label: 'Picks', higher: true },
    { key: 'win_rate', label: 'Win%', higher: true },
    { key: 'kda', label: 'KDA', higher: true },
    { key: 'avg_kills', label: 'Avg Kills', higher: true },
    { key: 'avg_deaths', label: 'Avg Deaths', higher: false },
    { key: 'avg_assists', label: 'Avg Assists', higher: true },
    { key: 'gpm', label: 'GPM', higher: true },
    { key: 'dpm', label: 'DPM', higher: true },
    { key: 'avg_damage', label: 'Avg Damage', higher: true },
  ];

  return (
    <div>
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--muted2)', fontSize: 13 }}>Compare with:</span>
        <select
          value={otherId}
          onChange={(e) => setOtherId(e.target.value)}
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: 12, minWidth: 220 }}
        >
          <option value="">Select a hero…</option>
          {heroes.map((h) => (
            <option key={h.hero_id} value={h.hero_id}>{h.hero_name}</option>
          ))}
        </select>
      </div>

      {loading && <div className="empty">Loading comparison…</div>}
      {error && <div className="empty">Could not load comparison.</div>}

      {!loading && otherData && !error && (
        <div style={card}>
          <SectionTitle>Comparison</SectionTitle>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ ...thL, color: 'var(--win)' }}>{thisHero.hero_name}</th>
                  <th style={{ ...th, textAlign: 'center' }}>Stat</th>
                  <th style={{ ...th, textAlign: 'right', color: 'var(--accent)' }}>{otherData.hero_name}</th>
                </tr>
              </thead>
              <tbody>
                {ROWS.map(({ key, label, higher }) => {
                  const v1 = num(thisHero[key]);
                  const v2 = num(otherData[key]);
                  const p1Better = higher ? v1 > v2 : v1 < v2;
                  const p2Better = higher ? v2 > v1 : v2 < v1;
                  const isInt = Number.isInteger(v1) && Number.isInteger(v2);
                  return (
                    <tr key={key}>
                      <td style={{ ...tdL, fontWeight: p1Better ? 700 : 400, color: p1Better ? 'var(--win)' : 'var(--text)' }}>
                        {isInt ? big(v1) : d2(v1)}
                      </td>
                      <td style={{ ...td, textAlign: 'center', color: 'var(--muted2)' }}>{label}</td>
                      <td style={{ ...td, textAlign: 'right', fontWeight: p2Better ? 700 : 400, color: p2Better ? 'var(--accent)' : 'var(--text)' }}>
                        {isInt ? big(v2) : d2(v2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
