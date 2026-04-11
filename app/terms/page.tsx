import { Header } from '../components/Header';

export const metadata = {
  title: 'Terms of Service — WhenToBoat',
  description: 'WhenToBoat terms of service and disclaimer.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-2xl mx-auto px-4 py-10 space-y-8">
        <h1 className="text-3xl font-bold text-compass-gold">Terms of Service</h1>
        <p className="text-sm text-[var(--muted)]">Last updated: April 2026</p>

        <section className="space-y-4 text-sm text-[var(--secondary)] leading-relaxed">
          <h2 className="text-lg font-semibold text-[var(--foreground)]">1. Planning Tool Disclaimer</h2>
          <p>
            WhenToBoat is a recreational planning tool that interprets publicly available environmental data from the National Oceanic and Atmospheric Administration (NOAA), the National Weather Service (NWS), and other government sources into plain-language condition assessments for recreational water activities.
          </p>
          <p>
            <strong>WhenToBoat is NOT a real-time weather forecasting service, navigational aid, or safety authority.</strong> Condition assessments are derived from forecast models and historical data. Wind forecasts may underestimate peak conditions, especially during afternoon thermal winds. Tidal current predictions may deviate significantly during strong wind events. Do not solely rely on WhenToBoat for trip planning decisions.
          </p>

          <h2 className="text-lg font-semibold text-[var(--foreground)]">2. Assumption of Risk</h2>
          <p>
            If you rely on any information provided by WhenToBoat, you do so solely at your own risk. Boating, kayaking, paddleboarding, sailing, and all water-based activities carry inherent risks including but not limited to drowning, hypothermia, collision, capsizing, and exposure to rapidly changing weather conditions.
          </p>
          <p>
            The captain or operator of any vessel bears sole and absolute responsibility for:
          </p>
          <ul className="list-disc pl-6 space-y-1">
            <li>The decision to depart from shore</li>
            <li>Checking current weather conditions, marine forecasts, tides, and currents from authoritative sources before and during any outing</li>
            <li>The safety of all passengers, crew, and equipment</li>
            <li>Compliance with all applicable federal, state, and local maritime regulations</li>
            <li>Carrying required safety equipment including personal flotation devices (PFDs)</li>
            <li>Filing a float plan with a responsible person on shore</li>
          </ul>

          <h2 className="text-lg font-semibold text-[var(--foreground)]">3. No Warranty</h2>
          <p>
            WhenToBoat is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied. We do not warrant that the information will be accurate, complete, timely, or error-free. Historical patterns do not predict future conditions. Weather, sea state, currents, and other environmental factors can change rapidly and without warning.
          </p>

          <h2 className="text-lg font-semibold text-[var(--foreground)]">4. Limitation of Liability</h2>
          <p>
            WhenToBoat accepts no liability for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of or reliance on the service, including but not limited to bodily injury, death, property damage, or economic loss arising from adverse weather conditions, errors in data upon which the service is based, or reliance on the service for planning water-based activities. No guarantees are made regarding tidal current predictions. You may not use this data if anyone or anything could come to harm as a result. Our total liability shall not exceed the greater of $100 or the fees paid by you in the prior 12 months.
          </p>

          <h2 className="text-lg font-semibold text-[var(--foreground)]">5. Data Sources</h2>
          <p>
            WhenToBoat uses publicly available data from government agencies including NOAA (National Data Buoy Center, Center for Operational Oceanographic Products and Services, National Weather Service) and USGS. We also use Open-Meteo for forecast data. We do not generate proprietary weather data. All data sources are attributed within the application.
          </p>

          <h2 className="text-lg font-semibold text-[var(--foreground)]">6. Verify Before You Go</h2>
          <p>
            Every recommendation in WhenToBoat includes links to authoritative real-time data sources. You must check these sources before every outing. Historical comfort scores are not substitutes for current marine weather forecasts.
          </p>

          <h2 className="text-lg font-semibold text-[var(--foreground)]">7. Privacy</h2>
          <p>
            WhenToBoat stores your preferences (home base, vessel profile, saved spots) locally in your browser. We do not collect, store, or transmit personal data. We use Vercel Analytics for anonymous page view counts. We do not sell or share any user data. See our full{' '}
            <a href="/privacy" className="text-safety-blue hover:underline">Privacy Policy</a>{' '}
            for details.
          </p>
        </section>

        <div className="pt-4 border-t border-[var(--border)] text-xs text-[var(--muted)]">
          <p>
            This terms of service is modeled on industry-standard practices used by marine weather applications including PredictWind, Surfline, and Navionics. If you do not agree to these terms, do not use the application.
          </p>
        </div>
      </main>
    </div>
  );
}
