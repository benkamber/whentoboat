'use client';

import { Header } from '../components/Header';
import { useMarineAlerts } from '@/hooks/useMarineAlerts';
import { useBuoyObservations, STATION_NAMES, STATION_URLS } from '@/hooks/useBuoyObservations';

const WIND_DIR_LABELS: Record<number, string> = {
  0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW', 360: 'N',
};

function windDirLabel(deg: number | null): string {
  if (deg === null) return '--';
  const dirs = [0, 45, 90, 135, 180, 225, 270, 315, 360];
  let closest = 0;
  let minDiff = 999;
  for (const d of dirs) {
    const diff = Math.abs(deg - d);
    if (diff < minDiff) { minDiff = diff; closest = d; }
  }
  return WIND_DIR_LABELS[closest] ?? '--';
}

function staleness(timeStr: string): { label: string; color: string } {
  const age = Date.now() - new Date(timeStr).getTime();
  const mins = Math.round(age / 60000);
  if (mins < 60) return { label: `${mins}m ago`, color: 'text-reef-teal' };
  const hrs = Math.round(mins / 60);
  if (hrs < 3) return { label: `${hrs}h ago`, color: 'text-warning-amber' };
  return { label: `${hrs}h ago`, color: 'text-danger-red' };
}

export default function ConditionsPage() {
  const { alerts, hasActiveAlerts, hasGaleWarning, hasSmallCraftAdvisory, hasFogAdvisory, loading: alertsLoading } = useMarineAlerts();
  const { data: buoyData, loading: buoyLoading, error: buoyError } = useBuoyObservations();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-compass-gold">Current Conditions</h1>
          <p className="text-sm text-[var(--muted)] mt-1">
            Real-time observations from NOAA buoy stations around San Francisco Bay.
          </p>
        </div>

        {/* CRITICAL caveat */}
        <div className="bg-warning-amber/10 border border-warning-amber/30 rounded-xl p-4 text-sm text-warning-amber">
          These are real-time observations from NOAA buoy stations, not forecasts.
          Observations show what is happening at these specific locations right now.
          Conditions vary across the Bay and can change rapidly.
          Always verify with{' '}
          <a href="https://www.weather.gov/mtr/MarineProducts" target="_blank" rel="noopener noreferrer" className="underline font-medium">
            NOAA
          </a>{' '}
          before departure.
        </div>

        {/* Active alerts */}
        {!alertsLoading && hasActiveAlerts && (
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-danger-red uppercase tracking-wider">Active Alerts</h2>
            {alerts.map((alert, i) => {
              const isGale = alert.event?.toLowerCase().includes('gale');
              const isSCA = alert.event?.toLowerCase().includes('small craft');
              const isFog = alert.event?.toLowerCase().includes('fog') || alert.event?.toLowerCase().includes('dense');
              const borderColor = isGale ? 'border-danger-red/50' : isSCA ? 'border-warning-amber/50' : 'border-safety-blue/50';
              const bgColor = isGale ? 'bg-danger-red/10' : isSCA ? 'bg-warning-amber/10' : 'bg-safety-blue/10';
              const textColor = isGale ? 'text-danger-red' : isSCA ? 'text-warning-amber' : 'text-safety-blue';

              return (
                <div key={i} className={`${bgColor} border ${borderColor} rounded-lg p-3 space-y-1`}>
                  <div className={`text-sm font-semibold ${textColor}`}>{alert.event}</div>
                  <p className="text-xs text-[var(--secondary)]">{alert.headline}</p>
                  {alert.onset && alert.expires && (
                    <p className="text-2xs text-[var(--muted)]">
                      {new Date(alert.onset).toLocaleString()} — {new Date(alert.expires).toLocaleString()}
                    </p>
                  )}
                  <a href="https://www.weather.gov/mtr/" target="_blank" rel="noopener noreferrer" className="text-2xs text-safety-blue hover:underline">
                    Verify at NWS →
                  </a>
                </div>
              );
            })}
          </div>
        )}

        {!alertsLoading && !hasActiveAlerts && (
          <div className="bg-reef-teal/10 border border-reef-teal/30 rounded-lg p-3 text-sm text-reef-teal">
            No active marine weather alerts for SF Bay.
          </div>
        )}

        {/* Buoy observations */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">
            Buoy Observations
          </h2>

          {buoyLoading && (
            <div className="text-sm text-[var(--muted)] py-8 text-center">Loading observations...</div>
          )}

          {buoyError && (
            <div className="bg-danger-red/10 border border-danger-red/30 rounded-lg p-3 text-sm text-danger-red">
              {buoyError}
            </div>
          )}

          {buoyData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {buoyData.observations.map((obs) => {
                const name = STATION_NAMES[obs.station] ?? obs.station;
                const url = STATION_URLS[obs.station];
                const age = staleness(obs.time);

                return (
                  <div key={obs.station} className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-[var(--foreground)]">{name}</h3>
                        <span className={`text-2xs ${age.color}`}>Observed {age.label}</span>
                      </div>
                      {url && (
                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-2xs text-safety-blue hover:underline">
                          NOAA →
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {obs.windSpeedKts !== null && (
                        <div>
                          <span className="text-[var(--muted)]">Wind</span>
                          <p className="font-medium text-[var(--foreground)]">
                            {obs.windSpeedKts.toFixed(0)} kt {windDirLabel(obs.windDirDeg)}
                            {obs.windGustKts !== null && <span className="text-[var(--muted)]"> (G {obs.windGustKts.toFixed(0)})</span>}
                          </p>
                        </div>
                      )}

                      {obs.waveHeightFt !== null && (
                        <div>
                          <span className="text-[var(--muted)]">Waves</span>
                          <p className="font-medium text-[var(--foreground)]">
                            {obs.waveHeightFt.toFixed(1)} ft
                            {obs.wavePeriodS !== null && <span className="text-[var(--muted)]"> @ {obs.wavePeriodS.toFixed(0)}s</span>}
                          </p>
                        </div>
                      )}

                      {obs.waterTempF !== null && (
                        <div>
                          <span className="text-[var(--muted)]">Water</span>
                          <p className="font-medium text-[var(--foreground)]">{obs.waterTempF.toFixed(0)}°F</p>
                        </div>
                      )}

                      {obs.airTempF !== null && (
                        <div>
                          <span className="text-[var(--muted)]">Air</span>
                          <p className="font-medium text-[var(--foreground)]">{obs.airTempF.toFixed(0)}°F</p>
                        </div>
                      )}

                      {obs.pressureHpa !== null && (
                        <div>
                          <span className="text-[var(--muted)]">Pressure</span>
                          <p className="font-medium text-[var(--foreground)]">{obs.pressureHpa.toFixed(0)} hPa</p>
                        </div>
                      )}

                      {obs.visibilityNm !== null && (
                        <div>
                          <span className="text-[var(--muted)]">Visibility</span>
                          <p className={`font-medium ${obs.visibilityNm < 3 ? 'text-warning-amber' : 'text-[var(--foreground)]'}`}>
                            {obs.visibilityNm.toFixed(1)} nm
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Source attribution */}
        <div className="border-t border-[var(--border)] pt-6 text-xs text-[var(--muted)] space-y-2">
          <p>
            Observations:{' '}
            <a href="https://www.ndbc.noaa.gov/" target="_blank" rel="noopener noreferrer" className="text-safety-blue hover:underline">
              NOAA National Data Buoy Center
            </a>{' '}
            via ERDDAP. Alerts:{' '}
            <a href="https://www.weather.gov/mtr/" target="_blank" rel="noopener noreferrer" className="text-safety-blue hover:underline">
              National Weather Service, Monterey
            </a>.
          </p>
          <p>Data refreshes every 15 minutes. Not a forecast or prediction.</p>
        </div>
      </main>
    </div>
  );
}
