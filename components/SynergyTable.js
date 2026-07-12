'use client';

import React from 'react';
import Link from 'next/link';
import { HeroImg } from './Images';

export default function SynergyTable({ rows, emptyMsg, caption }) {
  if (!rows || !rows.length) {
    return (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted2)', padding: '12px 0' }}>
        {emptyMsg || '// No data'}
      </div>
    );
  }

  return (
    <table className="tbl no-sort" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
      {caption && <caption className="sr-only">{caption}</caption>}
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border)' }}>
          {['#', 'Hero', 'GP', 'W', 'L', 'WR%'].map(col => (
            <th
              key={col}
              style={{
                textAlign: col === '#' || col === 'Hero' ? 'left' : 'center',
                padding: '6px 8px',
                fontFamily: 'var(--font-mono)',
                fontSize: 9,
                color: 'var(--muted2)',
                borderBottom: '1px solid var(--border)',
                background: 'transparent',
                position: 'static'
              }}
            >
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((hero, i) => {
          const heroid = hero.heroid ?? hero.hero_id;
          const wr = hero.win_rate ?? (hero.games > 0 ? Math.round((hero.wins / hero.games) * 100) : 0);
          const wpClr = wr >= 50 ? 'var(--win)' : 'var(--loss)';
          const losses = hero.losses ?? (hero.games - hero.wins);

          return (
            <tr key={heroid} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
              <td style={{ padding: '6px 8px', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted2)', textAlign: 'left' }}>
                {i + 1}
              </td>
              <td style={{ padding: '6px 8px', textAlign: 'left' }}>
                <Link
                  href={`/heroes/${heroid}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none', color: 'var(--text)' }}
                >
                  <HeroImg heroid={heroid} size={24} />
                  <span style={{ fontWeight: 600 }}>{hero.hero_name}</span>
                </Link>
              </td>
              <td style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                {hero.games}
              </td>
              <td style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'var(--font-mono)', color: 'var(--win)' }}>
                {hero.wins}
              </td>
              <td style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'var(--font-mono)', color: 'var(--loss)' }}>
                {losses}
              </td>
              <td style={{ textAlign: 'center', padding: '6px 8px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: wpClr }}>
                {wr}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
