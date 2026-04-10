'use client';

import Link from 'next/link';
import { useBuoyObservations, STATION_NAMES } from '@/hooks/useBuoyObservations';

const WIND_DIRS: Record<number, string> = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW', 360: 'N' };

function windDir(deg: number | null): string {
  if (deg === null) return '';
  let closest = 0, minD = 999;
  for (const d of [0, 45, 90, 135, 180, 225, 270, 315, 360]) {
    if (Math.abs(deg - d) < minD) { minD = Math.abs(deg - d); closest = d; }
  }
  return WIND_DIRS[closest] ?? '';
}

export function ConditionsChip() {
  const { data, loading } = useBuoyObservations();

  if (loading || !data) return null;

  // Use Fort Point (FTPC1) as the primary station — inside the Gate, most representative
  const station = data.observations.find(o => o.station === 'FTPC1')
    ?? data.observations.find(o => o.windSpeedKts !== null);
  if (!station) return null;

  const wind = station.windSpeedKts;
  const waves = station.waveHeightFt;
  const dir = windDir(station.windDirDeg);
  const dotColor = wind === null ? '#6b7280' : wind > 15 ? '#ef4444' : wind > 8 ? '#f59e0b' : '#10b981';

  return (
    <Link
      href="/conditions"
      className="absolute bottom-16 left-3 z-10 flex items-center gap-2 bg-ocean-900/90 backdrop-blur-md border border-ocean-700/50 rounded-lg px-3 py-1.5 shadow-lg hover:bg-ocean-800/90 transition-colors group"
      title="Live NOAA buoy observation — click for details"
    >
      <span className="w-2 h-2 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: dotColor }} />
      <span className="text-2xs text-ocean-100 font-medium">
        {wind !== null ? `${wind.toFixed(0)} kt ${dir}` : 'Wind --'}
        {waves !== null && ` · ${waves.toFixed(1)} ft`}
      </span>
      <span className="text-2xs text-ocean-400 group-hover:text-ocean-200">→</span>
    </Link>
  );
}
