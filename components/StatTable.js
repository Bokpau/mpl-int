'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { intlQuery } from '../lib/filters';
import { num, int, dec, pct } from '../lib/format';
import { img } from '../lib/images';
import TeamLogo from './TeamLogo';
import { RoleImg } from './Images';

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

const IDENTITY_TYPES = ['rank', 'player', 'team', 'hero', 'country', 'text', 'role'];
const isNumeric = (col) => !IDENTITY_TYPES.includes(col.type);

function sortValue(col, row) {
  switch (col.type) {
    case 'player':  return String(row[col.nameKey] ?? row[col.fallbackKey] ?? '').toLowerCase();
    case 'team':    return String(row[col.nameKey] ?? row[col.codeKey] ?? '').toLowerCase();
    case 'hero':    return String(row[col.nameKey] ?? '').toLowerCase();
    case 'country': return String(row[col.nameKey] ?? row[col.codeKey] ?? '').toLowerCase();
    case 'text':    return String(row[col.key] ?? '').toLowerCase();
    case 'last_used': {
      const v = row[col.key];
      return v ? new Date(v).getTime() : -Infinity;
    }
    default: {
      const v = row[col.key];
      return v == null ? -Infinity : num(v);
    }
  }
}

function fmtNum(col, v) {
  if (v == null && col.nullDash) return '—';

  let val = num(v);

  // 1. CC Time rule: CC time in the API is in milliseconds, always convert to seconds
  const isCCTime = col.key === 'cc_time' || col.key === 'avg_cc_time' || col.type === 'cc' || col.format === 'cc';
  if (isCCTime) {
    val = val / 1000;
  }

  // 2. Game Time rule: convert seconds to mm:ss format
  if (col.format === 'time' || col.type === 'time') {
    const s = Math.round(val);
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }

  // Helper to format with decimals rule:
  // - If >999, no decimal on it.
  // - If 2 decimal place rule is a whole number, 1 decimal place.
  // - Otherwise, 2 decimal places (or col.decimals).
  function formatValueWithDecimals(numberVal, decimals = 2) {
    if (Math.abs(numberVal) > 999) {
      return int(Math.round(numberVal));
    }
    const f = numberVal.toFixed(decimals);
    if (decimals === 2) {
      return f.endsWith('.00') ? numberVal.toFixed(1) : f;
    }
    return f;
  }

  if (isCCTime) {
    return `${formatValueWithDecimals(val, 2)}s`;
  }

  if (col.format === 'pct') {
    return `${formatValueWithDecimals(val, 2)}%`;
  }

  if (col.format === 'dec') {
    return formatValueWithDecimals(val, col.decimals ?? 2);
  }

  // Default: format as integer
  return int(Math.round(val));
}

