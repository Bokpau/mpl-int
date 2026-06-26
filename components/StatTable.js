'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { num, int, dec, pct } from '../lib/format';
import { img } from '../lib/images';

// Reusable, sortable stats table.
//
// Columns are a PLAIN-OBJECT spec (no functions) so a server component can pass
// `columns`/`rows` straight across the boundary. Sorting is client-only state —
// it never round-trips to the server and is never forwarded to the backend.
//
// Column shape:
//   { key, label, type, format, decimals, cls, wr, nullDash, title, sortable,
//     align, nameKey, fallbackKey, codeKey, idKey, flagKey, subKey, subFallbackKey,
//     hrefBase, hrefKey }
// type: 'rank' | 'player' | 'team' | 'hero' | 'country' | 'text' | (default) numeric
// format (numeric only): 'int' (rounded) | 'dec' | 'pct'

const IDENTITY_TYPES = ['rank', 'player', 'team', 'hero', 'country', 'text'];
const isNumeric = (col) => !IDENTITY_TYPES.includes(col.type);

function sortValue(col, row) {
  switch (col.type) {
    case 'player':  return String(row[col.nameKey] ?? row[col.fallbackKey] ?? '').toLowerCase();
    case 'team':    return String(row[col.nameKey] ?? row[col.codeKey] ?? '').toLowerCase();
    case 'hero':    return String(row[col.nameKey] ?? '').toLowerCase();
    case 'country': return String(row[col.nameKey] ?? row[col.codeKey] ?? '').toLowerCase();
    case 'text':    return String(row[col.key] ?? '').toLowerCase();
    default: {
      const v = row[col.key];
      return v == null ? -Infinity : num(v);
    }
  }
}

function fmtNum(col, v) {
  if (v == null && col.nullDash) return '—';
  if (col.format === 'pct') return pct(v);
  if (col.format === 'dec') return dec(v, col.decimals ?? 2);
  return int(Math.round(num(v))); // 'int' (rounded)
}

function Cell({ col, row, rankIndex }) {
  switch (col.type) {
    case 'rank':
      return <td className="l rank">{rankIndex}</td>;

    case 'player': {
      const name = row[col.nameKey] || row[col.fallbackKey];
      const sub = col.subKey ? (row[col.subKey] || row[col.subFallbackKey] || '') : '';
      const href = `${col.hrefBase}${encodeURIComponent(row[col.hrefKey])}`;
      return (
        <td className="l">
          <Link href={href} onClick={(e) => e.stopPropagation()}>
            <span className="idcell"><span className="name">{name}</span></span>
            {sub ? <span className="sub">{sub}</span> : null}
          </Link>
        </td>
      );
    }

    case 'team': {
      const logo = img.team(row[col.codeKey]);
      const name = row[col.nameKey] || row[col.codeKey] || row[col.fallbackKey];
      const href = `${col.hrefBase}${encodeURIComponent(row[col.hrefKey])}`;
      return (
        <td className="l">
          <Link href={href} onClick={(e) => e.stopPropagation()}>
            <span className="idcell">
              {logo ? <img className="avatar sq" src={logo} alt="" /> : null}
              <span className="name">{name}</span>
            </span>
          </Link>
        </td>
      );
    }

    case 'hero': {
      const portrait = img.hero(row[col.idKey]);
      return (
        <td className="l">
          <span className="idcell">
            {portrait ? <img className="avatar" src={portrait} alt="" /> : null}
            <span className="name">{row[col.nameKey] || '—'}</span>
          </span>
        </td>
      );
    }

    case 'country':
      return (
        <td className="l">
          <span className="idcell">
            <span className="flag">{row[col.flagKey] || '🏳️'}</span>
            <span className="name">{row[col.nameKey] || row[col.codeKey]}</span>
          </span>
        </td>
      );

    case 'text':
      return <td className={`l ${col.cls || 'sub'}`}>{row[col.key] || '—'}</td>;

    default: {
      const raw = row[col.key];
      let cls = col.cls || '';
      let glyph = null;
      if (col.wr) {
        const good = num(raw) >= 50;
        cls = good ? 'pos' : 'neg';
        // Non-color signal so win/loss is legible without color (WCAG 1.4.1).
        glyph = <span className="wr-glyph" aria-hidden="true">{good ? '▲' : '▼'}</span>;
      }
      return <td className={cls}>{glyph}{fmtNum(col, raw)}</td>;
    }
  }
}

export default function StatTable({ columns, rows, rowHref, rowKey, initialSort, defaultLimit }) {
  const router = useRouter();
  const [sort, setSort] = useState(initialSort || null);
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(() => {
    if (!sort) return rows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return rows;
    const arr = [...rows];
    arr.sort((a, b) => {
      const va = sortValue(col, a);
      const vb = sortValue(col, b);
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb));
      return sort.dir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [rows, sort, columns]);

  // Top-N by default; the full (sorted) set is revealed by "View full list".
  const collapsed = defaultLimit && !expanded && sorted.length > defaultLimit;
  const visible = collapsed ? sorted.slice(0, defaultLimit) : sorted;

  function onSort(col) {
    setSort((prev) => {
      if (prev && prev.key === col.key) return { key: col.key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      return { key: col.key, dir: isNumeric(col) ? 'desc' : 'asc' };
    });
  }

  return (
    <>
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => {
              const left = !isNumeric(col);
              const sortable = col.type !== 'rank' && col.sortable !== false;
              const active = sort && sort.key === col.key;
              return (
                <th
                  key={col.key}
                  className={`${left ? 'l ' : ''}${sortable ? 'sortable ' : ''}${active ? 'sorted' : ''}`.trim()}
                  aria-sort={sortable ? (active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
                >
                  {sortable ? (
                    <button type="button" className="th-sort" onClick={() => onSort(col)} title={col.title || undefined}>
                      {col.label}
                      <span className="sort-ind" aria-hidden="true">{active ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</span>
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {visible.map((row, i) => {
            const href = rowHref ? `${rowHref.base}${encodeURIComponent(row[rowHref.key])}` : null;
            return (
              <tr
                key={(rowKey && row[rowKey]) ?? i}
                className={href ? 'clickable' : ''}
                onClick={href ? () => router.push(href) : undefined}
              >
                {columns.map((col) => (
                  <Cell key={col.key} col={col} row={row} rankIndex={i + 1} />
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
    {defaultLimit && sorted.length > defaultLimit ? (
      <div className="table-more">
        <button type="button" className="btn" onClick={() => setExpanded((e) => !e)} aria-expanded={!collapsed}>
          {collapsed ? `View full list (${sorted.length})` : `Show top ${defaultLimit}`}
        </button>
      </div>
    ) : null}
    </>
  );
}
