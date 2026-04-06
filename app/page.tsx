'use client';

import { useRef, useCallback, useState, useMemo, useEffect } from 'react';
import { sfBay } from '@/data/cities/sf-bay';
import { useAppStore } from '@/store';
import { haversineDistanceMi } from '@/engine/scoring';
import { getActivity } from '@/data/activities';
import { verifiedRoutes } from '@/data/cities/sf-bay/verified-routes';
import { useDestinationGeoJSON, useRouteGeoJSON, useHazardGeoJSON } from '@/hooks/useMapData';
import { ferryRoutesGeoJSON } from '@/data/geo/sf-bay-ferry-routes';
import { Header } from './components/Header';
import { TrajectoryPanel } from './components/TrajectoryPanel';
import { Onboarding } from './components/Onboarding';
import { Sidebar } from './components/Sidebar';
import { MapContainer } from './components/MapContainer';
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
  const [showNauticalChart, setShowNauticalChart] = useState(false);
  const [showFerryRoutes, setShowFerryRoutes] = useState(false);
  const [showHazards, setShowHazards] = useState(false);
  const [hideShallow, setHideShallow] = useState(false);
  const ferryGeoJSON = useMemo(() => ferryRoutesGeoJSON(), []);

  const mapRef = useRef<any>(null);

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
    const currentActivity = getActivity(activity);

    return sfBay.destinations
      .filter((d) => d.id !== origin.id && d.activityTags.includes(activity))
      .map((dest) => {
        const key = `${origin.id}-${dest.id}`;
        const revKey = `${dest.id}-${origin.id}`;
        const matrixDist = sfBay.distances[key] ?? sfBay.distances[revKey];
        const distance = matrixDist ?? Math.round(haversineDistanceMi(origin.lat, origin.lng, dest.lat, dest.lng) * 10) / 10;
        const transitMinutes = vessel.cruiseSpeed > 0 ? Math.round((distance / vessel.cruiseSpeed) * 60) : 0;

        return {
          dest,
          distance,
          transitMinutes,
          destinationId: dest.id,
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
        />

        <MapContainer
          mapRef={mapRef}
          destinationsGeoJSON={destinationsGeoJSON}
          routesGeoJSON={routesGeoJSON}
          ferryGeoJSON={ferryGeoJSON}
          hazardsGeoJSON={hazardsGeoJSON}
          showNauticalChart={showNauticalChart}
          setShowNauticalChart={setShowNauticalChart}
          showFerryRoutes={showFerryRoutes}
          setShowFerryRoutes={setShowFerryRoutes}
          showHazards={showHazards}
          setShowHazards={setShowHazards}
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

      {/* First-visit onboarding walkthrough */}
      <Onboarding />
    </div>
  );
}
