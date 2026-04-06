'use client';

import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { sfBay } from '@/data/cities/sf-bay';
import { activities, getActivity } from '@/data/activities';
import { useAppStore } from '@/store';
import { haversineDistanceMi } from '@/engine/scoring';
import { useDestinationGeoJSON, useRouteGeoJSON } from '@/hooks/useMapData';
import { ferryRoutesGeoJSON } from '@/data/geo/sf-bay-ferry-routes';
import { Header } from './components/Header';
import { TrajectoryPanel } from './components/TrajectoryPanel';
import { BoatSelector } from './components/BoatSelector';
import { MapErrorBoundary } from './components/MapErrorBoundary';
import { Onboarding } from './components/Onboarding';
import { getDocksForDestination } from '@/data/cities/sf-bay/docks';
import { parseMinDepthFt } from '@/lib/depth-parse';
import type { Destination } from '@/engine/types';

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
    'line-color': '#22d3ee' as any,
    'line-width': 2 as any,
    'line-opacity': 0.5 as any,
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
    'circle-color': '#14b8a6' as any,
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

// Name labels near destination circles (non-origin)
const destinationLabelLayer = {
  id: 'destination-labels',
  type: 'symbol' as const,
  filter: ['!', ['get', 'isOrigin']] as any,
  layout: {
    'text-field': ['get', 'name'] as any,
    'text-size': 9,
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
    'text-anchor': 'top' as const,
    'text-offset': [0, 1.2] as any,
    'text-allow-overlap': false,
    'text-ignore-placement': false,
  },
  paint: {
    'text-color': '#ffffff',
    'text-halo-color': '#0a1628',
    'text-halo-width': 1,
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

// Ferry routes + shipping lanes overlay
const ferryLineLayer = {
  id: 'ferry-routes',
  type: 'line' as const,
  paint: {
    'line-color': ['get', 'color'] as any,
    'line-width': ['get', 'lineWidth'] as any,
    'line-opacity': ['get', 'opacity'] as any,
    'line-dasharray': [4, 4] as any,
  },
};

const ferryLabelLayer = {
  id: 'ferry-labels',
  type: 'symbol' as const,
  layout: {
    'symbol-placement': 'line' as const,
    'text-field': ['get', 'name'] as any,
    'text-size': 10,
    'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'] as any,
    'text-offset': [0, -0.8] as any,
    'text-allow-overlap': false,
  },
  paint: {
    'text-color': '#ef4444',
    'text-halo-color': '#0a1628',
    'text-halo-width': 1,
  },
};

interface PopupInfo {
  lng: number;
  lat: number;
  type: 'destination' | 'route';
  name: string;
  detail: string;
}

interface SimplifiedRoute {
  dest: Destination;
  distance: number;
  transitMinutes: number;
  destinationId: string;
}

export default function Home() {
  const {
    activity, month, hour, vessel, homeBaseId,
    selectedOriginId,
    setActivity, setHomeBase,
    setSelectedOrigin,
  } = useAppStore();

  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [cursor, setCursor] = useState('auto');
  const [trajectoryRoute, setTrajectoryRoute] = useState<{ originId: string; destId: string } | null>(null);
  const [hoveredDestId, setHoveredDestId] = useState<string | null>(null);
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showNauticalChart, setShowNauticalChart] = useState(false);
  const [showFerryRoutes, setShowFerryRoutes] = useState(false);
  const [hideShallow, setHideShallow] = useState(false);
  const ferryGeoJSON = useMemo(() => ferryRoutesGeoJSON(), []);

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

  // Destinations sorted by distance — static planning tool, no scoring
  const scoredRoutes = useMemo((): SimplifiedRoute[] => {
    return sfBay.destinations
      .filter((d) => d.id !== origin.id && d.activityTags.includes(activity))
      .map((dest) => {
        // Use distance matrix if available, otherwise haversine
        const key = `${origin.id}-${dest.id}`;
        const revKey = `${dest.id}-${origin.id}`;
        const matrixDist = sfBay.distances[key] ?? sfBay.distances[revKey];
        const distance = matrixDist ?? Math.round(haversineDistanceMi(origin.lat, origin.lng, dest.lat, dest.lng) * 10) / 10;
        const transitMinutes = Math.round((distance / vessel.cruiseSpeed) * 60);

        return {
          dest,
          distance,
          transitMinutes,
          destinationId: dest.id,
        };
      })
      .sort((a, b) => a.distance - b.distance);
  }, [activity, vessel, origin]);

  const hasMapToken = MAPBOX_TOKEN && MAPBOX_TOKEN !== 'pk.your_token_here';

  // Map data hooks
  const destinationsGeoJSON = useDestinationGeoJSON(activity, month, hour, vessel, homeBaseId);
  const routesGeoJSON = useRouteGeoJSON(activity, month, hour, vessel, homeBaseId, selectedDestId);

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
        if (dest) {
          const isOrigin = dest.id === homeBaseId;
          const depthInfo = dest.minDepth !== null ? ` · Depth: ${dest.minDepth}ft+` : '';
          setPopup({
            lng: dest.lng,
            lat: dest.lat,
            type: 'destination',
            name: dest.name,
            detail: isOrigin
              ? `Home base · ${dest.dockInfo}${depthInfo}`
              : `${dest.dockInfo}${depthInfo}`,
          });
        }
      } else if (layerId === 'route-lines-hit') {
        setPopup({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          type: 'route',
          name: `${feature.properties?.fromName} -> ${feature.properties?.toName}`,
          detail: `${feature.properties?.distance} mi | ${feature.properties?.transitMinutes} min`,
        });
      }
    }
  }, [homeBaseId]);

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
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [homeBaseId]);

  const handleCardHover = useCallback((destId: string | null) => {
    setHoveredDestId(destId);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Mobile: toggle button for sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden absolute top-3 left-3 z-30 bg-ocean-900/90 backdrop-blur-md text-ocean-100 px-3 py-2 rounded-lg border border-ocean-700/50 text-sm font-medium shadow-lg"
          aria-label={sidebarOpen ? 'Show map view' : `Show ${scoredRoutes.length} destinations`}
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
                {sfBay.destinations
                  .filter((d) => d.launchRamp != null && d.id !== 'ggb')
                  .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel selector — inline preset picker + customize */}
            <BoatSelector />

            {vessel.draft > 1 && (
              <label className="flex items-center gap-2 px-1 text-xs text-[var(--muted)] cursor-pointer select-none">
                <input type="checkbox" checked={hideShallow} onChange={(e) => setHideShallow(e.target.checked)} className="rounded accent-reef-teal" />
                Hide too-shallow for {vessel.draft}ft draft
              </label>
            )}
            {hideShallow && (
              <div className="text-[10px] text-warning-amber px-2">
                {scoredRoutes.filter(r => {
                  if (r.dest.minDepth !== null && r.dest.minDepth < vessel.draft + 1) return true;
                  return getDocksForDestination(r.destinationId).some(d => {
                    const p = parseMinDepthFt(d.depthFt);
                    return p !== null && p < vessel.draft + 1;
                  });
                }).length} hidden (too shallow)
              </div>
            )}

          </div>

          {/* Scrollable destination list */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-2 space-y-1.5">
              {scoredRoutes.map((route, i) => {
                const isSelected = selectedDestId === route.destinationId;
                const isHovered = hoveredDestId === route.destinationId;

                const isTooShallow = (() => {
                  if (route.dest.minDepth !== null && route.dest.minDepth < vessel.draft + 1) return true;
                  const dockList = getDocksForDestination(route.destinationId);
                  return dockList.some(d => {
                    const parsed = parseMinDepthFt(d.depthFt);
                    return parsed !== null && parsed < vessel.draft + 1;
                  });
                })();

                if (hideShallow && isTooShallow) return null;

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
                      ${isTooShallow ? 'opacity-40' : ''}
                      ${isSelected
                        ? 'border-reef-teal bg-reef-teal/10 shadow-md shadow-reef-teal/10'
                        : isHovered
                          ? 'border-[var(--border)] bg-[var(--card-elevated)]'
                          : 'border-transparent bg-[var(--card)] hover:bg-[var(--card-elevated)]'
                      }
                    `}
                  >
                    <div className="flex items-center gap-3">
                      {/* Rank number */}
                      <span className="text-xs font-bold text-[var(--muted)] w-4 text-right shrink-0">
                        {i + 1}
                      </span>

                      {/* Destination info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold truncate">
                          {route.dest.name}
                        </h3>
                        <div className="text-[11px] text-[var(--muted)]">
                          {route.distance < 0.5 ? '< 1' : route.distance} mi · {route.transitMinutes} min
                        </div>
                        {/* Dock info */}
                        {(() => {
                          const dockList = getDocksForDestination(route.destinationId);
                          if (dockList.length === 0) return null;
                          const dock = dockList[0]; // primary dock
                          return (
                            <div className="text-[10px] text-[var(--muted)] mt-1">
                              {dock.dockType === 'restaurant_dock' ? 'Restaurant dock' :
                               dock.dockType === 'public_guest' ? 'Public guest dock' :
                               dock.dockType === 'state_park' ? 'State park dock' : 'Guest slips'} · {dock.fees}
                              {dock.restrictions.includes('GROUNDING') || dock.restrictions.includes('grounding') ? (
                                <span className="text-warning-amber ml-1">⚠ Shallow</span>
                              ) : null}
                              {(() => {
                                const hasDining = dockList.some(d => d.dineOptions.length > 0);
                                if (!hasDining) return null;
                                const dineCount = dockList.reduce((sum, d) => sum + d.dineOptions.length, 0);
                                return (
                                  <span className="text-[10px] text-reef-teal ml-1">
                                    · {dineCount} restaurant{dineCount !== 1 ? 's' : ''}
                                  </span>
                                );
                              })()}
                            </div>
                          );
                        })()}
                        {/* Draft warning */}
                        {route.dest.minDepth !== null && route.dest.minDepth < vessel.draft + 1 && (
                          <div className="text-[10px] text-warning-amber mt-0.5">
                            ⚠ Shallow — {route.dest.minDepth}ft depth, your draft is {vessel.draft}ft
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {scoredRoutes.length === 0 && (
                <div className="text-center py-8 px-4 space-y-3">
                  <p className="text-sm text-[var(--muted)]">
                    No destinations for {currentActivity.name.toLowerCase()} from {origin.name}
                  </p>
                  <p className="text-xs text-[var(--secondary)]">
                    Try a different activity or change your departure point.
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
          </div>
        </div>

        {/* Map area — wrapped in error boundary for safety */}
        <MapErrorBoundary>
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

                {/* Map layer toggle buttons */}
                <div className="absolute top-3 right-3 z-10 flex gap-1.5">
                  <button
                    onClick={() => setShowNauticalChart(!showNauticalChart)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-colors shadow-lg ${
                      showNauticalChart
                        ? 'bg-safety-blue text-white border border-safety-blue'
                        : 'bg-ocean-900/80 text-ocean-200 border border-ocean-700/50 hover:bg-ocean-800/80'
                    }`}
                    aria-label={showNauticalChart ? 'Hide NOAA nautical chart' : 'Show NOAA nautical chart overlay'}
                    title={showNauticalChart ? 'Hide NOAA chart' : 'Show official NOAA nautical chart'}
                  >
                    {showNauticalChart ? 'Chart ON' : 'Chart'}
                  </button>
                  <button
                    onClick={() => setShowFerryRoutes(!showFerryRoutes)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-colors shadow-lg ${
                      showFerryRoutes
                        ? 'bg-danger-red text-white border border-danger-red'
                        : 'bg-ocean-900/80 text-ocean-200 border border-ocean-700/50 hover:bg-ocean-800/80'
                    }`}
                    title={showFerryRoutes ? 'Hide ferry routes' : 'Show ferry routes & shipping lanes'}
                  >
                    {showFerryRoutes ? 'Ferries ON' : 'Ferries'}
                  </button>
                </div>

                {/* NOAA nautical chart overlay */}
                {showNauticalChart && (
                  <Source
                    id="noaa-chart"
                    type="raster"
                    tiles={[
                      'https://gis.charttools.noaa.gov/arcgis/rest/services/MCS/NOAAChartDisplay/MapServer/exts/MaritimeChartService/WMSServer?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=0,1,2,3,4,5,6,7&STYLES=&SRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&TRANSPARENT=true',
                    ]}
                    tileSize={256}
                  >
                    <Layer
                      id="noaa-chart-layer"
                      type="raster"
                      paint={{ 'raster-opacity': 0.7 }}
                    />
                  </Source>
                )}

                {/* Ferry routes & shipping lanes overlay */}
                {showFerryRoutes && (
                  <Source id="ferry-routes" type="geojson" data={ferryGeoJSON}>
                    <Layer {...ferryLineLayer} />
                    <Layer {...ferryLabelLayer} />
                  </Source>
                )}

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
                      <span className="font-medium text-sm">{popup.name}</span>
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

        </div>
        </MapErrorBoundary>
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

      {/* First-visit onboarding walkthrough */}
      <Onboarding />
    </div>
  );
}
