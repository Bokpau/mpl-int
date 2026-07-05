'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import ErrorBox from '../ErrorBox';
import PageHead from '../PageHead';
import StatTable from '../StatTable';
import StatLegend from '../StatLegend';
import { RoleImg } from '../Images';
import TeamLogo from '../TeamLogo';
import { img } from '../../lib/images';
import { CURRENT_PLAYER_COLUMNS as COLUMNS, STAT_GROUPS } from '../../lib/columns';

// Player leaderboard for one selection. Customized specifically for the Current Tournament.
// Supports interactive filters: Stage (Overall, Wild Card, Main), Side (Blue, Red),
// W/L (Wins, Losses), Patches list, and client-side Role and Team filters.
export default function PlayerStatsView({ eff, label, initialRows, context = 'current', columns = COLUMNS }) {
  const scope = eff.scope || 'MSC';
  const season = eff.season || '2026';

  const configuredColumns = useMemo(() => {
    return columns.map(c => {
      if (c.type === 'player' || c.type === 'team') {
        return { ...c, query: { context } };
      }
      return c;
    });
  }, [columns, context]);

  // Server-side filter matches (refetched via API)
  const [stage, setStage] = useState(eff.stage || ''); // Overall = '', Wild Card = 'qualifier', Main = 'main'
  const [side, setSide] = useState(''); // All = '', Blue = 'blue', Red = 'red'
  const [result, setResult] = useState(''); // All = '', Wins = 'wins', Losses = 'losses'
  const [patch, setPatch] = useState('all');

  // Client-side filter states
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');

  // Roster lists and rows states
  const [rows, setRows] = useState(initialRows || []);
  const [patches, setPatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const isInitialMount = useRef(true);

  // Fetch available patches for this tournament on mount
  useEffect(() => {
    fetch(`/api/intl/patches?scope=${scope}&season=${season}`)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(d => setPatches(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, [scope, season]);

  // Build unified query parameters string
  const buildQ = (stageVal = stage, sideVal = side, resultVal = result, patchVal = patch) => {
    const p = new URLSearchParams();
    p.set('scope', scope);
    p.set('season', season);
    if (stageVal) p.set('stage', stageVal);
    if (sideVal) p.set('side', sideVal);
    if (resultVal) p.set('result', resultVal);
    if (patchVal && patchVal !== 'all') p.set('patch', patchVal);
    const s = p.toString();
    return s ? '?' + s : '';
  };

  // Main data fetch (triggers on any global filter changes)
  useEffect(() => {
    // Skip initial fetch on mount since we have initialRows from server
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    setLoading(true);
    setError(null);
    
    const q = buildQ();
    fetch(`/api/intl/leaderboard${q}`)
      .then(res => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return res.json();
      })
      .then(d => {
        setRows(Array.isArray(d) ? d : []);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [stage, side, result, patch]);

  // Client-side populated team list based on the active rows
  const availableTeams = useMemo(() => {
    if (!rows) return ['ALL'];
    const codes = [...new Set(rows.map(r => r.latest_team_code).filter(Boolean))].sort();
    return ['ALL', ...codes];
  }, [rows]);

  // Map of team code to its database dark logo URL for filters
  const teamLogoMap = useMemo(() => {
    const map = {};
    if (rows) {
      rows.forEach(r => {
        if (r.latest_team_code && r.team_logo_dark) {
          map[r.latest_team_code] = r.team_logo_dark;
        }
      });
    }
    return map;
  }, [rows]);

  // Apply client-side filters (Role, Team)
  const filteredRows = useMemo(() => {
    if (!rows) return [];
    return rows.filter(row => {
      if (roleFilter !== 'ALL' && row.role_lane !== roleFilter) return false;
      if (teamFilter !== 'ALL' && row.latest_team_code !== teamFilter) return false;
      return true;
    });
  }, [rows, roleFilter, teamFilter]);

  const isFiltered = stage !== '' || side !== '' || result !== '' || patch !== 'all' || roleFilter !== 'ALL' || teamFilter !== 'ALL';
  const resetFilters = () => {
    setStage('');
    setSide('');
    setResult('');
    setPatch('all');
    setRoleFilter('ALL');
    setTeamFilter('ALL');
  };

  return (
    <div className="container">
      <PageHead eyebrow={label} title="Player Stats">
        Player leaderboard grouped by stable identity — rename- and account-proof. All players in the tournament are eligible.
      </PageHead>

      {/* Filters Card */}
      <div className="card" style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 16, padding: 18 }}>
        {/* Global/Refetch Filters (Stage, Side, W/L, Patch) */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {/* Stage */}
          <div className="filter-group">
            <label>Stage</label>
            <div className="seg">
              {[
                { val: '', label: 'Overall' },
                { val: 'qualifier', label: 'Wild Card' },
                { val: 'main', label: 'Main' }
              ].map(t => (
                <button key={t.val} className={stage === t.val ? 'on' : ''} onClick={() => setStage(t.val)}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Side */}
          <div className="filter-group">
            <label>Side</label>
            <div className="seg">
              {[
                { val: '', label: 'All' },
                { val: 'blue', label: 'Blue' },
                { val: 'red', label: 'Red' }
              ].map(s => (
                <button key={s.val} className={side === s.val ? 'on' : ''} onClick={() => setSide(s.val)}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* W/L */}
          <div className="filter-group">
            <label>W/L</label>
            <div className="seg">
              {[
                { val: '', label: 'All' },
                { val: 'wins', label: 'Wins' },
                { val: 'losses', label: 'Losses' }
              ].map(r => (
                <button key={r.val} className={result === r.val ? 'on' : ''} onClick={() => setResult(r.val)}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Patch */}
          {patches.length > 0 && (
            <div className="filter-group">
              <label>Patch</label>
              <select value={patch} onChange={e => setPatch(e.target.value)}>
                <option value="all">All Patches</option>
                {patches.map(p => (
                  <option key={p} value={p}>
                    Patch {p}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Client-side Filters (Role, Team) */}
        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 16 }}>
          {/* Role */}
          <div className="filter-group">
            <label>Role</label>
            <div className="seg">
              <button className={roleFilter === 'ALL' ? 'on' : ''} onClick={() => setRoleFilter('ALL')}>
                All
              </button>
              {['EXP LANE', 'JUNGLE', 'MID LANE', 'ROAM', 'GOLD LANE'].map(r => (
                <button
                  key={r}
                  title={r}
                  aria-label={r}
                  className={roleFilter === r ? 'on' : ''}
                  onClick={() => setRoleFilter(r)}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '6px 10px' }}
                >
                  <RoleImg role={r} size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Team */}
          <div className="filter-group" style={{ maxWidth: '100%' }}>
            <label>Team</label>
            <div className="seg" style={{ flexWrap: 'wrap' }}>
              <button className={teamFilter === 'ALL' ? 'on' : ''} onClick={() => setTeamFilter('ALL')}>
                All
              </button>
              {availableTeams.filter(t => t !== 'ALL').map(code => (
                <button
                  key={code}
                  title={code}
                  aria-label={code}
                  className={teamFilter === code ? 'on' : ''}
                  onClick={() => setTeamFilter(code)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '6px 10px' }}
                >
                  <TeamLogo src={teamLogoMap[code]} fallbackSrc={img.team(code)} className="avatar sq" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                  <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)' }}>{code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reset Filters */}
        {isFiltered && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              onClick={resetFilters}
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                padding: '4px 10px',
                background: 'transparent',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                cursor: 'pointer',
                borderRadius: 4
              }}
            >
              × Reset filters
            </button>
          </div>
        )}
      </div>

      {error ? (
        <ErrorBox error={error} />
      ) : loading ? (
        <div className="skeleton-table">
          {Array.from({ length: 15 }).map((_, i) => (
            <div className="skeleton sk-row" key={i} />
          ))}
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="empty">No players matching the active filters.</div>
      ) : (
        <StatTable
          columns={configuredColumns}
          groups={STAT_GROUPS}
          rows={filteredRows}
          rowKey="player_key"
          rowHref={{ base: '/players/', key: 'player_key', query: { context } }}
          defaultLimit={20}
        />
      )}

      {rows && rows.length > 0 ? (
        <StatLegend keys={['Win%', 'KDA', 'KP%', 'GPM', 'DPM', 'MVPs', 'Editions']} />
      ) : null}
    </div>
  );
}
