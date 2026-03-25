'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/store';

export function Header() {
  const { darkMode, toggleDarkMode } = useAppStore();
  const pathname = usePathname();

  return (
    <header className="relative flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--card)]">
      {/* Bottom border glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-compass-gold/40 to-transparent" />

      <Link href="/" className="flex items-center gap-2.5">
        <span className="text-xl font-extrabold text-compass-gold tracking-tight">
          WhenToBoat
        </span>
        <span className="text-xs text-[var(--muted)] hidden sm:inline font-medium">
          SF Bay
        </span>
      </Link>

      <nav className="flex items-center gap-0.5">
        <NavLink href="/" label="Home" active={pathname === '/'} />
        <NavLink href="/explore" label="Full Map" active={pathname === '/explore'} />
        <NavLink href="/schedule" label="Schedule" active={pathname === '/schedule'} />
        <button
          onClick={toggleDarkMode}
          className="ml-3 p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)] transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? '☀️' : '🌙'}
        </button>
      </nav>
    </header>
  );
}

function NavLink({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? 'bg-[var(--card-elevated)] text-compass-gold'
          : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)]'
      }`}
    >
      {label}
    </Link>
  );
}
