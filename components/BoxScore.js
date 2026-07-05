import React from 'react';

const BLUE = '#4da6ff';
const RED = '#ff4757';

function fmtCC(ms) {
  if (!ms) return '0.0s';
  const s = ms / 1000;
  return (Number.isInteger(s) ? s.toFixed(1) : s.toFixed(2)) + 's';
}

function ObjPill({ label, value, sideColor, isFirstBlood }) {
  if (!value && value !== 0) return null;
  const borderClr = isFirstBlood ? 'var(--loss)' : 'var(--border)';
  const textClr = isFirstBlood ? 'var(--loss)' : 'var(--text)';
  
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      background: 'var(--surface2)',
      border: `1px solid ${borderClr}`,
      padding: '4px 10px',
      borderRadius: 2
    }}>
      <span style={{
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: sideColor,
        display: 'inline-block'
      }} />
      <div>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14,
          fontWeight: 800,
          color: textClr,
          lineHeight: 1
        }}>
          {isFirstBlood ? 'FIRST' : value}
        </div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 8,
          color: 'var(--muted)',
          letterSpacing: '.06em',
          textTransform: 'uppercase'
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export function BoxScore({ camp1, camp2 }) {
  if (!camp1 || !camp2) return null;

  const metrics = [
    { key: 'total_kills', label: 'KILLS', format: v => v },
    { key: 'total_deaths', label: 'DEATHS', format: v => v, lowerBetter: true },
    { key: 'total_assists', label: 'ASSISTS', format: v => v },
    { key: 'team_kda', label: 'KDA', format: v => v },
    { key: 'total_gold', label: 'GOLD', format: v => v ? Math.round(v).toLocaleString() : '--' },
    { key: 'gold_per_min', label: 'GPM', format: v => v ? Math.round(v).toLocaleString() : '--' },
    { key: 'total_damage', label: 'DAMAGE', format: v => v ? Math.round(v).toLocaleString() : '--' },
    { key: 'damage_dealt_per_min', label: 'DPM', format: v => v ? Math.round(v).toLocaleString() : '--' },
    { key: 'total_control_time_ms', label: 'CC TIME', format: v => fmtCC(v) },
    { key: 'kill_lord', label: 'LORDS', format: v => v },
    { key: 'kill_tortoise', label: 'TURTLES', format: v => v },
    { key: 'kill_tower', label: 'TURRETS', format: v => v }
  ];

  return (
    <div className="card mb-6">
      <div style={{ maxWidth: 640, margin: '0 auto', width: '100%' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-strong)' }}>
              <th style={{ textAlign: 'left', padding: '8px 12px', color: BLUE, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                {camp1.team_code} (BLUE)
              </th>
              <th style={{ textAlign: 'center', padding: '8px 12px', color: 'var(--muted2)', fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '.1em' }}>
                METRIC
              </th>
              <th style={{ textAlign: 'right', padding: '8px 12px', color: RED, fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700 }}>
                (RED) {camp2.team_code}
              </th>
            </tr>
          </thead>
          <tbody>
            {metrics.map(m => {
              const val1 = camp1[m.key];
              const val2 = camp2[m.key];
              const parsed1 = parseFloat(val1) || 0;
              const parsed2 = parseFloat(val2) || 0;
              
              let isBetter1 = false;
              let isBetter2 = false;
              if (parsed1 !== parsed2) {
                const isGreater = parsed1 > parsed2;
                const t1Better = m.lowerBetter ? !isGreater : isGreater;
                isBetter1 = t1Better;
                isBetter2 = !t1Better;
              }
              
              return (
                <tr key={m.key} style={{ borderBottom: '1px solid var(--border)', height: 38 }}>
                  <td style={{
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: isBetter1 ? 700 : 400,
                    color: isBetter1 ? 'var(--text)' : 'var(--muted)',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {m.format(val1)}
                  </td>
                  <td style={{
                    textAlign: 'center',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 9,
                    color: 'var(--muted2)',
                    letterSpacing: '.08em'
                  }}>
                    {m.label}
                  </td>
                  <td style={{
                    textAlign: 'right',
                    padding: '8px 12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 13,
                    fontWeight: isBetter2 ? 700 : 400,
                    color: isBetter2 ? 'var(--text)' : 'var(--muted)',
                    fontVariantNumeric: 'tabular-nums'
                  }}>
                    {m.format(val2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Objectives Section */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border-strong)' }}>
          {/* Team 1 Objectives */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <ObjPill label="Lords" value={camp1.kill_lord} sideColor={BLUE} />
            <ObjPill label="Turtles" value={camp1.kill_tortoise} sideColor={BLUE} />
            <ObjPill label="Turrets" value={camp1.kill_tower} sideColor={BLUE} />
            <ObjPill label="Orange" value={camp1.red_buff_num} sideColor={BLUE} />
            <ObjPill label="Purple" value={camp1.blue_buff_num} sideColor={BLUE} />
            {camp1.first_blood > 0 && <ObjPill label="FB" value={1} sideColor={BLUE} isFirstBlood />}
          </div>
          {/* Team 2 Objectives */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <ObjPill label="Lords" value={camp2.kill_lord} sideColor={RED} />
            <ObjPill label="Turtles" value={camp2.kill_tortoise} sideColor={RED} />
            <ObjPill label="Turrets" value={camp2.kill_tower} sideColor={RED} />
            <ObjPill label="Orange" value={camp2.red_buff_num} sideColor={RED} />
            <ObjPill label="Purple" value={camp2.blue_buff_num} sideColor={RED} />
            {camp2.first_blood > 0 && <ObjPill label="FB" value={1} sideColor={RED} isFirstBlood />}
          </div>
        </div>
      </div>
    </div>
  );
}
