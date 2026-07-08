'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import TeamLogo from './TeamLogo';
import { img } from '../lib/images';

function n(v) { return (v !== null && v !== undefined && v !== '' && !isNaN(v)) ? v : '--'; }
function big(v) { return (v !== null && v !== undefined && v !== '') ? Math.round(v).toLocaleString() : '--'; }
function pct(w, g) { return g > 0 ? Math.round(w / g * 100) : 0; }

export function VsTeamsTable({ vsTeams, vsLoading }) {
  const [colGroups, setColGroups] = useState({
    combatDeep: false,
    economy: false,
    turret: false,
    heal: false,
    objectives: false,
    milestones: false,
  });

  const toggleGroup = (k) => setColGroups(g => ({ ...g, [k]: !g[k] }));

  const activeColCount = useMemo(() => {
    let count = 12; // Core columns: Opponent (1) + GP (1) + W (1) + Win% (1) + KDA (1) + KP% (1) + K (1) + D (1) + A (1) + GPM (1) + DPM (1) + Avg Damage (1)
    if (colGroups.combatDeep) count += 4;
    if (colGroups.economy) count += 5;
    if (colGroups.turret) count += 3;
    if (colGroups.heal) count += 2;
    if (colGroups.objectives) count += 3;
    if (colGroups.milestones) count += 7;
    return count;
  }, [colGroups]);

  const groupConfigs = [
    { key: 'combatDeep', label: 'Combat Deep' },
    { key: 'economy', label: 'Economy' },
    { key: 'turret', label: 'Turret' },
    { key: 'heal', label: 'Heal' },
    { key: 'objectives', label: 'Objectives' },
    { key: 'milestones', label: 'Milestones' },
  ];

  return (
    <div style={{ marginBottom: 32 }}>
      {/* Group Toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginRight: 4 }}>COLUMNS:</span>
        {groupConfigs.map(g => (
          <button
            key={g.key}
            onClick={() => toggleGroup(g.key)}
            className={`filter-btn ${colGroups[g.key] ? 'active' : ''}`}
            aria-pressed={colGroups[g.key]}
            style={{ fontSize: 10, padding: '4px 8px' }}
          >
            {g.label}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)' }}>
          ({activeColCount} columns)
        </span>
      </div>

      {vsLoading ? (
        <div className="loading" style={{ margin: '20px 0' }} />
      ) : (
        <div className="tbl-wrap" style={{ border: '1px solid var(--border)' }}>
          <table className="tbl">
            <caption className="sr-only">Stats vs each opponent team</caption>
            <thead>
              <tr>
                <th className="sticky-col-player" style={{ top: 0, whiteSpace: 'nowrap' }}>Opponent</th>
                
                {/* CORE (RECORD) */}
                <th className="center" style={{ borderLeft: '1px solid rgba(255,255,255,.08)' }}>GP</th>
                <th className="center">W</th>
                <th className="center">Win%</th>
                <th className="center">KDA</th>
                <th className="center">KP%</th>
                <th className="center">K</th>
                <th className="center">D</th>
                <th className="center">A</th>
                <th className="center">GPM</th>
                <th className="center">DPM</th>
                <th className="center">Avg Damage</th>

                {/* COMBAT DEEP */}
                {colGroups.combatDeep && (
                  <>
                    <th className="center" style={{ borderLeft: '1px solid rgba(255,255,255,.08)', minWidth: 60 }}>CC(s)</th>
                    <th className="center">Avg DT</th>
                    <th className="center">DT%</th>
                    <th className="center">DTPM</th>
                  </>
                )}

                {/* ECONOMY */}
                {colGroups.economy && (
                  <>
                    <th className="center" style={{ borderLeft: '1px solid rgba(255,255,255,.08)' }}>Avg Gold</th>
                    <th className="center">Gold%</th>
                    <th className="center">Avg EXP</th>
                    <th className="center">Avg Lvl</th>
                  </>
                )}

                {/* TURRET */}
                {colGroups.turret && (
                  <>
                    <th className="center" style={{ borderLeft: '1px solid rgba(255,255,255,.08)' }}>Avg Trt</th>
                    <th className="center">Trt%</th>
                    <th className="center">TDPM</th>
                  </>
                )}

                {/* HEAL */}
                {colGroups.heal && (
                  <>
                    <th className="center" style={{ borderLeft: '1px solid rgba(255,255,255,.08)' }}>Self Heal</th>
                    <th className="center">Ally Heal</th>
                  </>
                )}

                {/* OBJECTIVES */}
                {colGroups.objectives && (
                  <>
                    <th className="center" style={{ borderLeft: '1px solid rgba(255,255,255,.08)' }}>Lord%</th>
                    <th className="center">Turtle%</th>
                    <th className="center">Turret%</th>
                  </>
                )}

                {/* MILESTONES */}
                {colGroups.milestones && (
                  <>
                    <th className="center" style={{ borderLeft: '1px solid rgba(255,255,255,.08)' }}>FB</th>
                    <th className="center">Solo</th>
                    <th className="center">2K</th>
                    <th className="center">3K</th>
                    <th className="center">Maniac</th>
                    <th className="center">Savage</th>
                    <th className="center">Legend</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {vsTeams.map(t => {
                const wp = t.games > 0 ? Math.round(t.wins / t.games * 100) : 0;
                const p1 = v => v != null ? v + '%' : '--';
                return (
                  <tr key={t.opp_team}>
                    <td className="sticky-col-player" style={{ whiteSpace: 'nowrap' }}>
                      <Link href={`/teams/${t.opp_team}`} style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text)', textDecoration: 'none' }}>
                        <TeamLogo src={t.opp_team_logo_dark} fallbackSrc={img.team(t.opp_team)} alt={t.opp_team} style={{ width: 28, height: 28, objectFit: 'contain' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12 }}>{t.opp_team}</span>
                      </Link>
                    </td>

                    {/* CORE */}
                    <td className="num center" style={{ borderLeft: '1px solid rgba(255,255,255,.06)' }}>{t.games}</td>
                    <td className="num center" style={{ color: 'var(--win)' }}>{t.wins}</td>
                    <td className="num center" style={{ fontWeight: 700, color: wp >= 50 ? 'var(--win)' : 'var(--loss)' }}>{wp}%</td>
                    <td className="num center" style={{ color: 'var(--accent)' }}>{n(t.avg_kda)}</td>
                    <td className="num center">{p1(t.avg_kp)}</td>
                    <td className="num center">{n(t.avg_kills)}</td>
                    <td className="num center">{n(t.avg_deaths)}</td>
                    <td className="num center">{n(t.avg_assists)}</td>
                    <td className="num center">{n(t.avg_gpm)}</td>
                    <td className="num center">{n(t.avg_dpm)}</td>
                    <td className="num center">{big(t.avg_damage)}</td>

                    {/* COMBAT DEEP */}
                    {colGroups.combatDeep && (
                      <>
                        <td className="num center" style={{ borderLeft: '1px solid rgba(255,255,255,.06)' }}>{n(t.avg_cc_sec)}</td>
                        <td className="num center">{big(t.avg_damage_taken)}</td>
                        <td className="num center">{p1(t.avg_dmg_taken_pct)}</td>
                        <td className="num center">{n(t.avg_dtpm)}</td>
                      </>
                    )}

                    {/* ECONOMY */}
                    {colGroups.economy && (
                      <>
                        <td className="num center" style={{ borderLeft: '1px solid rgba(255,255,255,.06)' }}>{big(t.avg_gold)}</td>
                        <td className="num center">{p1(t.avg_gold_share)}</td>
                        <td className="num center">{big(t.avg_exp)}</td>
                        <td className="num center">{n(t.avg_level)}</td>
                      </>
                    )}

                    {/* TURRET */}
                    {colGroups.turret && (
                      <>
                        <td className="num center" style={{ borderLeft: '1px solid rgba(255,255,255,.06)' }}>{big(t.avg_turret_damage)}</td>
                        <td className="num center">{p1(t.avg_turret_dmg_pct)}</td>
                        <td className="num center">{n(t.avg_turret_dpm)}</td>
                      </>
                    )}

                    {/* HEAL */}
                    {colGroups.heal && (
                      <>
                        <td className="num center" style={{ borderLeft: '1px solid rgba(255,255,255,.06)' }}>{big(t.avg_heal)}</td>
                        <td className="num center">{big(t.avg_heal_allies)}</td>
                      </>
                    )}

                    {/* OBJECTIVES */}
                    {colGroups.objectives && (
                      <>
                        <td className="num center" style={{ borderLeft: '1px solid rgba(255,255,255,.06)' }}>{p1(t.lord_pct)}</td>
                        <td className="num center">{p1(t.turtle_pct)}</td>
                        <td className="num center">{p1(t.turret_pct)}</td>
                      </>
                    )}

                    {/* MILESTONES */}
                    {colGroups.milestones && (
                      <>
                        <td className="num center" style={{ borderLeft: '1px solid rgba(255,255,255,.06)' }}>{t.total_first_bloods}</td>
                        <td className="num center">{t.total_solo_kills}</td>
                        <td className="num center">{t.total_double_kills}</td>
                        <td className="num center">{t.total_triple_kills}</td>
                        <td className="num center">{t.total_maniacs}</td>
                        <td className="num center">{t.total_savages}</td>
                        <td className="num center">{t.total_legendaries}</td>
                      </>
                    )}
                  </tr>
                );
              })}
              {vsTeams.length === 0 && (
                <tr>
                  <td colSpan={activeColCount} className="empty" style={{ textAlign: 'center', padding: '24px 0', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>
                    No games for this filter
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
