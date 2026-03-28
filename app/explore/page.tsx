'use client';

import { useRef, useCallback, useState } from 'react';
import Map, { Source, Layer, Popup, NavigationControl } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

import { sfBay } from '@/data/cities/sf-bay';
import { activities } from '@/data/activities';
import { useAppStore } from '@/store';
import { useDestinationGeoJSON, useRouteGeoJSON } from '@/hooks/useMapData';
import { Header } from '../components/Header';
import { ScoreBadge } from '../components/ScoreBadge';
import { TrajectoryPanel } from '../components/TrajectoryPanel';
import { vesselPresets } from '@/data/vessels';
import type { ActivityType } from '@/engine/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

// Mapbox layer styles
const routeLineLayer = {
  id: 'route-lines',
  type: 'line' as const,
  layout: {
    'line-join': 'round' as const,
    'line-cap': 'round' as const,
  },
  paint: {
    'line-color': ['get', 'color'] as any,
    'line-width': ['get', 'lineWidth'] as any,
    'line-opacity': ['get', 'opacity'] as any,
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

const destinationCircleLayer = {
  id: 'destination-circles',
  type: 'circle' as const,
  paint: {
    'circle-radius': ['case', ['get', 'isOrigin'], 10, 7] as any,
    'circle-color': ['get', 'color'] as any,
    'circle-stroke-width': 2,
    'circle-stroke-color': '#0a1628',
    'circle-opacity': 0.9,
  },
};

const destinationLabelLayer = {
  id: 'destination-labels',
  type: 'symbol' as const,
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

interface PopupInfo {
  lng: number;
  lat: number;
  type: 'destination' | 'route';
  name: string;
  score: number;
  detail: string;
}

function ScoreLegend() {
  const [open, setOpen] = useState(true);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-24 left-4 pointer-events-auto w-8 h-8 rounded-full bg-ocean-900/90 backdrop-blur-md border border-ocean-700/50 flex items-center justify-center text-ocean-200 hover:text-white hover:bg-ocean-800/90 transition-colors shadow-lg text-sm font-bold"
        aria-label="Show score legend"
      >
        ?
      </button>
    );
  }

  return (
    <div className="absolute bottom-24 left-4 pointer-events-auto">
      <div className="bg-ocean-900/90 backdrop-blur-md rounded-xl border border-ocean-700/50 shadow-xl p-3.5 w-64">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-semibold text-ocean-100 tracking-wide uppercase">
            Comfort Score (1-10)
          </h3>
          <button
            onClick={() => setOpen(false)}
            className="text-ocean-400 hover:text-ocean-100 transition-colors text-sm leading-none p-0.5"
            aria-label="Close legend"
          >
            ✕
          </button>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-score-8 shrink-0" />
            <span className="text-ocean-100 font-medium">8-10</span>
            <span className="text-ocean-300">Excellent — go for it</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-score-5 shrink-0" />
            <span className="text-ocean-100 font-medium">5-7</span>
            <span className="text-ocean-300">Fair — check conditions</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-score-1 shrink-0" />
            <span className="text-ocean-100 font-medium">1-4</span>
            <span className="text-ocean-300">Poor — not recommended</span>
          </div>
        </div>

        <div className="mt-2.5 pt-2 border-t border-ocean-700/50">
          <p className="text-[10px] text-ocean-400 leading-snug">
            Scores are specific to your activity. Click a destination to see routes from it.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ExplorePage() {
  const mapRef = useRef<MapRef>(null);
  const {
    activity, month, hour, vessel, selectedOriginId,
    setActivity, setMonth, setHour, setSelectedOrigin, setVesselPreset,
  } = useAppStore();
  const [popup, setPopup] = useState<PopupInfo | null>(null);
  const [cursor, setCursor] = useState('auto');
  const [trajectoryRoute, setTrajectoryRoute] = useState<{ originId: string; destId: string } | null>(null);

  const destinationsGeoJSON = useDestinationGeoJSON(activity, month, hour, vessel, selectedOriginId);
  const routesGeoJSON = useRouteGeoJSON(activity, month, hour, vessel, selectedOriginId);

  const timeLabel = hour <= 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`;

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (map) {
      // Custom navy water color
      try {
        map.setPaintProperty('water', 'fill-color', '#0a1628');
      } catch {
        // Style may not have 'water' layer name
      }
    }
  }, []);

  const onMapClick = useCallback((e: any) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const layerId = feature.layer.id;

      if (layerId === 'destination-circles' || layerId === 'destination-labels') {
        const id = feature.properties?.id;
        if (selectedOriginId === id) {
          setSelectedOrigin(null);
        } else {
          setSelectedOrigin(id);
        }
        setPopup(null);
        setTrajectoryRoute(null);
      } else if (layerId === 'route-lines-hit') {
        const fromId = feature.properties?.fromId;
        const toId = feature.properties?.toId;
        if (fromId && toId) {
          setTrajectoryRoute({ originId: fromId, destId: toId });
          setPopup(null);
        }
      }
    } else {
      setSelectedOrigin(null);
      setPopup(null);
      setTrajectoryRoute(null);
    }
  }, [selectedOriginId, setSelectedOrigin]);

  const onMouseEnter = useCallback(() => setCursor('pointer'), []);
  const onMouseLeave = useCallback(() => {
    setCursor('auto');
    setPopup(null);
  }, []);

  const onMouseMove = useCallback((e: any) => {
    if (e.features && e.features.length > 0) {
      const feature = e.features[0];
      const layerId = feature.layer.id;

      if (layerId === 'destination-circles' || layerId === 'destination-labels') {
        const dest = sfBay.destinations.find(d => d.id === feature.properties?.id);
        if (dest) {
          setPopup({
            lng: dest.lng,
            lat: dest.lat,
            type: 'destination',
            name: dest.name,
            score: feature.properties?.score ?? 5,
            detail: dest.dockInfo,
          });
        }
      } else if (layerId === 'route-lines-hit') {
        setPopup({
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
          type: 'route',
          name: `${feature.properties?.fromName} → ${feature.properties?.toName}`,
          score: feature.properties?.score ?? 5,
          detail: `${feature.properties?.distance} mi · ${feature.properties?.transitMinutes} min`,
        });
      }
    }
  }, []);

  if (!MAPBOX_TOKEN || MAPBOX_TOKEN === 'pk.your_token_here') {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Mapbox Token Required</h1>
            <p className="text-[var(--muted)]">
              Add your Mapbox access token to <code className="text-compass-gold">.env.local</code>:
            </p>
            <pre className="bg-[var(--card)] border border-[var(--border)] rounded-lg p-4 text-sm text-left">
              NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_actual_token
            </pre>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      <Header />

      <div className="flex-1 relative">
        <Map
          ref={mapRef}
          mapboxAccessToken={MAPBOX_TOKEN}
          initialViewState={{
            longitude: sfBay.center[1],
            latitude: sfBay.center[0],
            zoom: sfBay.defaultZoom,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/dark-v11"
          interactiveLayerIds={['destination-circles', 'destination-labels', 'route-lines-hit']}
          onClick={onMapClick}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onMouseMove={onMouseMove}
          onLoad={onMapLoad}
          cursor={cursor}
        >
          <NavigationControl position="bottom-right" />

          {/* Route lines (behind destinations) */}
          <Source id="routes" type="geojson" data={routesGeoJSON}>
            <Layer {...routeLineLayer} />
            <Layer {...routeHitLayer} />
          </Source>

          {/* Destination markers */}
          <Source id="destinations" type="geojson" data={destinationsGeoJSON}>
            <Layer {...destinationCircleLayer} />
            <Layer {...destinationLabelLayer} />
          </Source>

          {/* Popup */}
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
        </Map>

        {/* Controls overlay */}
        <div className="absolute top-3 left-3 right-3 flex flex-col gap-2 pointer-events-none">
          {/* Activity selector */}
          <div className="flex gap-1.5 pointer-events-auto">
            {activities.map((a) => (
              <button
                key={a.id}
                onClick={() => setActivity(a.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-colors ${
                  activity === a.id
                    ? 'bg-reef-teal text-white shadow-lg'
                    : 'bg-ocean-900/80 text-ocean-200 hover:bg-ocean-800/80 border border-ocean-700/50'
                }`}
              >
                {a.icon} {a.name}
              </button>
            ))}
          </div>

          {/* Vessel selector */}
          <div className="pointer-events-auto">
            <select
              value={vessel.type}
              onChange={(e) => {
                const preset = vesselPresets.find(v => v.type === e.target.value);
                if (preset) setVesselPreset(preset.type);
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md bg-ocean-900/80 text-ocean-200 border border-ocean-700/50 cursor-pointer focus:border-compass-gold focus:outline-none"
            >
              {vesselPresets.map(v => (
                <option key={v.type} value={v.type}>{v.name} ({v.loa}ft, {v.draft}ft draft)</option>
              ))}
            </select>
          </div>

          {/* Month selector */}
          <div className="flex gap-1 pointer-events-auto">
            {MONTHS.map((m, i) => (
              <button
                key={i}
                onClick={() => setMonth(i)}
                className={`px-2 py-1 rounded text-xs font-medium backdrop-blur-md transition-colors ${
                  month === i
                    ? 'bg-compass-gold text-ocean-950 shadow-lg'
                    : 'bg-ocean-900/80 text-ocean-300 hover:bg-ocean-800/80 border border-ocean-700/50'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Score legend */}
        <ScoreLegend />

        {/* Time slider */}
        <div className="absolute bottom-6 left-4 right-4 pointer-events-auto">
          <div className="bg-ocean-900/90 backdrop-blur-md rounded-xl px-4 py-3 border border-ocean-700/50 shadow-xl">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-ocean-300">Time of Day</span>
              <span className="text-sm font-medium text-compass-gold">{timeLabel}</span>
            </div>
            <input
              type="range"
              min={5}
              max={22}
              value={hour}
              onChange={(e) => setHour(parseInt(e.target.value))}
              className="w-full accent-compass-gold"
            />
            <div className="flex justify-between text-xs text-ocean-400 mt-0.5">
              <span>5 AM</span>
              <span>Noon</span>
              <span>10 PM</span>
            </div>
          </div>
        </div>

        {/* Selected origin indicator */}
        {selectedOriginId && (
          <div className="absolute top-20 left-3 pointer-events-auto">
            <div className="bg-ocean-900/90 backdrop-blur-md rounded-lg px-3 py-2 border border-reef-teal/50 text-xs">
              <span className="text-ocean-300">From: </span>
              <span className="text-reef-teal font-medium">
                {sfBay.destinations.find(d => d.id === selectedOriginId)?.name}
              </span>
              <button
                onClick={() => setSelectedOrigin(null)}
                className="ml-2 text-ocean-400 hover:text-ocean-100"
              >
                ✕
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Trajectory panel */}
      {trajectoryRoute && (
        <TrajectoryPanel
          originId={trajectoryRoute.originId}
          destinationId={trajectoryRoute.destId}
          onClose={() => setTrajectoryRoute(null)}
        />
      )}
    </div>
  );
}
