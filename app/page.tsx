'use client';

import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { sfBay } from '@/data/cities/sf-bay';
import { activities, getActivity } from '@/data/activities';
import { useAppStore } from '@/store';
import { routeComfort, findAlternatives, activityScore, fullConditionsScore } from '@/engine/scoring';
import { getTimeConditions } from '@/engine/interpolation';
import { scoreToColor } from '@/lib/colors';
import { useDestinationGeoJSON, useRouteGeoJSON } from '@/hooks/useMapData';
import { useZoneOverlay } from '@/hooks/useZoneOverlay';
import { useBathymetryOverlay } from '@/hooks/useBathymetryOverlay';
import { useLiveForecast } from '@/hooks/useLiveForecast';
import { vesselPresets } from '@/data/vessels';
import { Header } from './components/Header';
import { ScoreBadge, getScoreLabel } from './components/ScoreBadge';
import { TrajectoryPanel } from './components/TrajectoryPanel';
import { ActivityAdvisor } from './components/ActivityAdvisor';
import { ConditionsBar } from './components/ConditionsBar';
import { describeWind, describeWaves } from '@/lib/conditions-text';
import type { ActivityType, Destination, ScoredRoute } from '@/engine/types';

// Dynamically import react-map-gl to avoid SSR issues with mapbox-gl
// This also lets the page render the sidebar even if the map fails to load
const MapGL = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.default),
  { ssr: false }
);
const Source = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.Source),
  { ssr: false }
);
const Layer = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.Layer),
  { ssr: false }
);
const Popup = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.Popup),
  { ssr: false }
);
const NavigationControl = dynamic(
  () => import('react-map-gl/mapbox').then((mod) => mod.NavigationControl),
  { ssr: false }
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Mapbox layer styles
const routeLineLayer = {
  id: 'route-lines',
  type: 'line' as const,
  layout: {
    'line-join': 'round' as const,
    'line-cap': 'butt' as const,
  },
  paint: {
    'line-color': ['get', 'color'] as any,
    'line-width': 2.5,
    'line-opacity': ['get', 'opacity'] as any,
    'line-dasharray': [2, 2] as any,
  },
};

const routeHitLayer = {
  id: 'route-lines-hit',
  type: 'line' as const,
  paint: {
    'line-color': 'transparent',
    'line-width': 14,
    'line-opacity': 0,
  },
};

// Non-origin destination circles
const destinationCircleLayer = {
  id: 'destination-circles',
  type: 'circle' as const,
  filter: ['!', ['get', 'isOrigin']] as any,
  paint: {
    'circle-radius': 7,
    'circle-color': ['get', 'color'] as any,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#0a1628',
    'circle-opacity': 0.9,
  },
};

// Origin (home base) — larger with distinct white border
const originCircleLayer = {
  id: 'origin-circle',
  type: 'circle' as const,
  filter: ['get', 'isOrigin'] as any,
  paint: {
    'circle-radius': 12,
    'circle-color': ['get', 'color'] as any,
    'circle-stroke-width': 3,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 1,
  },
};

// Origin pulsing ring (outer glow)
const originRingLayer = {
  id: 'origin-ring',
  type: 'circle' as const,
  filter: ['get', 'isOrigin'] as any,
  paint: {
    'circle-radius': 18,
    'circle-color': 'transparent',
    'circle-stroke-width': 2,
    'circle-stroke-color': '#ffffff',
    'circle-opacity': 0.3,
  },
};

// Score labels inside destination circles (non-origin)
const destinationLabelLayer = {
  id: 'destination-labels',
  type: 'symbol' as const,
  filter: ['!', ['get', 'isOrigin']] as any,
  layout: {
    'text-field': ['get', 'score'] as any,
    'text-size': 11,
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
    'text-anchor': 'center' as const,
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: {
    'text-color': '#ffffff',
  },
};

// Origin name label below the circle
const originNameLayer = {
  id: 'origin-name',
  type: 'symbol' as const,
  filter: ['get', 'isOrigin'] as any,
  layout: {
    'text-field': ['get', 'name'] as any,
    'text-size': 12,
    'text-font': ['DIN Pro Bold', 'Arial Unicode MS Bold'],
    'text-anchor': 'top' as const,
    'text-offset': [0, 1.8] as any,
    'text-allow-overlap': true,
    'text-ignore-placement': true,
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': '#0a1628',
    'text-halo-width': 1.5,
  },
};

const zoneFillLayer = {
  id: 'zone-fill',
  type: 'fill' as const,
  paint: {
    'fill-color': ['get', 'color'] as any,
    'fill-opacity': ['get', 'opacity'] as any,
    'fill-color-transition': { duration: 300 } as any,
    'fill-opacity-transition': { duration: 300 } as any,
  },
};

const zoneBorderLayer = {
  id: 'zone-border',
  type: 'line' as const,
  paint: {
    'line-color': ['get', 'color'] as any,
    'line-width': 1,
    'line-opacity': 0.15,
  },
};

// Bathymetry depth overlay — sits behind zone comfort overlay
const bathymetryFillLayer = {
  id: 'bathymetry-fill',
  type: 'fill' as const,
  paint: {
    'fill-color': ['get', 'color'] as any,
    'fill-opacity': ['get', 'opacity'] as any,
  },
};

interface PopupInfo {
  lng: number;
  lat: number;
  type: 'destination' | 'route' | 'zone';
  name: string;
  score: number;
  detail: string;
}

type ScoredRouteWithDest = ScoredRoute & { dest: Destination; alternatives: ScoredRoute['alternatives'] };

export default function Home() {
  const {
    activity, month, hour, vessel, homeBaseId,
    selectedOriginId,
    setActivity, setMonth, setHour, setHomeBase,
    setSelectedOrigin,
  } = useAppStore();

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [cursor, setCursor] = useState('auto');
  const [trajectoryRoute, setTrajectoryRoute] = useState<{ originId: string; destId: string } | null>(null);
  const [hoveredDestId, setHoveredDestId] = useState<string | null>(null);
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [beforeYouGoOpen, setBeforeYouGoOpen] = useState(false);
  // verifyLinksOpen removed — verify links only in trajectory panel now
  const [mapLoaded, setMapLoaded] = useState(false);
  const [useLiveData, setUseLiveData] = useState(false);

  // Live forecast data
  const { forecast, loading: forecastLoading, getConditionsForHour, hasLiveDataForDate, sources: forecastSources } = useLiveForecast();

  const mapRef = useRef<any>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const currentActivity = getActivity(activity);
  const origin = sfBay.destinations.find((d) => d.id === homeBaseId) ?? sfBay.destinations[0];

  // Sync selectedOriginId with homeBaseId
  useEffect(() => {
    if (selectedOriginId !== homeBaseId) {
      setSelectedOrigin(homeBaseId);
    }
    // Only run when homeBaseId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeBaseId]);

  // Score all destinations — uses live forecast when toggled on, historical otherwise
  const scoredRoutes = useMemo(() => {
    // When live mode is on and we have forecast data, use live conditions
    const liveConditions = useLiveData ? getConditionsForHour(new Date(), Math.floor(hour)) : null;

    return sfBay.destinations
      .filter((d) => d.id !== origin.id && d.activityTags.includes(activity))
      .map((dest) => {
        try {
          // Base scoring always uses historical route comfort (for distance, fuel, zones, etc.)
          const scored = routeComfort(origin, dest, month, hour, currentActivity, vessel, sfBay);

          // If live forecast is available, override the score with live conditions
          if (liveConditions) {
            const { score: liveScore, factors } = fullConditionsScore(currentActivity, liveConditions, vessel);
            scored.score = liveScore;
            scored.riskFactors = [...factors, ...scored.riskFactors.filter(f =>
              !factors.some(lf => lf.factor === f.factor)
            )];
          }

          const alts = scored.score < 7
            ? findAlternatives(origin, month, hour, currentActivity, vessel, sfBay, dest.id)
            : [];
          return {
            ...scored,
            alternatives: alts,
            dest,
          };
        } catch (e) {
          console.error(`Scoring error for ${dest.id}:`, e);
          return null;
        }
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.score - a.score);
  }, [activity, month, hour, vessel, origin, currentActivity, useLiveData, getConditionsForHour]);

  // --- Feature 1: Hourly comfort scores for the color-gradient slider ---
  const hourlyComfort = useMemo(() => {
    const scores: number[] = [];
    for (let h = 5; h <= 22; h++) {
      let totalScore = 0;
      let count = 0;
      for (const zone of sfBay.zones) {
        const cond = getTimeConditions(zone, h, month);
        const score = activityScore(currentActivity, cond.windKts, cond.waveHtFt, cond.wavePeriodS);
        totalScore += score;
        count++;
      }
      scores.push(count > 0 ? Math.round(totalScore / count) : 5);
    }
    return scores;
  }, [month, currentActivity]);

  const sliderGradient = useMemo(() => {
    const colors = hourlyComfort.map(score => scoreToColor(score));
    const stops = colors.map((color, i) => `${color} ${(i / (colors.length - 1)) * 100}%`);
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [hourlyComfort]);

  // Key hours for mini comfort chart below the slider
  const comfortKeyHours = useMemo(() => {
    const keyHourValues = [5, 8, 11, 14, 17, 20];
    return keyHourValues.map(h => ({
      hour: h,
      label: h === 5 ? '5AM' : h === 8 ? '8AM' : h === 11 ? '11AM' : h === 14 ? '2PM' : h === 17 ? '5PM' : '8PM',
      score: hourlyComfort[h - 5],
    }));
  }, [hourlyComfort]);

  // --- Feature 2: Best forecast day/time banner ---
  const bestForecastDay = useMemo(() => {
    if (!useLiveData || !forecast?.hours.length) return null;

    const vesselMap: Record<string, string> = { kayak: 'kayak', sup: 'sup', powerboat_cruise: 'powerboat', casual_sail: 'sailboat' };
    const forecastVessel = vesselPresets.find(v => v.type === (vesselMap[currentActivity.id] ?? 'kayak')) ?? vesselPresets[0];

    // Group forecast hours by date
    const byDate = new Map<string, typeof forecast.hours>();
    for (const h of forecast.hours) {
      const dateKey = h.time.slice(0, 10);
      if (!byDate.has(dateKey)) byDate.set(dateKey, []);
      byDate.get(dateKey)!.push(h);
    }

    let bestScore = -1;
    let bestDayLabel = '';
    let bestTimeLabel = '';
    let bestDestName = '';
    let bestDescription = '';
    let overallBestScore = 0;

    for (const [dateKey, dayHours] of byDate) {
      // Filter to daytime hours (6 AM - 8 PM)
      const daytimeHours = dayHours.filter(h => {
        const hr = new Date(h.time).getHours();
        return hr >= 6 && hr < 20;
      });
      if (daytimeHours.length === 0) continue;

      const date = new Date(dateKey + 'T12:00:00');
      const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });

      // For each daytime hour, compute score for each destination
      for (const fh of daytimeHours) {
        const hr = new Date(fh.time).getHours();
        const conditions = {
          windKts: fh.windSpeedKts,
          windDirDeg: fh.windDirDeg,
          waveHtFt: fh.waveHeightFt >= 0 ? fh.waveHeightFt : 1.5,
          wavePeriodS: fh.wavePeriodS > 0 ? fh.wavePeriodS : 3,
          waterTempF: fh.waterTempF,
          airTempF: fh.airTempF,
          currentKts: fh.currentKts,
          currentDirDeg: fh.currentDirDeg,
          visibilityMi: fh.visibilityMi,
          tideFt: fh.tideFt >= 0 ? fh.tideFt : 3,
          tidePhase: (fh.tidePhase === 'unknown' ? 'flood' : fh.tidePhase) as any,
          isLiveForecast: true,
          isMissingWaveData: !fh.waveDataAvailable,
        };
        const { score } = fullConditionsScore(currentActivity, conditions, forecastVessel);

        if (score > bestScore) {
          bestScore = score;
          overallBestScore = score;
          const period = hr < 12 ? 'AM' : 'PM';
          const displayHr = hr === 0 ? 12 : hr > 12 ? hr - 12 : hr;
          bestDayLabel = dayName;
          bestTimeLabel = `${displayHr} ${period}`;

          // Find the best scoring destination at this time
          let topDestName = '';
          let topDestScore = -1;
          for (const dest of sfBay.destinations.filter(d => d.id !== origin.id && d.activityTags.includes(activity))) {
            const zone = sfBay.zones.find(z => z.id === dest.zone);
            if (!zone) continue;
            const destScore = activityScore(currentActivity, conditions.windKts, conditions.waveHtFt, conditions.wavePeriodS);
            if (destScore > topDestScore) {
              topDestScore = destScore;
              topDestName = dest.name;
            }
          }
          bestDestName = topDestName || 'the bay';

          // Build description
          const windDesc = conditions.windKts < 8 ? 'Light winds' : conditions.windKts < 15 ? 'Moderate winds' : 'Strong winds';
          const waveDesc = conditions.waveHtFt < 1 ? 'calm water' : conditions.waveHtFt < 2 ? 'light chop' : 'choppy water';
          bestDescription = `${windDesc}, ${waveDesc}. Best time for ${currentActivity.name.toLowerCase()}.`;
        }
      }
    }

    if (bestScore < 1) return null;

    return {
      dayLabel: bestDayLabel,
      timeLabel: bestTimeLabel,
      score: overallBestScore,
      destName: bestDestName,
      description: bestDescription,
    };
  }, [useLiveData, forecast, currentActivity, origin, activity, vessel]);

  // Format time with minutes (hour can be decimal, e.g., 9.5 = 9:30 AM)
  const formatTime = (h: number) => {
    const hrs = Math.floor(h);
    const mins = Math.round((h - hrs) * 60);
    const period = hrs < 12 ? 'AM' : 'PM';
    const displayHrs = hrs === 0 ? 12 : hrs > 12 ? hrs - 12 : hrs;
    return `${displayHrs}:${mins.toString().padStart(2, '0')} ${period}`;
  };
  const timeLabel = formatTime(hour);
  const hasMapToken = MAPBOX_TOKEN && MAPBOX_TOKEN !== 'pk.your_token_here';

  // Map data hooks
  const destinationsGeoJSON = useDestinationGeoJSON(activity, month, hour, vessel, homeBaseId);
  const routesGeoJSON = useRouteGeoJSON(activity, month, hour, vessel, homeBaseId);
  const bathymetryGeoJSON = useBathymetryOverlay();
  const zoneOverlayGeoJSON = useZoneOverlay(activity, month, hour, vessel);

  // --- Map callbacks ---

  const onMapLoad = useCallback(() => {
    setMapLoaded(true);
    const map = mapRef.current?.getMap?.();
    if (map) {
      try {
        map.setPaintProperty('water', 'fill-color', '#0a1628');
      } catch {
        // Style may not have 'water' layer
      }
    }
  }, []);

  const onMapClick = useCallback((e: any) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const layerId = feature.layer.id;

      if (layerId === 'destination-circles' || layerId === 'destination-labels' || layerId === 'origin-circle') {
        const id = feature.properties?.id;
        if (id && id !== homeBaseId) {
          // Clicking any non-home destination sets it as the new home base
          setHomeBase(id);
          setSelectedDestId(null);
          setTrajectoryRoute(null);
        }
        setPopup(null);
      } else if (layerId === 'route-lines-hit') {
        const fromId = feature.properties?.fromId;
        const toId = feature.properties?.toId;
        if (fromId && toId) {
          setTrajectoryRoute({ originId: fromId, destId: toId });
          setSelectedDestId(toId);
          setPopup(null);
        }
      }
    } else {
      setSelectedDestId(null);
      setPopup(null);
      setTrajectoryRoute(null);
    }
  }, [homeBaseId, setHomeBase]);

  const onMouseEnter = useCallback(() => setCursor('pointer'), []);
  const onMouseLeave = useCallback(() => {
    setCursor('auto');
    setPopup(null);
  }, []);

  const onMouseMove = useCallback((e: any) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const layerId = feature.layer.id;

      if (layerId === 'destination-circles' || layerId === 'destination-labels' || layerId === 'origin-circle') {
        const dest = sfBay.destinations.find(d => d.id === feature.properties?.id);
        const score = feature.properties?.score ?? 5;
        if (dest) {
          const isOrigin = dest.id === homeBaseId;
          setPopup({
            lng: dest.lng,
            lat: dest.lat,
            type: 'destination',
            name: dest.name,
            score,
            detail: isOrigin
              ? `Home base · ${dest.dockInfo}`
              : `Click to set as home base · ${dest.dockInfo}`,
          });
        }
      } else if (layerId === 'route-lines-hit') {
        setPopup({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          type: 'route',
          name: `${feature.properties?.fromName} -> ${feature.properties?.toName}`,
          score: feature.properties?.score ?? 5,
          detail: `${feature.properties?.distance} mi | ${feature.properties?.transitMinutes} min`,
        });
      // Zone hover removed — zones are visual-only, not interactive
      }
    }
  }, [currentActivity, homeBaseId]);

  // --- Sidebar card interactions ---

  const handleCardClick = useCallback((destId: string) => {
    setSelectedDestId(destId);
    setTrajectoryRoute({ originId: homeBaseId, destId });

    // Fly the map to the destination
    if (mapRef.current) {
      const dest = sfBay.destinations.find(d => d.id === destId);
      if (dest) {
        mapRef.current.flyTo({
          center: [dest.lng, dest.lat],
          zoom: 13,
          duration: 1000,
        });
      }
    }

    // On mobile, close sidebar when card is tapped
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [homeBaseId]);

  const handleCardHover = useCallback((destId: string | null) => {
    setHoveredDestId(destId);
  }, []);

  // Wind/wave display helper for scored routes
  const getConditionsSummary = (route: ScoredRouteWithDest) => {
    const hasRisk = route.riskFactors.length > 0;
    const windRisk = route.riskFactors.find(r => r.factor.toLowerCase().includes('wind'));
    const waveRisk = route.riskFactors.find(r => r.factor.toLowerCase().includes('wave'));
    return {
      hasRisk,
      windLabel: windRisk ? windRisk.description.match(/(\d+)\s*(?:kts?|knots?)/i)?.[1] + 'kt' : null,
      waveLabel: waveRisk ? waveRisk.description.match(/(\d+\.?\d*)\s*ft/i)?.[1] + 'ft' : null,
    };
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Mobile: toggle button for sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden absolute top-3 left-3 z-30 bg-ocean-900/90 backdrop-blur-md text-ocean-100 px-3 py-2 rounded-lg border border-ocean-700/50 text-sm font-medium shadow-lg"
        >
          {sidebarOpen ? 'Show Map' : `Destinations (${scoredRoutes.length})`}
        </button>

        {/* Sidebar */}
        <div
          ref={sidebarRef}
          className={`
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
            md:translate-x-0
            absolute md:relative z-20
            w-full md:w-[360px] lg:w-[380px]
            h-full
            bg-[var(--background)]
            border-r border-[var(--border)]
            flex flex-col
            transition-transform duration-200 ease-out
            shrink-0
          `}
        >
          {/* Sidebar header: Activity + Home Base */}
          <div className="p-3 border-b border-[var(--border)] space-y-2 shrink-0 bg-[var(--card)]">
            {/* Activity selector */}
            <div className="flex gap-1">
              {activities.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setActivity(a.id)}
                  className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    activity === a.id
                      ? 'bg-reef-teal text-white shadow-sm'
                      : 'bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:border-reef-teal/50'
                  }`}
                >
                  {a.icon} {a.name}
                </button>
              ))}
            </div>

            {/* Home base selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--muted)] shrink-0">From:</span>
              <select
                value={homeBaseId}
                onChange={(e) => setHomeBase(e.target.value)}
                className="flex-1 bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg px-2 py-1.5 text-sm text-[var(--foreground)] appearance-none cursor-pointer focus:border-compass-gold focus:outline-none"
              >
                {sfBay.destinations.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Month selector */}
            <div className="flex gap-0.5 overflow-x-auto">
              {MONTHS.map((m, i) => (
                <button
                  key={i}
                  onClick={() => setMonth(i)}
                  className={`flex-1 min-w-[28px] px-0.5 py-1.5 rounded text-[11px] font-medium transition-colors ${
                    month === i
                      ? 'bg-compass-gold text-ocean-950'
                      : 'text-[var(--muted)] hover:bg-[var(--card-elevated)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Data source toggle: Historical vs Live */}
          <div className="px-3 py-1.5 border-b border-[var(--border)] shrink-0">
            <div className="flex gap-1">
              <button
                onClick={() => setUseLiveData(false)}
                className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  !useLiveData
                    ? 'bg-compass-gold/20 text-compass-gold border border-compass-gold/30'
                    : 'text-[var(--muted)] hover:bg-[var(--card-elevated)]'
                }`}
              >
                Typical for {MONTHS[month]}
              </button>
              <button
                onClick={() => setUseLiveData(true)}
                className={`flex-1 px-2 py-1 rounded text-[10px] font-medium transition-colors ${
                  useLiveData
                    ? 'bg-reef-teal/20 text-reef-teal border border-reef-teal/30'
                    : 'text-[var(--muted)] hover:bg-[var(--card-elevated)]'
                }`}
              >
                {forecastLoading ? 'Loading...' : "This Week's Forecast"}
              </button>
            </div>
          </div>

          {/* Current conditions bar */}
          <ConditionsBar />

          {/* Score summary bar */}
          <div className="px-3 py-2 border-b border-[var(--border)] bg-[var(--card-elevated)] shrink-0">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--muted)]">
                {currentActivity.icon} {currentActivity.name} · {useLiveData ? 'Live' : MONTHS[month]} · {timeLabel}
              </span>
              <span className="text-reef-teal font-medium">
                {scoredRoutes.filter(r => r.score >= 7).length}/{scoredRoutes.length} good
              </span>
            </div>
            {useLiveData && forecastSources.length > 0 && (
              <div className="text-[9px] text-[var(--muted)] mt-0.5">
                Sources: {forecastSources.join(' · ')}
              </div>
            )}
          </div>

          {/* Scrollable destination list */}
          <div className="flex-1 overflow-y-auto">
            {/* Best This Week banner — shown when live forecast is active */}
            {useLiveData && bestForecastDay && (
              <div className="p-3 bg-reef-teal/10 border border-reef-teal/30 rounded-lg mx-2 mt-2">
                <h3 className="text-xs font-medium text-reef-teal uppercase tracking-wider">Best This Week</h3>
                <p className="text-sm font-semibold mt-1">
                  {bestForecastDay.dayLabel} {bestForecastDay.timeLabel} — {bestForecastDay.score}/10 at {bestForecastDay.destName}
                </p>
                <p className="text-xs text-[var(--muted)] mt-0.5">
                  {bestForecastDay.description}
                </p>
              </div>
            )}

            {/* Activity Advisor — "What should I do?" at the TOP */}
            <div className="p-2 pb-0">
              <ActivityAdvisor />
            </div>

            {/* Bad conditions guidance */}
            {scoredRoutes.length > 0 && scoredRoutes.every(r => r.score < 5) && (
              <div className="mx-2 mt-2 p-3 bg-danger-red/10 border border-danger-red/30 rounded-lg space-y-2">
                <p className="text-xs font-medium text-danger-red">
                  Tough conditions for {currentActivity.name.toLowerCase()} right now
                </p>
                <p className="text-[11px] text-[var(--secondary)]">
                  {MONTHS[month]} isn't ideal for this activity. Try:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {[8, 9, 3, 4].filter(m => m !== month).slice(0, 3).map(m => (
                    <button
                      key={m}
                      onClick={() => setMonth(m)}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-[var(--card-elevated)] text-reef-teal border border-reef-teal/30 hover:bg-reef-teal/10 transition-colors"
                    >
                      Try {MONTHS[m]}
                    </button>
                  ))}
                  {hour > 12 && (
                    <button
                      onClick={() => setHour(9)}
                      className="px-2 py-1 rounded text-[10px] font-medium bg-[var(--card-elevated)] text-compass-gold border border-compass-gold/30 hover:bg-compass-gold/10 transition-colors"
                    >
                      Try morning
                    </button>
                  )}
                </div>
                <a href="/planner" className="block text-[10px] text-reef-teal hover:underline">
                  See year planner for best months →
                </a>
              </div>
            )}

            <div className="p-2 space-y-1.5">
              {scoredRoutes.map((route, i) => {
                const isSelected = selectedDestId === route.destinationId;
                const isHovered = hoveredDestId === route.destinationId;
                const conditions = getConditionsSummary(route);

                return (
                  <div
                    key={route.destinationId}
                    ref={(el) => {
                      if (el) cardRefs.current.set(route.destinationId, el);
                    }}
                    onClick={() => handleCardClick(route.destinationId)}
                    onMouseEnter={() => handleCardHover(route.destinationId)}
                    onMouseLeave={() => handleCardHover(null)}
                    className={`
                      rounded-lg p-3 cursor-pointer transition-all border
                      ${isSelected
                        ? 'border-reef-teal bg-reef-teal/10 shadow-md shadow-reef-teal/10'
                        : isHovered
                          ? 'border-[var(--border)] bg-[var(--card-elevated)]'
                          : 'border-transparent bg-[var(--card)] hover:bg-[var(--card-elevated)]'
                      }
                      ${!route.inRange ? 'opacity-50' : ''}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank number */}
                      <span className="text-xs font-bold text-[var(--muted)] w-4 text-right shrink-0">
                        {i + 1}
                      </span>

                      {/* Score badge */}
                      <div className="shrink-0">
                        <ScoreBadge score={route.score} size="sm" />
                      </div>

                      {/* Destination info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-1">
                          <h3 className="text-sm font-semibold truncate">
                            {route.dest.name}
                          </h3>
                          <span className="text-[10px] text-[var(--muted)] shrink-0">
                            {getScoreLabel(route.score)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-[var(--muted)]">
                          <span>{route.distance} mi</span>
                          <span>·</span>
                          <span>{route.transitMinutes} min</span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-[var(--secondary)] flex-wrap">
                          {(() => {
                            const zone = sfBay.zones.find(z => z.id === route.dest.zone);
                            if (!zone) return null;
                            const cond = getTimeConditions(zone, Math.floor(hour), month);
                            const windDesc = describeWind(cond.windKts);
                            const waveDesc = describeWaves(cond.waveHtFt, cond.wavePeriodS);
                            return (
                              <>
                                <span
                                  className={windDesc.severity === 'dangerous' ? 'text-danger-red' : windDesc.severity === 'strong' ? 'text-compass-gold' : ''}
                                  title={windDesc.text}
                                >
                                  {windDesc.emoji} {cond.windKts}kt
                                </span>
                                <span
                                  className={waveDesc.severity === 'dangerous' ? 'text-danger-red' : waveDesc.severity === 'rough' ? 'text-compass-gold' : ''}
                                  title={waveDesc.text}
                                >
                                  {waveDesc.emoji} {cond.waveHtFt}ft
                                </span>
                                {cond.waterTempF && <span title={`Water: ${cond.waterTempF}\u00B0F`}>{'\u{1F321}\uFE0F'} {cond.waterTempF}&deg;F</span>}
                              </>
                            );
                          })()}
                        </div>
                        {/* High-severity warning icon only — details in trajectory panel */}
                        {route.riskFactors.some(r => r.severity === 'high') && (
                          <span className="text-[10px] text-danger-red mt-0.5">⚠ Conditions warning</span>
                        )}
                      </div>
                    </div>

                    {/* Out of range indicator */}
                    {!route.inRange && (
                      <div className="mt-1 ml-7 text-[10px] text-danger-red">Out of range</div>
                    )}
                  </div>
                );
              })}

              {scoredRoutes.length === 0 && (
                <div className="text-center py-8 px-4 space-y-3">
                  <p className="text-sm text-[var(--muted)]">
                    No destinations for {currentActivity.name.toLowerCase()} from {origin.name}
                  </p>
                  <p className="text-xs text-[var(--secondary)]">
                    Try a different activity, change your departure point, or adjust the time.
                  </p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {activities.filter(a => a.id !== activity).slice(0, 2).map(a => (
                      <button
                        key={a.id}
                        onClick={() => setActivity(a.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--card-elevated)] text-[var(--secondary)] border border-[var(--border)] hover:border-reef-teal transition-colors"
                      >
                        Try {a.icon} {a.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Before You Go (collapsible) */}
            <div className="border-t border-[var(--border)]">
              <button
                onClick={() => setBeforeYouGoOpen(!beforeYouGoOpen)}
                className="w-full px-4 py-3 text-left flex items-center justify-between text-sm font-medium text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors"
              >
                <span>Before You Go - {currentActivity.name}</span>
                <span className="text-xs text-[var(--muted)]">{beforeYouGoOpen ? '−' : '+'}</span>
              </button>
              {beforeYouGoOpen && (
                <div className="px-4 pb-4 space-y-0">
                  {currentActivity.beforeYouGo.map((item, i) => (
                    <label
                      key={i}
                      className="flex items-center gap-2 py-2 cursor-pointer border-b border-[var(--border)] last:border-b-0 group"
                    >
                      <input
                        type="checkbox"
                        className="w-3.5 h-3.5 rounded accent-reef-teal shrink-0"
                      />
                      <span className="text-xs text-[var(--secondary)] group-hover:text-[var(--foreground)] transition-colors flex-1">
                        {item.text}
                      </span>
                      {item.url && (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-safety-blue text-[10px] hover:underline shrink-0"
                        >
                          Link
                        </a>
                      )}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Links to other pages */}
            <div className="border-t border-[var(--border)] p-3">
              <div className="flex gap-2">
                <Link
                  href="/explore"
                  className="flex-1 text-center py-2 rounded-lg border border-compass-gold/50 text-compass-gold text-xs font-medium hover:bg-compass-gold/10 transition-colors"
                >
                  Full-screen map
                </Link>
                <Link
                  href="/schedule"
                  className="flex-1 text-center py-2 rounded-lg border border-reef-teal/50 text-reef-teal text-xs font-medium hover:bg-reef-teal/10 transition-colors"
                >
                  Departure board
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Map area */}
        <div className="flex-1 relative">
          {hasMapToken ? (
            <>
              <link
                rel="stylesheet"
                href="https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css"
              />
              <MapGL
                ref={mapRef}
                mapboxAccessToken={MAPBOX_TOKEN}
                initialViewState={{
                  longitude: sfBay.center[1],
                  latitude: sfBay.center[0],
                  zoom: sfBay.defaultZoom,
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/dark-v11"
                interactiveLayerIds={['destination-circles', 'destination-labels', 'origin-circle', 'route-lines-hit']}
                onClick={onMapClick}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
                onMouseMove={onMouseMove}
                onLoad={onMapLoad}
                cursor={cursor}
              >
                <NavigationControl position="bottom-right" />

                {/* Bathymetry depth overlay (behind zone overlay) */}
                <Source id="bathymetry" type="geojson" data={bathymetryGeoJSON}>
                  <Layer {...bathymetryFillLayer} />
                </Source>

                {/* Zone heat overlay (behind routes/markers, above bathymetry) */}
                <Source id="zones" type="geojson" data={zoneOverlayGeoJSON}>
                  <Layer {...zoneFillLayer} />
                  <Layer {...zoneBorderLayer} />
                </Source>

                {/* Route lines */}
                <Source id="routes" type="geojson" data={routesGeoJSON}>
                  <Layer {...routeLineLayer} />
                  <Layer {...routeHitLayer} />
                </Source>

                {/* Destination markers */}
                <Source id="destinations" type="geojson" data={destinationsGeoJSON}>
                  <Layer {...originRingLayer} />
                  <Layer {...originCircleLayer} />
                  <Layer {...originNameLayer} />
                  <Layer {...destinationCircleLayer} />
                  <Layer {...destinationLabelLayer} />
                </Source>

                {/* Popup on hover */}
                {popup && (
                  <Popup
                    longitude={popup.lng}
                    latitude={popup.lat}
                    anchor="bottom"
                    closeButton={false}
                    closeOnClick={false}
                    offset={12}
                    maxWidth="260px"
                    className="[&_.mapboxgl-popup-content]:!bg-ocean-900 [&_.mapboxgl-popup-content]:!text-ocean-50 [&_.mapboxgl-popup-content]:!rounded-lg [&_.mapboxgl-popup-content]:!p-3 [&_.mapboxgl-popup-content]:!shadow-xl [&_.mapboxgl-popup-tip]:!border-t-ocean-900"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <ScoreBadge score={popup.score} size="sm" />
                        <span className="font-medium text-sm">{popup.name}</span>
                      </div>
                      <p className="text-xs text-ocean-300">{popup.detail}</p>
                    </div>
                  </Popup>
                )}
              </MapGL>
            </>
          ) : (
            /* Fallback when no Mapbox token */
            <div className="w-full h-full flex items-center justify-center bg-[var(--card)]">
              <div className="text-center space-y-3 p-8 max-w-sm">
                <div className="text-4xl">🗺</div>
                <h2 className="text-lg font-bold">Map Available Soon</h2>
                <p className="text-sm text-[var(--muted)]">
                  Add a Mapbox token to <code className="text-compass-gold">.env.local</code> to enable the interactive map.
                </p>
                <pre className="bg-[var(--card-elevated)] border border-[var(--border)] rounded-lg p-3 text-xs text-left">
                  NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_token
                </pre>
                <p className="text-xs text-[var(--muted)]">
                  Scores and rankings in the sidebar work without a map.
                </p>
              </div>
            </div>
          )}

          {/* Time slider at bottom of map — color-gradient background */}
          <div className="absolute bottom-4 left-4 right-4 pointer-events-auto z-10">
            <div className="bg-ocean-900/90 backdrop-blur-md rounded-xl px-4 py-3 border border-ocean-700/50 shadow-xl">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ocean-300">Time of Day</span>
                <span className="text-sm font-medium text-compass-gold">{timeLabel}</span>
              </div>
              <div className="relative">
                {/* Gradient track background */}
                <div
                  className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 rounded-full"
                  style={{ background: sliderGradient }}
                />
                {/* Range input on top */}
                <input
                  type="range"
                  min={5}
                  max={22}
                  step={0.25}
                  value={hour}
                  onChange={(e) => setHour(parseFloat(e.target.value))}
                  className="relative w-full appearance-none bg-transparent cursor-pointer z-10
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2
                    [&::-webkit-slider-thumb]:border-compass-gold [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-compass-gold
                    [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:bg-transparent
                    [&::-moz-range-track]:h-2 [&::-moz-range-track]:bg-transparent"
                />
              </div>
              {/* Mini comfort chart with scores at key hours */}
              <div className="flex justify-between mt-1.5 px-0.5">
                {comfortKeyHours.map(({ hour: h, label, score }) => (
                  <div key={h} className="flex flex-col items-center">
                    <span className="text-[10px] text-ocean-400">{label}</span>
                    <span
                      className="text-[10px] font-bold"
                      style={{ color: scoreToColor(score) }}
                    >
                      {score}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Trajectory panel (slides in from right) */}
      {trajectoryRoute && (
        <TrajectoryPanel
          originId={trajectoryRoute.originId}
          destinationId={trajectoryRoute.destId}
          onClose={() => {
            setTrajectoryRoute(null);
            setSelectedDestId(null);
          }}
        />
      )}
    </div>
  );
}
