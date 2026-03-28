'use client';

import { useMemo } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { useAppStore } from '@/store';
import { getTimeConditions } from '@/engine/interpolation';
import { getSeasonalConditions } from '@/data/cities/sf-bay/seasonal-conditions';
import {
  describeWind,
  describeWaterTemp,
  describeVisibility,
  describeTide,
} from '@/lib/conditions-text';

/**
 * Compact conditions summary bar for the sidebar.
 * Shows current conditions for the selected home base zone:
 * air temp, wind, waves, water temp, tide, and fog warnings.
 */
export function ConditionsBar() {
  const { homeBaseId, month, hour } = useAppStore();

  const data = useMemo(() => {
    const origin = sfBay.destinations.find((d) => d.id === homeBaseId);
    if (!origin) return null;

    const zone = sfBay.zones.find((z) => z.id === origin.zone);
    if (!zone) return null;

    const conditions = getTimeConditions(zone, Math.floor(hour), month);
    const seasonal = getSeasonalConditions(month);
    const isAM = hour < 12;

    const windDesc = describeWind(conditions.windKts);
    const waterTempF = conditions.waterTempF ?? seasonal.waterTempF;
    const waterDesc = describeWaterTemp(waterTempF);
    const visibilityMi = conditions.visibilityMi ?? (isAM ? seasonal.typicalVisibilityAM_Mi : seasonal.typicalVisibilityPM_Mi);
    const visDesc = describeVisibility(visibilityMi);
    const fogProb = isAM ? seasonal.fogProbabilityAM : seasonal.fogProbabilityPM;
    const airTempF = conditions.airTempF ?? (isAM ? seasonal.airTempLowF : seasonal.airTempHighF);

    const tidePhase = conditions.tidePhase ?? (isAM ? 'flood' : 'ebb');
    const tideFt = conditions.tideFt ?? 3.0;
    const tideDesc = describeTide(tidePhase, tideFt);

    // Wind direction (prevailing westerly default for SF Bay)
    const windDirDeg = (conditions as any).windDirDeg ?? 270;
    const windDirLabel = degToCompass(windDirDeg);

    return {
      airTempF: Math.round(airTempF),
      windKts: Math.round(conditions.windKts),
      windDirLabel,
      windSeverity: windDesc.severity,
      waveHtFt: conditions.waveHtFt,
      waterTempF: Math.round(waterTempF),
      waterWarning: waterDesc.warning,
      tideText: tideDesc.text,
      tideEmoji: tideDesc.emoji,
      fogWarning: fogProb > 0.3,
      fogProb: Math.round(fogProb * 100),
      visWarning: visDesc.warning,
    };
  }, [homeBaseId, month, hour]);

  if (!data) return null;

  return (
    <div className="px-3 py-1.5 border-b border-[var(--border)] bg-ocean-950/80 shrink-0">
      <div className="flex items-center gap-3 text-[11px] text-ocean-200 overflow-x-auto whitespace-nowrap">
        {/* Air temp */}
        <span title="Air temperature">
          {data.airTempF > 70 ? '\u2600\uFE0F' : data.airTempF > 55 ? '\u{1F324}\uFE0F' : '\u{1F325}\uFE0F'}{' '}
          {data.airTempF}&deg;F
        </span>

        {/* Wind */}
        <span
          title={describeWind(data.windKts).text}
          className={
            data.windSeverity === 'dangerous'
              ? 'text-danger-red'
              : data.windSeverity === 'strong'
                ? 'text-compass-gold'
                : ''
          }
        >
          {'\u{1F4A8}'} {data.windKts}kt {data.windDirLabel}
        </span>

        {/* Waves */}
        <span title={`Wave height: ${data.waveHtFt}ft`}>
          {'\u{1F30A}'} {data.waveHtFt}ft
        </span>

        {/* Water temp */}
        <span
          title={describeWaterTemp(data.waterTempF).text}
          className={data.waterWarning ? 'text-safety-blue' : ''}
        >
          {'\u{1F321}\uFE0F'} {data.waterTempF}&deg;F water
        </span>

        {/* Tide */}
        <span title={data.tideText}>
          {data.tideEmoji} Tide
        </span>

        {/* Fog warning */}
        {data.fogWarning && (
          <span className="text-compass-gold" title={`${data.fogProb}% fog probability`}>
            {'\u{1F32B}\uFE0F'} Fog likely
          </span>
        )}
      </div>
    </div>
  );
}

/** Convert degrees to 8-point compass direction. */
function degToCompass(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((deg % 360) + 360) % 360 / 45) % 8;
  return dirs[index];
}
