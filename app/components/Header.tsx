'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EmergencyButton } from './EmergencyPanel';

const PRIMARY_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/guides', label: 'Guides' },
  { href: '/planner', label: 'Plan' },
  { href: '/conditions', label: 'Now' },
  { href: '/vessels', label: 'My Boats' },
];

const SECONDARY_LINKS = [
  { href: '/support', label: 'Support', accent: true },
  { href: '/privacy', label: 'Privacy', accent: false },
];

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative border-b border-[var(--border)] bg-[var(--card)]">
      {/* Bottom border glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-compass-gold/40 to-transparent" />

      <div className="flex items-center justify-between px-5 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="text-xl font-extrabold text-compass-gold tracking-tight">
            WhenToBoat
          </span>
          <span className="text-xs text-[var(--muted)] hidden sm:inline font-medium">
            SF Bay
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {PRIMARY_LINKS.map(link => (
            <NavLink key={link.href} href={link.href} label={link.label} active={pathname === link.href} />
          ))}
          <span className="mx-1 h-4 w-px bg-[var(--border)]" />
          {SECONDARY_LINKS.map(link => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              active={pathname === link.href}
              accent={link.accent}
            />
          ))}
        </nav>

        {/* Emergency SOS button — always visible */}
        <EmergencyButton />

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)]"
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {mobileOpen ? (
              <><line x1="4" y1="4" x2="16" y2="16" /><line x1="16" y1="4" x2="4" y2="16" /></>
            ) : (
              <><line x1="3" y1="5" x2="17" y2="5" /><line x1="3" y1="10" x2="17" y2="10" /><line x1="3" y1="15" x2="17" y2="15" /></>
            )}
          </svg>
        </button>
      </div>

      {/* Mobile dropdown */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-[var(--border)] px-4 py-3 space-y-1 bg-[var(--card)]">
          {[...PRIMARY_LINKS, ...SECONDARY_LINKS].map(link => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === link.href
                  ? 'bg-[var(--card-elevated)] text-compass-gold'
                  : 'accent' in link && link.accent
                    ? 'text-compass-gold/70 hover:text-compass-gold'
                    : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)]'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

function NavLink({ href, label, active, accent }: { href: string; label: string; active: boolean; accent?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
        active
          ? accent ? 'bg-compass-gold/20 text-compass-gold' : 'bg-[var(--card-elevated)] text-compass-gold'
          : accent ? 'text-compass-gold/70 hover:text-compass-gold hover:bg-compass-gold/10'
          : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)]'
      }`}
    >
      {label}
    </Link>
  );
}
