'use client';

import { useState, useMemo, useEffect } from 'react';
import { img } from '../../../lib/images';
import { num, int, dec } from '../../../lib/format';

// ── Small display helpers (intl season labels are already short, e.g. "M3", "MSC 2025") ──
const big = (v) => int(v);
const d2 = (v, d = 2) => dec(v, d);
const winPct = (w, g) => {
  const games = num(g);
  return games > 0 ? `${dec((num(w) / games) * 100, 1)}%` : '--';
};
const shortSeason = (s) => s || '';
function duration(totalS) {
  const s = num(totalS);
  if (!s) return '--';
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const SECTIONS = [
  { id: 'career', label: 'Career Stats' },
  { id: 'teams', label: 'By Team' },
  { id: 'seasons', label: 'Per Season' },
  { id: 'heroes', label: 'Hero Pool' },
  { id: 'vsteams', label: 'vs Teams' },
  { id: 'vsnations', label: 'vs Nation' },
  { id: 'compare', label: 'Compare' },
];

const card = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md, 8px)', padding: 16, marginBottom: 16 };
// Numbers are right-aligned; identity/text columns left-aligned. Header and cell of
// each column share the SAME alignment so they line up (matching globals.css's
// default `text-align: right` for th/td, with `.l` flipping to left).
const th = { padding: '8px 10px', textAlign: 'right', fontSize: 10, fontWeight: 600, fontFamily: 'var(--font-mono)', color: 'var(--muted2)', textTransform: 'uppercase', letterSpacing: '.06em', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' };
const thL = { ...th, textAlign: 'left' };
const td = { padding: '8px 10px', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', textAlign: 'right' };
const tdL = { ...td, textAlign: 'left' };
const tabBtn = (active) => ({ padding: '7px 16px', border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: active ? 700 : 500, background: active ? 'rgba(255,215,0,0.07)' : 'transparent', color: active ? 'var(--accent)' : 'var(--muted2)' });

function SectionTitle({ children }) {
  return <div className="section-title">{children}</div>;
}

export default function PlayerLegacy({ playerKey, query, career, seasons, heroes, vsTeams, vsNations, players }) {
  const [active, setActive] = useState('career');

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', margin: '8px 0 20px' }}>
        {SECTIONS.map((s) => (
          <button key={s.id} type="button" style={tabBtn(active === s.id)} onClick={() => setActive(s.id)}>
            {s.label}
          </button>
        ))}
      </div>

      {active === 'career' && <CareerSection career={career} />}
      {active === 'teams' && <TeamSection rows={career?.by_team || []} />}
      {active === 'seasons' && <SeasonsSection data={seasons} />}
      {active === 'heroes' && <HeroesSection rows={heroes || []} />}
      {active === 'vsteams' && <VsTeamsSection rows={vsTeams || []} />}
      {active === 'vsnations' && <VsNationsSection rows={vsNations || []} />}
      {active === 'compare' && <CompareSection playerKey={playerKey} query={query} players={players || []} />}
    </div>
  );
}

// ── Career ────────────────────────────────────────────────────────────────────
function CareerSection({ career }) {
  const t = career?.totals || {};
  const bg = career?.best_games || {};
  const Row = ({ label, value, color }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ color: 'var(--muted2)', fontSize: 12 }}>{label}</span>
      <span style={{ fontWeight: 700, color: color || 'var(--text)' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
      <div style={card}>
        <SectionTitle>Totals</SectionTitle>
        <Row label="Games Played" value={big(t.games_played)} />
        <Row label="Game Win Rate" value={winPct(t.game_wins, t.games_played)} color="var(--win)" />
        <Row label="Matches Played" value={big(t.matches_played)} />
        <Row label="Match Win Rate" value={winPct(t.match_wins, t.matches_played)} color="var(--win)" />
        <Row label="Kills" value={big(t.total_kills)} color="#ff4757" />
        <Row label="Deaths" value={big(t.total_deaths)} />
        <Row label="Assists" value={big(t.total_assists)} color="#4da6ff" />
        <Row label="Gold" value={big(t.total_gold)} color="#e8b800" />
        <Row label="Damage Dealt" value={big(t.total_damage)} color="#ff7f50" />
        <Row label="Damage Taken" value={big(t.total_damage_taken)} />
        <Row label="MVPs" value={big(t.total_mvps)} color="var(--accent)" />
        <Row label="Savages" value={big(t.total_savages)} color="#9b59b6" />
        <Row label="Legendaries" value={big(t.total_legendaries)} color="#e67e22" />
        <Row label="First Bloods" value={big(t.total_first_bloods)} />
        <Row label="Lords" value={big(t.total_lords)} color="#9b59b6" />
        <Row label="Turtles" value={big(t.total_turtles)} color="#26c281" />
        <Row label="Turrets" value={big(t.total_turrets)} color="#42a5f5" />
        <Row label="Unique Heroes" value={big(t.unique_heroes)} color="#a29bfe" />
        <Row label="Total Game Time" value={duration(t.total_game_time_s)} />
      </div>

      <div style={card}>
        <SectionTitle>Per-Game Averages</SectionTitle>
        <Row label="Kills" value={d2(t.avg_kills)} color="#ff4757" />
        <Row label="Deaths" value={d2(t.avg_deaths)} />
        <Row label="Assists" value={d2(t.avg_assists)} color="#4da6ff" />
        <Row label="KDA" value={d2(t.avg_kda)} color="var(--accent)" />
        <Row label="KP%" value={t.avg_kp != null ? `${t.avg_kp}%` : '--'} color="var(--accent)" />
        <Row label="Gold" value={big(t.avg_gold)} color="#e8b800" />
        <Row label="GPM" value={d2(t.gpm, 1)} color="#e8b800" />
        <Row label="Damage" value={big(t.avg_damage)} color="#ff7f50" />
        <Row label="DPM" value={d2(t.dpm, 1)} color="#ff7f50" />
        <Row label="Dmg Taken" value={big(t.avg_damage_taken)} />
        <Row label="DTPM" value={d2(t.dtpm, 1)} />
        <Row label="Turret Dmg" value={big(t.avg_building_damage)} color="#42a5f5" />
      </div>

      <div style={card}>
        <SectionTitle>Best Single Game</SectionTitle>
        {[
          { key: 'kills', label: 'Most Kills', fmt: (r) => r.kills, color: '#ff4757' },
          { key: 'gold', label: 'Most Gold', fmt: (r) => big(r.gold), color: '#e8b800' },
          { key: 'total_damage', label: 'Most Damage', fmt: (r) => big(r.total_damage), color: '#ff7f50' },
          { key: 'kda', label: 'Highest KDA', fmt: (r) => d2(r.kda), color: 'var(--accent)' },
        ].map(({ key, label, fmt, color }) => {
          const r = bg[key];
          if (!r) return null;
          const portrait = img.hero(r.hero_id);
          return (
            <div key={key} style={{ borderBottom: '1px solid var(--border)', paddingBottom: 10, marginBottom: 10 }}>
              <div style={{ color: 'var(--muted2)', fontSize: 11, marginBottom: 4 }}>{label}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {portrait ? <img src={portrait} alt="" style={{ width: 28, height: 28, borderRadius: '50%' }} /> : null}
                <div>
                  <div style={{ fontWeight: 700, color, fontSize: 16 }}>{fmt(r)}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>
                    {r.hero_name} · {r.opponent ? `vs ${r.opponent}` : ''} · {shortSeason(r.season)}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted2)' }}>
                    {r.kills}/{r.deaths}/{r.assists} · {r.played_at ? String(r.played_at).slice(0, 10) : ''} · {r.win ? 'W' : 'L'}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── By Team ─────────────────────────────────────────────────────────────────--
function TeamSection({ rows }) {
  if (!rows.length) return <div className="empty">No team data.</div>;
  return (
    <div style={card}>
      <SectionTitle>Stats by Team</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thL}>Team</th>
              <th style={thL}>Seasons</th>
              <th style={th}>Games</th>
              <th style={th}>Wins</th>
              <th style={th}>Win%</th>
              <th style={th}>Matches</th>
              <th style={th}>Avg K</th>
              <th style={th}>Avg D</th>
              <th style={th}>Avg A</th>
              <th style={th}>KDA</th>
              <th style={th}>Avg Gold</th>
              <th style={th}>Avg Dmg</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const logo = r.team_logo_dark || img.team(r.team_code);
              return (
                <tr key={i}>
                  <td style={tdL}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {logo ? <img src={logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : null}
                      <span>{r.current_team || r.team_code}</span>
                    </div>
                  </td>
                  <td style={tdL}>{r.first_season === r.last_season ? shortSeason(r.first_season) : `${shortSeason(r.first_season)}–${shortSeason(r.last_season)}`}</td>
                  <td style={td}>{big(r.games)}</td>
                  <td style={{ ...td, color: 'var(--win)' }}>{big(r.wins)}</td>
                  <td style={{ ...td, color: 'var(--win)', fontWeight: 600 }}>{winPct(r.wins, r.games)}</td>
                  <td style={td}>{big(r.matches)}</td>
                  <td style={{ ...td, color: '#ff4757' }}>{d2(r.avg_kills)}</td>
                  <td style={td}>{d2(r.avg_deaths)}</td>
                  <td style={{ ...td, color: '#4da6ff' }}>{d2(r.avg_assists)}</td>
                  <td style={{ ...td, color: 'var(--accent)' }}>{d2(r.avg_kda)}</td>
                  <td style={{ ...td, color: '#e8b800' }}>{big(r.avg_gold)}</td>
                  <td style={{ ...td, color: '#ff7f50' }}>{big(r.avg_damage)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Per Season ─────────────────────────────────────────────────────────────────
const SEASON_COLS = [
  { key: 'games', label: 'G' },
  { key: 'wins', label: 'W' },
  { key: 'avg_kills', label: 'K', dec: true },
  { key: 'avg_deaths', label: 'D', dec: true },
  { key: 'avg_assists', label: 'A', dec: true },
  { key: 'avg_kda', label: 'KDA', dec: true },
  { key: 'gpm', label: 'GPM', dec: true },
  { key: 'avg_gold', label: 'Gold' },
  { key: 'dpm', label: 'DPM', dec: true },
  { key: 'avg_damage', label: 'Dmg' },
  { key: 'total_mvps', label: 'MVP' },
  { key: 'total_savages', label: 'SVG' },
];
function SeasonsSection({ data }) {
  const rows = data?.seasons || [];
  const sh = data?.seasons_heroes || {};
  if (!rows.length) return <div className="empty">No season data.</div>;
  return (
    <div style={card}>
      <SectionTitle>Per Season</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thL}>Season</th>
              <th style={thL}>Team</th>
              {SEASON_COLS.map((c) => <th key={c.key} style={th}>{c.label}</th>)}
              <th style={th}>Win%</th>
              <th style={thL}>Top Heroes</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const logo = r.team_logo_dark || img.team(r.team_code_era || r.team_code);
              return (
                <tr key={i}>
                  <td style={{ ...tdL, color: 'var(--muted)' }}>{shortSeason(r.season)}</td>
                  <td style={tdL}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {logo ? <img src={logo} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} /> : null}
                      <span style={{ fontSize: 11 }}>{r.team_code_era || r.team_code}</span>
                    </div>
                  </td>
                  {SEASON_COLS.map((c) => (
                    <td key={c.key} style={td}>{c.dec ? d2(r[c.key]) : big(r[c.key])}</td>
                  ))}
                  <td style={{ ...td, color: 'var(--win)', fontWeight: 600 }}>{winPct(r.wins, r.games)}</td>
                  <td style={{ ...tdL, maxWidth: 160 }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {(sh[r.season] || []).slice(0, 3).map((h, hi) => (
                        <span key={hi} style={{ fontSize: 10, color: 'var(--muted2)' }}>{h.hero_name} ×{h.games}</span>
                      ))}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Sortable hook (heroes / vs-teams) ──────────────────────────────────────────
function useSortable(rows, defaultKey) {
  const [sortKey, setSortKey] = useState(defaultKey);
  const [asc, setAsc] = useState(false);
  const sorted = useMemo(() => {
    if (!rows?.length) return rows || [];
    return [...rows].sort((a, b) => {
      const va = num(a[sortKey]);
      const vb = num(b[sortKey]);
      return asc ? va - vb : vb - va;
    });
  }, [rows, sortKey, asc]);
  const onSort = (k) => { if (k === sortKey) setAsc((x) => !x); else { setSortKey(k); setAsc(false); } };
  const SortTh = ({ col, label }) => (
    <th style={{ ...th, cursor: 'pointer', color: col === sortKey ? 'var(--accent)' : 'var(--muted2)' }} onClick={() => onSort(col)}>
      {label} {col === sortKey ? (asc ? '↑' : '↓') : ''}
    </th>
  );
  return { sorted, SortTh };
}

// ── Hero Pool ─────────────────────────────────────────────────────────────────
function HeroesSection({ rows }) {
  const { sorted, SortTh } = useSortable(rows, 'games');
  if (!rows.length) return <div className="empty">No hero data.</div>;
  return (
    <div style={card}>
      <SectionTitle>Hero Pool</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thL}>Hero</th>
              <SortTh col="games" label="Games" />
              <SortTh col="wins" label="W" />
              <th style={th}>Win%</th>
              <SortTh col="avg_kills" label="Avg K" />
              <SortTh col="avg_deaths" label="Avg D" />
              <SortTh col="avg_assists" label="Avg A" />
              <SortTh col="avg_kda" label="KDA" />
              <SortTh col="avg_gold" label="Avg Gold" />
              <SortTh col="avg_damage" label="Avg Dmg" />
              <SortTh col="total_mvps" label="MVP" />
              <SortTh col="total_savages" label="SVG" />
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const portrait = img.hero(r.hero_id);
              return (
                <tr key={i}>
                  <td style={tdL}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {portrait ? <img src={portrait} alt="" style={{ width: 24, height: 24, borderRadius: '50%' }} /> : null}
                      <span>{r.hero_name}</span>
                    </div>
                  </td>
                  <td style={td}>{big(r.games)}</td>
                  <td style={{ ...td, color: 'var(--win)' }}>{big(r.wins)}</td>
                  <td style={{ ...td, color: 'var(--win)', fontWeight: 600 }}>{winPct(r.wins, r.games)}</td>
                  <td style={{ ...td, color: '#ff4757' }}>{d2(r.avg_kills)}</td>
                  <td style={td}>{d2(r.avg_deaths)}</td>
                  <td style={{ ...td, color: '#4da6ff' }}>{d2(r.avg_assists)}</td>
                  <td style={{ ...td, color: 'var(--accent)' }}>{d2(r.avg_kda)}</td>
                  <td style={{ ...td, color: '#e8b800' }}>{big(r.avg_gold)}</td>
                  <td style={{ ...td, color: '#ff7f50' }}>{big(r.avg_damage)}</td>
                  <td style={{ ...td, color: 'var(--accent)' }}>{big(r.total_mvps)}</td>
                  <td style={{ ...td, color: '#9b59b6' }}>{big(r.total_savages)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── vs Teams ──────────────────────────────────────────────────────────────────
function VsTeamsSection({ rows }) {
  const { sorted, SortTh } = useSortable(rows, 'games');
  if (!rows.length) return <div className="empty">No opponent data.</div>;
  return (
    <div style={card}>
      <SectionTitle>Record vs Teams</SectionTitle>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thL}>Opponent</th>
              <SortTh col="matches" label="Matches" />
              <th style={th}>M W</th>
              <th style={th}>M L</th>
              <th style={th}>Match WR%</th>
              <SortTh col="games" label="Games" />
              <th style={th}>G W</th>
              <th style={th}>G L</th>
              <th style={th}>Game WR%</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => {
              const logo = r.opponent_logo_dark || img.team(r.opponent);
              const mL = num(r.matches) - num(r.match_wins);
              const gL = num(r.games) - num(r.game_wins);
              return (
                <tr key={i}>
                  <td style={tdL}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {logo ? <img src={logo} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} /> : null}
                      <span>{r.opponent_name || r.opponent || '--'}</span>
                    </div>
                  </td>
                  <td style={td}>{big(r.matches)}</td>
                  <td style={{ ...td, color: 'var(--win)' }}>{big(r.match_wins)}</td>
                  <td style={{ ...td, color: '#ff4757' }}>{big(mL)}</td>
                  <td style={{ ...td, color: 'var(--win)', fontWeight: 600 }}>{winPct(r.match_wins, r.matches)}</td>
                  <td style={td}>{big(r.games)}</td>
                  <td style={{ ...td, color: 'var(--win)' }}>{big(r.game_wins)}</td>
                  <td style={{ ...td, color: '#ff4757' }}>{big(gL)}</td>
                  <td style={{ ...td, color: 'var(--win)', fontWeight: 600 }}>{winPct(r.game_wins, r.games)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── vs Nation ─────────────────────────────────────────────────────────────────
function VsNationsSection({ rows }) {
  const { sorted, SortTh } = useSortable(rows, 'games');
  if (!rows.length) return <div className="empty">No nation data.</div>;
  return (
    <div style={card}>
      <SectionTitle>Record vs Nation</SectionTitle>
      <div style={{ fontSize: 11, color: 'var(--muted2)', marginBottom: 10 }}>
        Grouped by the represented country of the opposing team.
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr>
              <th style={thL}>Nation</th>
              <SortTh col="matches" label="Matches" />
              <th style={th}>M W</th>
              <th style={th}>Match WR%</th>
              <SortTh col="games" label="Games" />
              <th style={th}>G W</th>
              <th style={th}>Game WR%</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={i}>
                <td style={tdL}>
                  <span className="idcell">
                    <span className="flag">{r.country_flag || '🏳️'}</span>
                    <span>{r.country || r.country_code}</span>
                  </span>
                </td>
                <td style={td}>{big(r.matches)}</td>
                <td style={{ ...td, color: 'var(--win)' }}>{big(r.match_wins)}</td>
                <td style={{ ...td, color: 'var(--win)', fontWeight: 600 }}>{winPct(r.match_wins, r.matches)}</td>
                <td style={td}>{big(r.games)}</td>
                <td style={{ ...td, color: 'var(--win)' }}>{big(r.wins)}</td>
                <td style={{ ...td, color: 'var(--win)', fontWeight: 600 }}>{winPct(r.wins, r.games)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Compare ───────────────────────────────────────────────────────────────────
const COMPARE_ROWS = [
  { key: 'games_played', label: 'Games', higher: true },
  { key: 'game_wins', label: 'Game Wins', higher: true },
  { key: 'matches_played', label: 'Matches', higher: true },
  { key: 'match_wins', label: 'Match Wins', higher: true },
  { key: 'total_kills', label: 'Total Kills', higher: true },
  { key: 'total_deaths', label: 'Total Deaths', higher: false },
  { key: 'total_assists', label: 'Total Assists', higher: true },
  { key: 'total_mvps', label: 'MVPs', higher: true },
  { key: 'total_savages', label: 'Savages', higher: true },
  { key: 'unique_heroes', label: 'Unique Heroes', higher: true },
  { key: 'avg_kills', label: 'Avg Kills', higher: true },
  { key: 'avg_deaths', label: 'Avg Deaths', higher: false },
  { key: 'avg_assists', label: 'Avg Assists', higher: true },
  { key: 'avg_kda', label: 'Avg KDA', higher: true },
  { key: 'avg_gold', label: 'Avg Gold', higher: true },
  { key: 'gpm', label: 'GPM', higher: true },
  { key: 'dpm', label: 'DPM', higher: true },
];

function CompareSection({ playerKey, query, players }) {
  const [other, setOther] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!other) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch(`/api/intl/players/${encodeURIComponent(playerKey)}/compare/${encodeURIComponent(other)}${query}`)
      .then((r) => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); })
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) { setError(e.message); setData(null); } })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [other, playerKey, query]);

  const options = players.filter((p) => p.player_key !== playerKey);

  return (
    <div>
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <span style={{ color: 'var(--muted2)', fontSize: 13 }}>Compare with:</span>
        <select
          value={other}
          onChange={(e) => setOther(e.target.value)}
          style={{ background: 'var(--surface2)', color: 'var(--text)', border: '1px solid var(--border)', padding: '6px 10px', fontSize: 12, minWidth: 220 }}
        >
          <option value="">Select a player…</option>
          {options.map((p) => (
            <option key={p.player_key} value={p.player_key}>{p.player} ({big(p.games)}g)</option>
          ))}
        </select>
      </div>

      {loading && <div className="empty">Loading comparison…</div>}
      {error && <div className="empty">Could not load comparison.</div>}

      {!loading && data && !error && (() => {
        const { p1, p2, h2h, as_teammates, heroes } = data;
        return (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, marginBottom: 12 }}>
              <div style={{ ...card, textAlign: 'center' }}>
                <div style={{ color: 'var(--muted2)', fontSize: 12, marginBottom: 4 }}>Head-to-Head (as opponents)</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  <span style={{ color: 'var(--win)' }}>{h2h.p1_wins}</span>
                  <span style={{ color: 'var(--muted2)', margin: '0 8px' }}>–</span>
                  <span style={{ color: '#ff4757' }}>{h2h.p2_wins}</span>
                </div>
                <div style={{ color: 'var(--muted2)', fontSize: 11, marginTop: 2 }}>{h2h.games.length} games</div>
                <div style={{ color: 'var(--muted)', fontSize: 11 }}>{p1.player} vs {p2.player}</div>
              </div>
              <div style={{ ...card, textAlign: 'center' }}>
                <div style={{ color: 'var(--muted2)', fontSize: 12, marginBottom: 4 }}>As Teammates</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  <span style={{ color: 'var(--win)' }}>{as_teammates.wins}</span>
                  <span style={{ color: 'var(--muted2)', margin: '0 8px' }}>–</span>
                  <span style={{ color: '#ff4757' }}>{as_teammates.total - as_teammates.wins}</span>
                </div>
                <div style={{ color: 'var(--muted2)', fontSize: 11, marginTop: 2 }}>{as_teammates.total} games together</div>
              </div>
            </div>

            <div style={card}>
              <SectionTitle>Career Comparison</SectionTitle>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ ...thL, color: 'var(--win)' }}>{p1.player}</th>
                      <th style={{ ...th, textAlign: 'center' }}>Stat</th>
                      <th style={{ ...th, textAlign: 'right', color: 'var(--accent)' }}>{p2.player}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARE_ROWS.map(({ key, label, higher }) => {
                      const v1 = num(p1.career?.[key]);
                      const v2 = num(p2.career?.[key]);
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

            <div style={card}>
              <SectionTitle>Hero Pool Comparison</SectionTitle>
              {heroes.shared.length > 0 && (
                <>
                  <div style={{ color: 'var(--muted2)', fontSize: 12, marginBottom: 8 }}>Shared Heroes ({heroes.shared.length})</div>
                  <div style={{ overflowX: 'auto', marginBottom: 16 }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th style={{ ...th, color: 'var(--win)' }}>{p1.player} WR%</th>
                          <th style={{ ...th, color: 'var(--win)' }}>{p1.player} G</th>
                          <th style={{ ...th, textAlign: 'center' }}>Hero</th>
                          <th style={{ ...th, textAlign: 'right', color: 'var(--accent)' }}>{p2.player} G</th>
                          <th style={{ ...th, textAlign: 'right', color: 'var(--accent)' }}>{p2.player} WR%</th>
                        </tr>
                      </thead>
                      <tbody>
                        {heroes.shared.slice(0, 20).map((h, i) => (
                          <tr key={i}>
                            <td style={{ ...td, color: 'var(--win)' }}>{winPct(h.p1.wins, h.p1.games)}</td>
                            <td style={{ ...td, color: 'var(--win)' }}>{big(h.p1.games)}</td>
                            <td style={{ ...td, textAlign: 'center' }}>{h.hero_name}</td>
                            <td style={{ ...td, textAlign: 'right', color: 'var(--muted)' }}>{big(h.p2.games)}</td>
                            <td style={{ ...td, textAlign: 'right', color: 'var(--muted)' }}>{winPct(h.p2.wins, h.p2.games)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: `${p1.player} Exclusive`, list: heroes.p1_unique, color: 'var(--win)' },
                  { label: `${p2.player} Exclusive`, list: heroes.p2_unique, color: 'var(--accent)' },
                ].map(({ label, list, color }) => (
                  <div key={label}>
                    <div style={{ color: 'var(--muted2)', fontSize: 12, marginBottom: 6 }}>{label} ({list.length})</div>
                    {list.slice(0, 10).map((h, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid var(--border)', fontSize: 12 }}>
                        <span style={{ color }}>{h.hero_name}</span>
                        <span style={{ color: 'var(--muted2)' }}>{big(h.games)}g · {winPct(h.wins, h.games)}</span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {h2h.games.length > 0 && (
              <div style={card}>
                <SectionTitle>Head-to-Head Games ({h2h.games.length})</SectionTitle>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr>
                        <th style={thL}>Date</th>
                        <th style={thL}>Season</th>
                        <th style={thL}>{p1.player} Hero</th>
                        <th style={thL}>{p2.player} Hero</th>
                        <th style={thL}>Result</th>
                      </tr>
                    </thead>
                    <tbody>
                      {h2h.games.slice(0, 30).map((g, i) => (
                        <tr key={i}>
                          <td style={{ ...tdL, color: 'var(--muted2)' }}>{g.played_at ? String(g.played_at).slice(0, 10) : '--'}</td>
                          <td style={{ ...tdL, color: 'var(--muted)' }}>{shortSeason(g.season)}</td>
                          <td style={tdL}>{g.p1_hero}</td>
                          <td style={tdL}>{g.p2_hero}</td>
                          <td style={{ ...tdL, fontWeight: 700, color: g.p1_win ? 'var(--win)' : '#ff4757' }}>{g.p1_win ? 'W' : 'L'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        );
      })()}
    </div>
  );
}
