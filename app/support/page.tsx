import { Header } from '../components/Header';

export const metadata = {
  title: 'Support WhenToBoat',
  description: 'Help keep WhenToBoat free — support development, hosting, and data access.',
};

export default function SupportPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-compass-gold">Support WhenToBoat</h1>

        <div className="bg-reef-teal/10 border border-reef-teal/30 rounded-xl p-5 space-y-3">
          <p className="text-sm text-[var(--secondary)] leading-relaxed">
            WhenToBoat is free, has no ads, no tracking, and no accounts. It is built and maintained
            by one person who loves boating on SF Bay.
          </p>
          <p className="text-sm text-[var(--secondary)] leading-relaxed">
            If this tool has helped you plan a trip, find a new destination, or avoid bad conditions,
            consider buying me a coffee. Every contribution helps cover:
          </p>
          <ul className="list-disc pl-6 text-sm text-[var(--secondary)] space-y-1">
            <li>Vercel hosting and deployment</li>
            <li>Mapbox map tile usage</li>
            <li>NOAA and weather API access</li>
            <li>Ongoing development and data curation</li>
            <li>Annual event calendar research and updates</li>
          </ul>
        </div>

        <div className="text-center space-y-4">
          <a
            href="https://buymeacoffee.com/whentoboat"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-lg font-bold bg-compass-gold text-ocean-900 hover:bg-compass-gold/90 transition-colors shadow-lg"
          >
            <span aria-hidden="true">☕</span>
            Buy Me a Coffee
          </a>
          <p className="text-xs text-[var(--muted)]">
            Secure payment via Buy Me a Coffee. No account required.
          </p>
        </div>

        <div className="space-y-4 text-sm text-[var(--secondary)] leading-relaxed">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Other Ways to Help</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Share with fellow boaters</strong> — Tell your yacht club, kayak group, or marina neighbors about WhenToBoat.
            </li>
            <li>
              <strong>Report bugs or suggest features</strong> — Your feedback makes the app better for everyone.
            </li>
            <li>
              <strong>Verify event data</strong> — If you notice an event date is wrong or missing, let us know.
            </li>
          </ul>
        </div>

        <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
          <p>
            WhenToBoat will always be free to use. Donations are optional and deeply appreciated.
          </p>
        </div>
      </main>
    </div>
  );
}