function LastUsedCell({ col, row }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const searchParams = useSearchParams();

  const dateStr = row.last_used
    ? (typeof row.last_used === 'string'
        ? row.last_used.slice(0, 10)
        : String(row.last_used).slice(0, 10))
    : '—';

  async function handleToggle(e) {
    e.stopPropagation();
    if (open) {
      setOpen(false);
      return;
    }

    setOpen(true);
    if (details) return; // already loaded

    setLoading(true);
    try {
      const qs = intlQuery(Object.fromEntries(searchParams.entries()));
      const url = `/api/intl/heroes/${encodeURIComponent(row.hero_name)}/last-used${qs}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetails(data);
    } catch (err) {
      setDetails({ error: 'Could not load details' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <td className="l" style={{ position: 'relative', overflow: 'visible' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: 'var(--muted)' }}>{dateStr}</span>
        {row.last_used && (
          <button
            type="button"
            className={`match-info-btn${open ? ' active' : ''}`}
            onClick={handleToggle}
          >
            i
          </button>
        )}
        {open && (
          <div
            className="match-popover"
            style={{
              width: '320px',
              textAlign: 'left',
              zIndex: 100,
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              marginTop: '8px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="match-popover-header"
              style={{
                padding: '8px 12px',
                background: '#141424',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span
                className="match-popover-title"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  fontWeight: 700,
                }}
              >
                {(row.hero_name || '').toUpperCase()} LAST USED
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="match-popover-close"
              >
                &times;
              </button>
            </div>
            <div className="match-popover-body" style={{ padding: '12px' }}>
              {loading && <p style={{ color: 'var(--muted2)', margin: 0 }}>Loading details…</p>}
              {!loading && details && details.error && (
                <p style={{ color: 'var(--loss)', margin: 0 }}>{details.error}</p>
              )}
              {!loading && details && !details.error && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { label: 'Date', value: details.date || '—' },
                    { label: 'Season', value: details.season || '—' },
                    { label: 'Phase', value: details.phase || '—' },
                    { label: 'Phase Name', value: details.phase_name || '—' },
                    { label: 'Match', value: details.match || '—', color: details.win ? 'var(--win)' : 'var(--loss)' },
                    { label: 'Player', value: details.player || '—', color: 'var(--accent)' },
                    { label: 'Team', value: details.team || '—' },
                  ].map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px 0',
                        borderBottom: idx === 6 ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      <span
                        style={{
                          color: 'var(--muted2)',
                          fontSize: 10,
                          fontFamily: 'var(--font-mono)',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.label}
                      </span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: 11,
                          color:
                            item.color || 'var(--text)',
                        }}
                      >
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </td>
  );
}

function Cell({ col, row, rankIndex }) {
  switch (col.type) {
    case 'rank':
      return <td className="l rank">{rankIndex}</td>;

    case 'last_used':
      return <LastUsedCell col={col} row={row} />;

    case 'role': {
      const role = row[col.key];
      return (
        <td className="center" style={{ textAlign: 'center' }}>
          {role && role !== '—' ? (
            <span title={role} aria-label={role} style={{ display: 'inline-flex', verticalAlign: 'middle' }}>
              <RoleImg role={role} size={16} />
            </span>
          ) : '—'}
        </td>
      );
    }

    case 'player': {
      const name = row[col.nameKey] || row[col.fallbackKey];
      const sub = col.subKey ? (row[col.subKey] || row[col.subFallbackKey] || '') : '';
      const href = `${col.hrefBase}${encodeURIComponent(row[col.hrefKey])}`;
      // Per-era player photo (full-body cutout); anchor to top so the face shows.
      const photo = col.photoKey ? row[col.photoKey] : null;
      return (
        <td className="l">
          <Link href={href} onClick={(e) => e.stopPropagation()}>
            <span className="idcell">
              {photo ? <img className="avatar" src={photo} alt="" style={{ objectFit: 'cover', objectPosition: 'top' }} /> : null}
              <span className="name">{name}</span>
            </span>
            {sub ? <span className="sub">{sub}</span> : null}
          </Link>
        </td>
      );
    }

    case 'team': {
      const logo = col.logoKey ? row[col.logoKey] : null;
      const fallbackLogo = img.team(row[col.codeKey]);
      const name = row[col.nameKey] || row[col.codeKey] || row[col.fallbackKey];
      const href = `${col.hrefBase}${encodeURIComponent(row[col.hrefKey])}`;
      return (
        <td className="l">
          <Link href={href} onClick={(e) => e.stopPropagation()}>
            <span className="idcell">
              <TeamLogo src={logo} fallbackSrc={fallbackLogo} alt="" className="avatar sq" />
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
        if (raw == null) {
          cls = col.cls || '';
          glyph = null;
        } else {
          const good = num(raw) >= 50;
          cls = good ? 'pos' : 'neg';
          // Non-color signal so win/loss is legible without color (WCAG 1.4.1).
          glyph = <span className="wr-glyph" aria-hidden="true">{good ? '▲' : '▼'}</span>;
        }
      }
      return <td className={cls}>{glyph}{fmtNum(col, raw)}</td>;
    }
  }
}

export default function StatTable({ columns, rows, rowHref, rowKey, initialSort, defaultLimit, groups }) {
  const router = useRouter();
  const [sort, setSort] = useState(initialSort || null);
  const [expanded, setExpanded] = useState(false);

  // Column-group toggles. Groups present on this table = those referenced by a
  // column AND declared in `groups`. Identity/core columns carry no group and are
  // always shown. State seeds from each group's `default` flag.
  const activeGroupList = useMemo(
    () => (groups || []).filter((g) => columns.some((c) => c.group === g.key)),
    [groups, columns]
  );
  const [shown, setShown] = useState(
    () => new Set(activeGroupList.filter((g) => g.default).map((g) => g.key))
  );

  const visibleColumns = useMemo(
    () => columns.filter((c) => !c.group || shown.has(c.group)),
    [columns, shown]
  );

  function toggleGroup(key) {
    setShown((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

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
    {activeGroupList.length > 0 ? (
      <div className="col-toggles" role="group" aria-label="Show stat groups">
        {activeGroupList.map((g) => {
          const on = shown.has(g.key);
          return (
            <button
              key={g.key}
              type="button"
              className={`col-toggle${on ? ' on' : ''}`}
              aria-pressed={on}
              onClick={() => toggleGroup(g.key)}
            >
              {g.label}
            </button>
          );
        })}
      </div>
    ) : null}
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {visibleColumns.map((col) => {
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
                {visibleColumns.map((col) => (
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
