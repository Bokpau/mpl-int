'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/history', label: 'Overview' },
  { href: '/history/players', label: 'Players' },
  { href: '/history/teams', label: 'Teams' },
  { href: '/history/heroes', label: 'Heroes' },
  { href: '/history/nations', label: 'Nations' },
];

export default function HistorySubNav() {
  const path = usePathname();
  const isActive = (href) => (href === '/history' ? path === '/history' : path.startsWith(href));

  return (
    <div className="subnav">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} className={isActive(t.href) ? 'active' : ''}>
          {t.label}
        </Link>
      ))}
    </div>
  );
}
