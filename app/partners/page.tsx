import { Header } from '../components/Header';

export const metadata = {
  title: 'Partner Tools — WhenToBoat',
  description: 'Free conditions widgets and booking links for marinas, outfitters, and yacht clubs on SF Bay.',
};

export default function PartnersPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-compass-gold">Partner Tools</h1>
          <p className="text-sm text-[var(--muted)] mt-2">
            Free conditions data for your website. No tracking, no fees, no setup required.
          </p>
        </div>

        {/* Synthetic bookmark links */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Direct Links</h2>
          <p className="text-sm text-[var(--secondary)]">
            Link your customers directly to conditions for your launch site. These URLs are human-readable and shareable.
          </p>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
            <div>
              <p className="text-xs text-[var(--muted)] mb-1">Kayaking from Sausalito:</p>
              <code className="text-xs text-compass-gold bg-[var(--card-elevated)] px-2 py-1 rounded block">
                whentoboat.com/go/sausalito/kayak
              </code>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] mb-1">SUP at Schoonmaker Point:</p>
              <code className="text-xs text-compass-gold bg-[var(--card-elevated)] px-2 py-1 rounded block">
                whentoboat.com/go/schoonmaker-point/sup
              </code>
            </div>
            <div>
              <p className="text-xs text-[var(--muted)] mb-1">Powerboat from Berkeley to Angel Island:</p>
              <code className="text-xs text-compass-gold bg-[var(--card-elevated)] px-2 py-1 rounded block">
                whentoboat.com/go/berkeley-marina/powerboat/angel-island
              </code>
            </div>
          </div>
          <p className="text-sm text-[var(--secondary)]">
            Put these links on your website, in booking confirmation emails, or on social media.
            Your customers see conditions specific to their activity and location.
          </p>
        </section>

        {/* Embed widget */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Embeddable Widget</h2>
          <p className="text-sm text-[var(--secondary)]">
            Add live conditions to your website with a single line of code. Free, no API key needed.
          </p>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-3">
            <p className="text-xs text-[var(--muted)]">Basic embed:</p>
            <pre className="text-xs text-compass-gold bg-[var(--card-elevated)] px-3 py-2 rounded overflow-x-auto">
{`<iframe
  src="https://whentoboat.com/embed?location=skm&activity=kayak"
  width="320" height="220"
  style="border:none; border-radius:12px;"
></iframe>`}
            </pre>

            <p className="text-xs text-[var(--muted)]">With booking button:</p>
            <pre className="text-xs text-compass-gold bg-[var(--card-elevated)] px-3 py-2 rounded overflow-x-auto">
{`<iframe
  src="https://whentoboat.com/embed?location=skm&activity=kayak&book=https://seatrek.com/book&partner=Sea+Trek"
  width="320" height="260"
  style="border:none; border-radius:12px;"
></iframe>`}
            </pre>
          </div>

          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 space-y-2">
            <p className="text-sm font-medium text-[var(--foreground)]">Parameters:</p>
            <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs">
              <code className="text-reef-teal">location</code>
              <span className="text-[var(--secondary)]">Destination ID (e.g., skm, sau, brk). See your location page URL for the ID.</span>
              <code className="text-reef-teal">activity</code>
              <span className="text-[var(--secondary)]">kayak, sup, powerboat_cruise, casual_sail, fishing_boat, fishing_kayak</span>
              <code className="text-reef-teal">book</code>
              <span className="text-[var(--secondary)]">Your booking page URL. Adds a &quot;Book Now&quot; button.</span>
              <code className="text-reef-teal">partner</code>
              <span className="text-[var(--secondary)]">Your business name. Shown in attribution.</span>
            </div>
          </div>
        </section>

        {/* What's included */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">What the widget shows</h2>
          <ul className="list-disc pl-6 text-sm text-[var(--secondary)] space-y-2">
            <li>Current conditions tier: &quot;Looks good&quot; / &quot;Check conditions&quot; / &quot;Not recommended&quot;</li>
            <li>Wind speed, water temperature, tide phase</li>
            <li>Gear recommendations (wetsuit advisory when water &lt; 60°F)</li>
            <li>Risk factors if conditions are concerning</li>
            <li>Your &quot;Book Now&quot; button (if configured)</li>
            <li>&quot;Powered by WhenToBoat&quot; attribution</li>
          </ul>
        </section>

        {/* Disclaimer */}
        <section className="bg-warning-amber/10 border border-warning-amber/30 rounded-xl p-4 space-y-2">
          <h2 className="text-sm font-semibold text-warning-amber">Important for Partners</h2>
          <p className="text-sm text-[var(--secondary)]">
            WhenToBoat provides conditions interpretation for planning reference only.
            All safety decisions remain the responsibility of the operator/guide.
            The widget includes a &quot;Forecast data — verify before departure&quot; disclaimer.
            We carry no liability for decisions made based on displayed conditions.
          </p>
          <p className="text-sm text-[var(--secondary)]">
            By embedding the widget, you acknowledge that WhenToBoat is a supplementary
            planning tool and does not replace your professional safety briefings,
            weather checks, or go/no-go decision authority.
          </p>
        </section>

        {/* Contact */}
        <div className="text-center space-y-3 pt-4">
          <p className="text-sm text-[var(--secondary)]">
            Want a custom integration or white-label widget? Get in touch.
          </p>
          <a
            href="mailto:hello@whentoboat.com"
            className="inline-block px-6 py-3 rounded-xl text-sm font-bold bg-reef-teal text-white hover:bg-reef-teal/80 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </main>
    </div>
  );
}
