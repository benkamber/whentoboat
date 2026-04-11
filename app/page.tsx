'use client';

import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { useAppStore } from '@/store';
import { haversineDistanceMi } from '@/engine/scoring';
import { getActivity } from '@/data/activities';
import { verifiedRoutes } from '@/data/cities/sf-bay/verified-routes';
import { useDestinationGeoJSON, useRouteGeoJSON, useHazardGeoJSON, useEventGeoJSON, useSupRadiusGeoJSON } from '@/hooks/useMapData';
import { useZoneOverlayGeoJSON, useWindArrowsGeoJSON } from '@/hooks/useZoneOverlayGeoJSON';
import { useCurrentFlowGeoJSON } from '@/hooks/useCurrentFlowGeoJSON';
import { ferryRoutesGeoJSON } from '@/data/geo/sf-bay-ferry-routes';
import { routeComfort, type ComfortTier } from '@/lib/route-comfort';
import { routeDifficulty, type DifficultyRating } from '@/lib/route-difficulty';
import { track } from '@/lib/analytics';
import { Header } from './components/Header';
import { TrajectoryPanel } from './components/TrajectoryPanel';
import { Onboarding } from './components/Onboarding';
import { Sidebar } from './components/Sidebar';
import { MapContainer } from './components/MapContainer';
import { ComparePanel } from './components/ComparePanel';
import type { Destination } from '@/engine/types';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

interface PopupInfo {
  lng: number;
  lat: number;
  type: 'destination' | 'route' | 'hazard';
  name: string;
  detail: string;
}

interface SimplifiedRoute {
  dest: Destination;
  distance: number;
  transitMinutes: number;
  destinationId: string;
  comfort: ComfortTier;
  difficulty: DifficultyRating;
  crossesTss: boolean;
  isValidatedRoute: boolean;
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
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [hoveredDestId, setHoveredDestId] = useState<string | null>(null);
  const [selectedDestId, setSelectedDestId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNauticalChart, setShowNauticalChart] = useState(false);
  const [showFerryRoutes, setShowFerryRoutes] = useState(false);
  const [showHazards, setShowHazards] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const [showZones, setShowZones] = useState(false);
  const [hideShallow, setHideShallow] = useState(false);
  const ferryGeoJSON = useMemo(() => ferryRoutesGeoJSON(), []);

  const mapRef = useRef<any>(null);

  // Resolve the saved origin against the current city data. If a stale
  // localStorage value points at a destination that no longer exists
  // (e.g., we removed a slug between deploys), we silently fall through
  // to the first destination here AND fire the recovery effect below.
  const resolvedOrigin = sfBay.destinations.find((d) => d.id === homeBaseId);
  const origin = resolvedOrigin ?? sfBay.destinations[0];

