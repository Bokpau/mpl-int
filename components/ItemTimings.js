'use client';
import { useEffect, useState } from 'react';
import { HeroImg, ItemImg, RoleImg } from './Images';

const BLUE = '#4da6ff';
const RED  = '#ff4757';
const API  = '';

const ROLE_ORDER = { 'EXP LANE': 0, 'JUNGLE': 1, 'MID LANE': 2, 'ROAM': 3, 'GOLD LANE': 4 };

function fmtTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

function PlayerTimingRow({ player, sideClr }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '8px 0', borderBottom: '1px solid var(--border)',
    }}>
      {/* Identity */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, width: 160 }}>
        <RoleImg role={player.role} size={14} />
        <div style={{ borderRadius: '50%', boxShadow: `0 0 0 2px ${sideClr}`, overflow: 'hidden', width: 30, height: 30, flexShrink: 0 }}>
          <HeroImg heroid={player.heroid} size={30} style={{ display: 'block' }} />
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 11, lineHeight: 1.2 }}>{player.player_name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--muted)' }}>{player.hero_name}</div>
        </div>
      </div>

      {/* Item timeline */}
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'flex-start', flex: 1 }}>
        {player.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <div style={{
              border: item.full_item
                ? `1.5px solid ${sideClr}`
                : '1px solid var(--border)',
              borderRadius: 3,
              background: item.full_item ? `${sideClr}18` : 'transparent',
              padding: 1,
            }}>
              <ItemImg equipId={item.item_id} size={item.full_item ? 28 : 22} />
            </div>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 7,
              color: item.full_item ? 'var(--text)' : 'var(--muted)',
              lineHeight: 1,
            }}>
              {fmtTime(item.game_time)}
            </span>
          </div>
        ))}
        {player.items.length === 0 && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' }}>—</span>
        )}
      </div>
    </div>
  );
}

function TeamSection({ players, campid, teamCode }) {
  const sideClr = campid === 1 ? BLUE : RED;
  const label   = campid === 1 ? '🔵 BLUE' : '🔴 RED';
  const sorted  = [...players].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));

  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
        color: sideClr, letterSpacing: '.1em', marginBottom: 6,
      }}>
        {label} — {teamCode}
      </div>
      {sorted.map(p => (
        <PlayerTimingRow key={p.roleid} player={p} sideClr={sideClr} />
      ))}
    </div>
  );
}

export function ItemTimings({ battleId, camp1Code, camp2Code }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/intl/matches/${battleId}/item-timings`)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData([]));
  }, [battleId]);

  if (data === null) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
        Loading item data…
      </div>
    );
  }
  if (!data.length) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' }}>
        No item timing data available for this match.
      </div>
    );
  }

  const camp1Players = data.filter(p => p.campid === 1);
  const camp2Players = data.filter(p => p.campid === 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', flexWrap: 'wrap' }}>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, border: '1.5px solid var(--accent)', borderRadius: 2, verticalAlign: 'middle', marginRight: 4 }} />
          Full item
        </span>
        <span>
          <span style={{ display: 'inline-block', width: 10, height: 10, border: '1px solid var(--border)', borderRadius: 2, verticalAlign: 'middle', marginRight: 4 }} />
          Component
        </span>
        <span style={{ marginLeft: 'auto' }}>ordered by purchase time →</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
        <TeamSection players={camp1Players} campid={1} teamCode={camp1Code} />
        <TeamSection players={camp2Players} campid={2} teamCode={camp2Code} />
      </div>
    </div>
  );
}
