'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Points Table', subtitle: 'League Points Table' },
  { href: '/schedule', label: 'Schedule & Results', subtitle: 'Match Schedule & Results' },
  { href: '/leaderboards', label: 'Leaderboards', subtitle: 'Kills & Deaths Leaderboards' },
  { href: '/finals', label: 'Finals', subtitle: 'Finals Stage' },
  { href: '/admin', label: 'Admin', subtitle: 'Admin Panel' },
];

export default function Nav() {
  const pathname = usePathname();
  const current = LINKS.slice().reverse().find((l) => (l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)));
  const subtitle = current?.subtitle ?? '';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto max-w-3xl px-4 pt-3 pb-2">
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="text-base font-semibold tracking-tight">
            Mini Militia{' '}
            <span className="bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">Season 2</span>
          </h1>
          <span className="text-xs text-muted whitespace-nowrap">{subtitle}</span>
        </div>
        <nav className="mt-3 -mx-4 flex gap-1.5 overflow-x-auto scroll-thin px-4 pb-1">
          {LINKS.map((link) => {
            const active = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors ${
                  active
                    ? 'border-accent bg-accent text-[#16181f]'
                    : 'border-border bg-surface-2 text-muted hover:text-foreground'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
