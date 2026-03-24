'use client';

import Link from 'next/link';
import { useAppStore } from '@/store';

export function Header() {
  const { darkMode, toggleDarkMode } = useAppStore();

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--card)]">
      <Link href="/" className="flex items-center gap-2">
        <span className="text-lg font-bold text-compass-gold tracking-tight">
          WhenToBoat
        </span>
        <span className="text-xs text-[var(--muted)] hidden sm:inline">
          SF Bay
        </span>
      </Link>

      <nav className="flex items-center gap-1">
        <NavLink href="/" label="Plan" />
        <NavLink href="/explore" label="Map" />
        <NavLink href="/schedule" label="Schedule" />
        <button
          onClick={toggleDarkMode}
          className="ml-2 p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)] transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </nav>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="px-3 py-1.5 rounded-lg text-sm font-medium text-[var(--secondary)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)] transition-colors"
    >
      {label}
    </Link>
  );
}
