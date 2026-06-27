'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import FilterBar from './FilterBar';
import Search from './Search';

const LINKS = [
  { href: '/', label: 'Players' },
  { href: '/teams', label: 'Teams' },
  { href: '/heroes', label: 'Heroes' },
  { href: '/nations', label: 'Nations' },
  { href: '/regions', label: 'Regions' },
  { href: '/results', label: 'Results' },
  { href: '/history', label: 'History' },
];

export default function Nav({ siteName, editions, featured }) {
  const pathname = usePathname();

  const isActive = (href) =>
    href === '/' ? pathname === '/' || pathname.startsWith('/players')
                 : pathname.startsWith(href);

  // The History section is always all-editions, so the per-edition filter bar
  // doesn't apply there — hide it.
  const showFilterBar = !pathname.startsWith('/history');

  return (
    <>
      <nav className="nav">
        <Link href="/" className="brand">
          {siteName}<span className="dot">.</span>
        </Link>
        <div className="links">
          {LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={isActive(l.href) ? 'active' : ''}>
              {l.label}
            </Link>
          ))}
        </div>
        <Search />
      </nav>
      {showFilterBar ? (
        <div className="container">
          <Suspense fallback={<div className="filterbar" />}>
            <FilterBar editions={editions} featured={featured} />
          </Suspense>
        </div>
      ) : null}
    </>
  );
}
