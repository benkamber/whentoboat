import { Header } from '../components/Header';

export const metadata = {
  title: 'Privacy Policy — WhenToBoat',
  description: 'How WhenToBoat handles your data (spoiler: we collect almost nothing).',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-compass-gold">Privacy Policy</h1>
        <p className="text-sm text-[var(--muted)]">Last updated: March 2026</p>

        <div className="bg-reef-teal/10 border border-reef-teal/30 rounded-xl p-4 text-sm text-[var(--secondary)]">
          <strong className="text-reef-teal">The short version:</strong>{' '}
          WhenToBoat has no accounts, no cookies, no tracking pixels, and no advertising.
          Your preferences are stored in your browser and never leave your device.
          We use Vercel Analytics for anonymous page view counts. That is it.
        </div>

        <section className="space-y-4 text-sm text-[var(--secondary)] leading-relaxed">

          {/* --- What We Collect --- */}
          <h2 className="text-lg font-semibold text-[var(--foreground)]">What We Collect</h2>
          <p>Almost nothing. Here is the complete list:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>
              <strong>Anonymous page views</strong> — We use{' '}
              <a href="https://vercel.com/docs/analytics/privacy-policy" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">
                Vercel Analytics
              </a>{' '}
              to count how many people visit the site. It does not use cookies, does not track you across sites, and does not collect personal information. It is GDPR-compliant by design.
            </li>
            <li>
              <strong>Performance metrics</strong> — We use{' '}
              <a href="https://vercel.com/docs/speed-insights" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">
                Vercel Speed Insights
              </a>{' '}
              to measure page load times (Web Vitals). This helps us keep the app fast. No personal data is collected.
            </li>
          </ul>
          <p>That is the entire list. We do not collect your name, email, location, IP address, device fingerprint, or anything else.</p>

          {/* --- What We Don't Collect --- */}
          <h2 className="text-lg font-semibold text-[var(--foreground)]">What We Do NOT Collect</h2>
          <ul className="list-disc pl-6 space-y-1">
            <li>No accounts or sign-ups</li>
            <li>No email addresses</li>
            <li>No GPS or device location (we never ask for your location — the app uses hardcoded coordinates for SF Bay)</li>
            <li>No cookies set by WhenToBoat</li>
            <li>No advertising or ad trackers</li>
            <li>No social media tracking pixels</li>
            <li>No cross-site tracking of any kind</li>
            <li>No user-generated content</li>
            <li>No selling or sharing of data with anyone, ever</li>
          </ul>

          {/* --- Browser Storage --- */}
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Browser Storage (localStorage)</h2>
          <p>
            To remember your preferences between visits, WhenToBoat stores a small amount of data in your browser&apos;s localStorage. This data never leaves your device — it is not sent to our servers or anyone else.
          </p>
          <p>Here is exactly what is stored:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Your activity choice</strong> — kayak, SUP, powerboat, or sailing</li>
            <li><strong>Time preferences</strong> — which month and hour you last viewed</li>
            <li><strong>Home base</strong> — your chosen launch point (e.g., Sausalito)</li>
            <li><strong>Vessel profile</strong> — boat type, speed, draft, and other characteristics</li>
            <li><strong>Saved spots</strong> — destination IDs you bookmarked for quick access</li>
            <li><strong>Custom vessels</strong> — any vessel profiles you created</li>
            <li><strong>Dark mode preference</strong></li>
            <li><strong>Disclaimer accepted</strong> — whether you have accepted the safety disclaimer</li>
            <li><strong>Onboarding completed</strong> — whether you have seen the intro walkthrough</li>
          </ul>
          <p>
            None of this is personal information. It is all functional data about how you want the app to behave.
          </p>

          {/* --- How to Clear Your Data --- */}
          <h2 className="text-lg font-semibold text-[var(--foreground)]">How to Clear Your Data</h2>
          <p>Since everything is stored in your browser, you have full control:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Chrome:</strong> Settings &rarr; Privacy and security &rarr; Clear browsing data &rarr; check &ldquo;Cookies and other site data&rdquo; (this includes localStorage)
            </li>
            <li>
              <strong>Firefox:</strong> Settings &rarr; Privacy &amp; Security &rarr; Cookies and Site Data &rarr; Clear Data
            </li>
            <li>
              <strong>Safari:</strong> Settings &rarr; Privacy &rarr; Manage Website Data &rarr; find whentoboat.com &rarr; Remove
            </li>
            <li>
              <strong>Any browser:</strong> Open DevTools (F12) &rarr; Application tab &rarr; Local Storage &rarr; right-click whentoboat.com &rarr; Clear
            </li>
          </ul>
          <p>
            Clearing your data resets the app to its default state. You will see the safety disclaimer and onboarding again.
          </p>

          {/* --- Third-Party Data Sources --- */}
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Third-Party Data Sources</h2>
          <p>
            WhenToBoat fetches weather, tide, current, and astronomical data from public government APIs and open data sources. When the app makes these requests, it sends geographic coordinates or station IDs — never any information about you.
          </p>
          <p>Our data sources and what we send them:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong><a href="https://open-meteo.com/en/terms" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">Open-Meteo</a></strong>{' '}
              — Weather and marine forecasts. We send SF Bay coordinates. Open-Meteo is a free, open-source weather API that does not track users.
            </li>
            <li>
              <strong><a href="https://tidesandcurrents.noaa.gov/" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">NOAA CO-OPS</a></strong>{' '}
              — Tide predictions and tidal current predictions. We send station IDs (e.g., station 9414290 for SF Bay). NOAA is a U.S. government agency.
            </li>
            <li>
              <strong><a href="https://www.weather.gov/documentation/services-web-api" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">National Weather Service (NWS)</a></strong>{' '}
              — Marine weather alerts. We send marine zone IDs (PZZ530, PZZ531, PZZ545). NWS is part of NOAA.
            </li>
            <li>
              <strong><a href="https://coastwatch.pfeg.noaa.gov/erddap/index.html" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">NOAA ERDDAP / NDBC</a></strong>{' '}
              — Real-time buoy observations. We send buoy station IDs. Another U.S. government service.
            </li>
            <li>
              <strong><a href="https://aa.usno.navy.mil/data" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">U.S. Naval Observatory</a></strong>{' '}
              — Sunrise, sunset, moon phase data. We send coordinates and a date.
            </li>
            <li>
              <strong><a href="https://www.mapbox.com/legal/privacy" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">Mapbox</a></strong>{' '}
              — Map tiles and styling. When you interact with the map, your browser loads map tiles from Mapbox servers. These requests contain the area of the map you are viewing. Mapbox has its own{' '}
              <a href="https://www.mapbox.com/legal/privacy" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">privacy policy</a>.
            </li>
          </ul>
          <p>
            All API requests are made from our server (not your browser), except for Mapbox map tiles and Vercel Analytics, which load directly in your browser.
          </p>

          {/* --- Vercel Hosting --- */}
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Hosting and Server Logs</h2>
          <p>
            WhenToBoat is hosted on{' '}
            <a href="https://vercel.com/legal/privacy-policy" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">Vercel</a>.
            Like all web hosts, Vercel records standard server logs that include IP addresses, request URLs, timestamps, and browser user-agent strings. These logs are managed by Vercel, not by us, and are subject to{' '}
            <a href="https://vercel.com/legal/privacy-policy" className="text-safety-blue hover:underline" target="_blank" rel="noopener noreferrer">Vercel&apos;s privacy policy</a>.
            We do not access, analyze, or store these logs ourselves.
          </p>
          <p>
            Our application code does not log any user-identifying information. Server-side error logging includes only technical details (e.g., &ldquo;Tide API unavailable: timeout&rdquo;) with no user data.
          </p>

          {/* --- Your Rights --- */}
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Your Rights</h2>
          <p>
            Because we collect almost no data, most privacy regulations have little to apply here. That said, you have the right to:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Know what we store</strong> — You just read it. This page is the complete list.</li>
            <li><strong>Delete your data</strong> — Clear your browser&apos;s localStorage (instructions above). That removes everything.</li>
            <li><strong>Use the app without tracking</strong> — Vercel Analytics respects your browser&apos;s Do Not Track setting. If you enable DNT, no analytics data is collected from your visits.</li>
            <li><strong>Ask questions</strong> — If anything here is unclear, reach out. We are a small project and happy to explain.</li>
          </ul>

          {/* --- Children --- */}
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Children</h2>
          <p>
            WhenToBoat does not knowingly collect any personal information from anyone, including children under 13. Since we have no accounts and collect no personal data, there is nothing to collect in the first place.
          </p>

          {/* --- Changes --- */}
          <h2 className="text-lg font-semibold text-[var(--foreground)]">Changes to This Policy</h2>
          <p>
            If we make material changes to how we handle data (for example, if we add user accounts or new analytics), we will update this page and the &ldquo;Last updated&rdquo; date at the top. Since we are a small project, we do not have a mailing list to notify — check this page if you are curious.
          </p>

        </section>

        <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)] space-y-2">
          <p>
            This privacy policy is written in plain English because you deserve to actually understand it. No legal team was harmed in its production.
          </p>
          <p>
            See also: <a href="/terms" className="text-safety-blue hover:underline">Terms of Service</a>
          </p>
        </div>
      </main>
    </div>
  );
}
