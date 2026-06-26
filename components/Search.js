'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { img } from '../lib/images';

// Global typeahead. On first focus it pulls the player/team/hero lists through the
// /api/* proxy (unfiltered, all-time) and builds a small in-memory index, so the
// box always finds anyone regardless of the current page filters. Players show
// name only (no player-image asset yet); teams and heroes show their icon.
const MAX_PER_GROUP = 5;

async function fetchJson(path) {
  try {
    const res = await fetch(path);
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

function buildIndex([players, teams, heroes]) {
  const out = [];
  for (const p of players || []) {
    const name = p.player || p.player_key;
    if (name) out.push({ type: 'player', name, href: `/players/${encodeURIComponent(p.player_key)}` });
  }
  for (const t of teams || []) {
    const name = t.team_name || t.team_code || t.team_key;
    if (name) out.push({ type: 'team', name, code: t.team_code, href: `/teams/${encodeURIComponent(t.team_key)}` });
  }
  const seenHero = new Set();
  for (const h of heroes || []) {
    if (!h.hero_name || seenHero.has(h.hero_name)) continue;
    seenHero.add(h.hero_name);
    out.push({ type: 'hero', name: h.hero_name, heroId: h.hero_id, href: '/heroes' });
  }
  return out;
}

function rank(index, q) {
  const needle = q.trim().toLowerCase();
  if (!needle) return [];
  const hits = index.filter((r) => r.name.toLowerCase().includes(needle));
  // Prefix matches first, then alphabetical.
  hits.sort((a, b) => {
    const ap = a.name.toLowerCase().startsWith(needle) ? 0 : 1;
    const bp = b.name.toLowerCase().startsWith(needle) ? 0 : 1;
    return ap - bp || a.name.localeCompare(b.name);
  });
  const groups = { player: [], team: [], hero: [] };
  for (const h of hits) {
    if (groups[h.type].length < MAX_PER_GROUP) groups[h.type].push(h);
  }
  return [...groups.player, ...groups.team, ...groups.hero];
}

export default function Search() {
  const router = useRouter();
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [index, setIndex] = useState(null);
  const boxRef = useRef(null);

  // Lazy-load the index once, on first focus.
  function loadIndex() {
    if (index !== null) return;
    setIndex([]); // mark as loading so we don't double-fetch
    Promise.all([
      fetchJson('/api/intl/leaderboard'),
      fetchJson('/api/intl/teams'),
      fetchJson('/api/intl/heroes'),
    ]).then((lists) => setIndex(buildIndex(lists)));
  }

  const results = index && index.length ? rank(index, q) : [];

  useEffect(() => { setActive(0); }, [q]);

  // Close on outside click.
  useEffect(() => {
    function onDoc(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  function go(r) {
    if (!r) return;
    setOpen(false);
    setQ('');
    router.push(r.href);
  }

  function onKeyDown(e) {
    if (!open) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); go(results[active]); }
    else if (e.key === 'Escape') { setOpen(false); }
  }

  return (
    <div className="search" ref={boxRef}>
      <input
        type="search"
        className="search-input"
        placeholder="Search players, teams, heroes…"
        value={q}
        aria-label="Search"
        autoComplete="off"
        onFocus={() => { loadIndex(); setOpen(true); }}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onKeyDown={onKeyDown}
      />
      {open && q.trim() ? (
        <div className="search-results" role="listbox">
          {results.length === 0 ? (
            <div className="search-empty">{index && index.length ? 'No matches' : 'Loading…'}</div>
          ) : (
            results.map((r, i) => (
              <button
                key={`${r.type}-${r.href}-${r.name}`}
                role="option"
                aria-selected={i === active}
                className={`search-row ${i === active ? 'active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onClick={() => go(r)}
              >
                {r.type === 'team' && img.team(r.code) ? <img className="avatar sq" src={img.team(r.code)} alt="" /> : null}
                {r.type === 'hero' && img.hero(r.heroId) ? <img className="avatar" src={img.hero(r.heroId)} alt="" /> : null}
                <span className="search-name">{r.name}</span>
                <span className="search-type">{r.type}</span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