  // Sync selectedOriginId with homeBaseId
  useEffect(() => {
    if (selectedOriginId !== homeBaseId) {
      setSelectedOrigin(homeBaseId);
    }
    // Only run when homeBaseId changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [homeBaseId]);

  // Recover from stale homeBaseId — if the persisted value points at a
  // destination that no longer exists in the city data, reset it to the
  // canonical default rather than letting it limp along on the silent
  // fallback to destinations[0]. Tracked so we can measure how often
  // schema drift hits real users.
  useEffect(() => {
    if (!resolvedOrigin && homeBaseId) {
      console.warn(`Stale homeBaseId "${homeBaseId}" — resetting to default`);
      track('origin_selected', { origin_id: 'sau', source: 'recovery' });
      setHomeBase('sau');
    }
  }, [resolvedOrigin, homeBaseId, setHomeBase]);

  // Fly map to origin when it changes
  useEffect(() => {
    if (!mapRef.current || !resolvedOrigin) return;
    const isOcean = resolvedOrigin.zone.startsWith('ocean');
    mapRef.current.flyTo({
      center: [resolvedOrigin.lng, resolvedOrigin.lat],
      zoom: isOcean ? 8 : sfBay.defaultZoom,
      duration: 800,
    });
  }, [homeBaseId, resolvedOrigin]);

  // Destinations sorted by distance — static planning tool, no scoring
  const scoredRoutes = useMemo((): SimplifiedRoute[] => {
    const currentActivity = getActivity(activity);

    return sfBay.destinations
      .filter((d) => d.id !== origin.id && d.activityTags.includes(activity))
      .map((dest) => {
        const key = `${origin.id}-${dest.id}`;
        const revKey = `${dest.id}-${origin.id}`;
        const matrixDist = sfBay.distances[key] ?? sfBay.distances[revKey];
        const distance = matrixDist ?? Math.round(haversineDistanceMi(origin.lat, origin.lng, dest.lat, dest.lng) * 10) / 10;
        const transitMinutes = vessel.cruiseSpeed > 0 ? Math.round((distance / vessel.cruiseSpeed) * 60) : 0;

        const vr = verifiedRoutes.find(r =>
          (r.from === origin.id && r.to === dest.id) ||
          (r.to === origin.id && r.from === dest.id)
        );

        return {
          dest,
          distance,
          transitMinutes,
          destinationId: dest.id,
          comfort: routeComfort(distance, vessel, currentActivity, dest.minDepth),
          difficulty: routeDifficulty(distance, dest.id, vessel, currentActivity, month, hour),
          crossesTss: vr?.crossesTss ?? false,
          isValidatedRoute: !!vr,
        };
      })
      .filter((route) => {
        // Enforce max range for human-powered craft
        if (currentActivity.maxRangeRoundTripMi !== null) {
          if (route.distance * 2 > currentActivity.maxRangeRoundTripMi) return false;
        }

        // Activities that cannot cross shipping lanes (kayak, SUP)
        if (!currentActivity.requiresOpenWaterCrossing) {
          const vr = verifiedRoutes.find(r =>
            (r.from === origin.id && r.to === route.destinationId) ||
            (r.to === origin.id && r.from === route.destinationId)
          );
          if (vr?.crossesTss) return false;
        }

        return true;
      })
      .sort((a, b) => a.distance - b.distance);
  }, [activity, vessel, origin]);

  const hasMapToken = !!(MAPBOX_TOKEN && MAPBOX_TOKEN !== 'pk.your_token_here');

  // Map data hooks
  const destinationsGeoJSON = useDestinationGeoJSON(activity, month, hour, vessel, homeBaseId);
  const routesGeoJSON = useRouteGeoJSON(activity, month, hour, vessel, homeBaseId, selectedDestId);
  const hazardsGeoJSON = useHazardGeoJSON();
  const eventsGeoJSON = useEventGeoJSON(month, activity);
  const zoneOverlayGeoJSON = useZoneOverlayGeoJSON();
  const windArrowsGeoJSON = useWindArrowsGeoJSON();
  const supRadiusGeoJSON = useSupRadiusGeoJSON(activity, homeBaseId);
  const currentFlowGeoJSON = useCurrentFlowGeoJSON();

  // --- Map callbacks ---

  const onMapLoad = useCallback(() => {
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
          track('origin_selected', { origin_id: id, source: 'map' });
          setHomeBase(id);
          setSelectedDestId(null);
          setTrajectoryRoute(null);
        }
        setPopup(null);
      } else if (layerId === 'route-lines-hit') {
        const fromId = feature.properties?.fromId;
        const toId = feature.properties?.toId;
        if (fromId && toId) {
          const route = scoredRoutes.find(r => r.destinationId === toId);
          if (route) {
            track('destination_opened', {
              destination_id: toId,
              destination_name: route.dest.name,
              distance_mi: route.distance,
              transit_min: route.transitMinutes,
              comfort_tier: route.comfort,
              crosses_tss: route.crossesTss,
              is_validated_route: route.isValidatedRoute,
              activity,
              origin_id: fromId,
              source: 'map',
            });
          }
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
  }, [homeBaseId, setHomeBase, scoredRoutes, activity]);

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
      } else if (layerId === 'hazard-markers') {
        const props = feature.properties;
        setPopup({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          type: 'hazard',
          name: props?.name,
          detail: props?.description,
        });
      }
    }
  }, [homeBaseId]);

  // --- Sidebar card interactions ---

  const handleCardClick = useCallback((destId: string) => {
    const route = scoredRoutes.find(r => r.destinationId === destId);
    if (route) {
      const fuelRT = vessel.gph && vessel.cruiseSpeed > 0
        ? (route.distance * 2 / vessel.cruiseSpeed) * vessel.gph
        : null;
      const hasFuelWarning = !!(fuelRT && vessel.fuelCapacity && fuelRT > vessel.fuelCapacity * 0.8);
      const hasDepthWarning = !!(route.dest.minDepth !== null && route.dest.minDepth < vessel.draft + 1);

      track('destination_opened', {
        destination_id: destId,
        destination_name: route.dest.name,
        distance_mi: route.distance,
        transit_min: route.transitMinutes,
        comfort_tier: route.comfort,
        crosses_tss: route.crossesTss,
        is_validated_route: route.isValidatedRoute,
        has_fuel_warning: hasFuelWarning,
        has_depth_warning: hasDepthWarning,
        activity,
        origin_id: homeBaseId,
        source: 'sidebar',
      });
    }

    setSelectedDestId(destId);
    setTrajectoryRoute({ originId: homeBaseId, destId });

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
  }, [homeBaseId, scoredRoutes, vessel, activity]);

  const handleCardHover = useCallback((destId: string | null) => {
    setHoveredDestId(destId);
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <Header />

      <div id="main-content" className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Mobile: toggle button for sidebar */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden absolute top-3 left-3 z-30 bg-ocean-900/90 backdrop-blur-md text-ocean-100 px-3 py-2 rounded-lg border border-ocean-700/50 text-sm font-medium shadow-lg"
          aria-label={sidebarOpen ? 'Show map view' : `Show ${scoredRoutes.length} destinations`}
        >
          {sidebarOpen ? 'Show Map' : `Destinations (${scoredRoutes.length})`}
        </button>

        <Sidebar
          activity={activity}
          setActivity={setActivity}
          homeBaseId={homeBaseId}
          setHomeBase={setHomeBase}
          vessel={vessel}
          destinations={scoredRoutes}
          onCardClick={handleCardClick}
          onCardHover={handleCardHover}
          selectedDestId={selectedDestId}
          hoveredDestId={hoveredDestId}
          hideShallow={hideShallow}
          setHideShallow={setHideShallow}
          sidebarOpen={sidebarOpen}
          compareIds={compareIds}
          onCompareToggle={(destId) => {
            setCompareIds(prev =>
              prev.includes(destId)
                ? prev.filter(id => id !== destId)
                : prev.length >= 3 ? prev : [...prev, destId]
            );
          }}
        />

        <MapContainer
          mapRef={mapRef}
          destinationsGeoJSON={destinationsGeoJSON}
          routesGeoJSON={routesGeoJSON}
          ferryGeoJSON={ferryGeoJSON}
          hazardsGeoJSON={hazardsGeoJSON}
          eventsGeoJSON={eventsGeoJSON}
          zoneOverlayGeoJSON={zoneOverlayGeoJSON}
          windArrowsGeoJSON={windArrowsGeoJSON}
          supRadiusGeoJSON={supRadiusGeoJSON}
          currentFlowGeoJSON={currentFlowGeoJSON}
          showNauticalChart={showNauticalChart}
          setShowNauticalChart={setShowNauticalChart}
          showFerryRoutes={showFerryRoutes}
          setShowFerryRoutes={setShowFerryRoutes}
          showHazards={showHazards}
          setShowHazards={setShowHazards}
          showEvents={showEvents}
          setShowEvents={setShowEvents}
          showZones={showZones}
          setShowZones={setShowZones}
          onMapLoad={onMapLoad}
          onMapClick={onMapClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseMove={onMouseMove}
          cursor={cursor}
          popup={popup}
          hasMapToken={hasMapToken}
          mapboxToken={MAPBOX_TOKEN}
        />
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

      {/* Destination comparison panel */}
      {compareIds.length >= 2 && (
        <ComparePanel
          destIds={compareIds}
          originId={homeBaseId}
          onClose={() => setCompareIds([])}
        />
      )}

      {/* First-visit onboarding walkthrough */}
      <Onboarding />
    </div>
  );
}
