'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { EmergencyButton } from './EmergencyPanel';
import { useAppStore } from '@/store';
import { AVAILABLE_CITIES } from '@/lib/city-context';

const PRIMARY_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/planner', label: 'Plan' },
  { href: '/conditions', label: 'Now' },
];

const MORE_LINKS = [
  { href: '/events', label: 'Events' },
  { href: '/guides', label: 'Guides' },
  { href: '/vessels', label: 'My Boats' },
  { href: '/support', label: 'Support' },
  { href: '/privacy', label: 'Privacy' },
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
        <div className="flex items-center gap-2.5">
          <Link href="/" className="text-xl font-extrabold text-compass-gold tracking-tight">
            WhenToBoat
          </Link>
          <CitySelector />
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {PRIMARY_LINKS.map(link => (
            <NavLink key={link.href} href={link.href} label={link.label} active={pathname === link.href} />
          ))}
          {/* More dropdown */}
          <div className="relative group">
            <button className="px-3.5 py-2 rounded-lg text-sm font-medium text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)] transition-colors">
              More ▾
            </button>
            <div className="absolute right-0 top-full mt-1 w-40 bg-[var(--card)] border border-[var(--border)] rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              {MORE_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    pathname === link.href
                      ? 'text-compass-gold bg-[var(--card-elevated)]'
                      : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)]'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Inbox + Emergency — always visible */}
        <InboxBell />
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

function CitySelector() {
  const { cityId, setCityId } = useAppStore();
  return (
    <select
      value={cityId}
      onChange={(e) => setCityId(e.target.value)}
      className="bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-2 py-1 text-xs text-[var(--foreground)] cursor-pointer focus:border-compass-gold focus:outline-none appearance-none"
      title="Select region"
    >
      {AVAILABLE_CITIES.map(city => (
        <option key={city.id} value={city.id}>{city.name}</option>
      ))}
    </select>
  );
}

function InboxBell() {
  const unread = useAppStore(s => s.inbox.filter(i => !i.read && !i.archived).length);
  return (
    <Link href="/inbox" className="relative p-2 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-elevated)] transition-colors" title="Inbox">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-danger-red text-white text-[10px] font-bold flex items-center justify-center">
          {unread > 9 ? '9+' : unread}
        </span>
      )}
    </Link>
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
