'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Search from './Search';

/* ── Grouped navigation, mirroring the PH site's shell. Only pages backed by
   real international (box-score) data are included — no dead-end tabs. ── */
const NAV = [
  { label: 'Dashboard', href: '/' },
  { label: 'Matches', href: '/matches' },
  {
    label: 'Stats',
    children: [
      { label: 'Player Stats', href: '/players' },
      { label: 'Hero Stats', href: '/heroes' },
      { label: 'Team Stats', href: '/teams' },
      { label: 'Draft Stats', href: '/draft' },
      { label: 'Nations', href: '/nations' },
      { label: 'Regions', href: '/regions' },
    ],
  },
  {
    label: 'History',
    children: [
      { label: 'History Home', href: '/history' },
      { label: 'Dashboard', href: '/history/dashboard' },
      { label: 'Matches', href: '/history/matches' },
      { label: 'Players', href: '/history/players' },
      { label: 'Teams', href: '/history/teams' },
      { label: 'Heroes', href: '/history/heroes' },
      { label: 'Nations', href: '/history/nations' },
      { label: 'Regions', href: '/history/regions' },
      { label: 'Records', href: '/history/records' },
    ],
  },
];

const I = { width: 18, height: 18 };
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={I}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
const SwordsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={I}>
    <polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5" /><line x1="13" y1="19" x2="19" y2="13" />
    <line x1="16" y1="16" x2="20" y2="20" /><polyline points="9.5 14.5 21 3 21 3" />
  </svg>
);
const StatsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={I}>
    <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
  </svg>
);
const HistoryIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={I}>
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);
const ChevronIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ width: 13, height: 13 }}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const ICONS = { Dashboard: HomeIcon, Matches: SwordsIcon, Stats: StatsIcon, History: HistoryIcon };

export default function Nav({ siteName }) {
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState(null); // label of the open dropdown
  const navRef = useRef(null);

  // Close any open dropdown on navigation, outside-click, or Escape.
  useEffect(() => { setOpenMenu(null); }, [pathname]);
  useEffect(() => {
    const onDoc = (e) => { if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null); };
    const onKey = (e) => { if (e.key === 'Escape') setOpenMenu(null); };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);

  const isActive = (href) =>
    href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(href + '/');
  const groupActive = (item) =>
    item.href ? isActive(item.href) : item.children.some((c) => isActive(c.href));

  return (
    <nav className="nav" ref={navRef}>
        <Link href="/" className="brand">
          {siteName}<span className="dot">.</span>
        </Link>

        <div className="navgroups">
          {NAV.map((item) => {
            const Icon = ICONS[item.label];
            const active = groupActive(item);
            if (item.href) {
              return (
                <Link key={item.label} href={item.href} className={`navgroup-link${active ? ' active' : ''}`}>
                  {Icon ? <Icon /> : null}<span>{item.label}</span>
                </Link>
              );
            }
            const open = openMenu === item.label;
            return (
              <div key={item.label} className="navgroup">
                <button
                  type="button"
                  className={`navgroup-btn${active ? ' active' : ''}${open ? ' open' : ''}`}
                  aria-expanded={open}
                  aria-haspopup="true"
                  onClick={() => setOpenMenu(open ? null : item.label)}
                >
                  {Icon ? <Icon /> : null}<span>{item.label}</span><ChevronIcon />
                </button>
                {open ? (
                  <div className="dropdown" role="menu">
                    {item.children.map((c) => (
                      <Link key={c.href} href={c.href} role="menuitem" className={isActive(c.href) ? 'active' : ''}>
                        {c.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>

        <Search />
    </nav>
  );
}
