'use client';

import { type MutableRefObject, useState } from 'react';
import dynamic from 'next/dynamic';
import { sfBay } from '@/data/cities/sf-bay';
import { MapErrorBoundary } from './MapErrorBoundary';
import { ConditionsChip } from './ConditionsChip';
import {
  routeLineLayer,
  approxRouteLineLayer,
  routeHitLayer,
  destinationCircleLayer,
  originCircleLayer,
  originRingLayer,
  destinationLabelLayer,
  originNameLayer,
  ferryLineLayer,
  ferryLabelLayer,
  hazardCircleLayer,
  hazardLabelLayer,
  eventCircleLayer,
  eventLabelLayer,
  zoneOverlayFillLayer,
  zoneOverlayBorderLayer,
  zoneOverlayLabelLayer,
  windArrowLayer,
  currentFlowLayer,
  supRadiusFillLayer,
  supRadiusBorderLayer,
} from '@/lib/map-layers';

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

interface PopupInfo {
  lng: number;
  lat: number;
  type: 'destination' | 'route' | 'hazard';
  name: string;
  detail: string;
}

interface MapContainerProps {
  mapRef: MutableRefObject<any>;
  destinationsGeoJSON: any;
  routesGeoJSON: any;
  ferryGeoJSON: any;
  hazardsGeoJSON: any;
  eventsGeoJSON: any;
  zoneOverlayGeoJSON: any;
  windArrowsGeoJSON: any;
  supRadiusGeoJSON: any;
  currentFlowGeoJSON: any;
  showNauticalChart: boolean;
  setShowNauticalChart: (v: boolean) => void;
  showFerryRoutes: boolean;
  setShowFerryRoutes: (v: boolean) => void;
  showHazards: boolean;
  setShowHazards: (v: boolean) => void;
  showEvents: boolean;
  setShowEvents: (v: boolean) => void;
  showZones: boolean;
  setShowZones: (v: boolean) => void;
  onMapLoad: () => void;
  onMapClick: (e: any) => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onMouseMove: (e: any) => void;
  cursor: string;
  popup: PopupInfo | null;
  hasMapToken: boolean;
  mapboxToken: string | undefined;
}

export function MapContainer({
  mapRef,
  destinationsGeoJSON,
  routesGeoJSON,
  ferryGeoJSON,
  hazardsGeoJSON,
  eventsGeoJSON,
  zoneOverlayGeoJSON,
  windArrowsGeoJSON,
  supRadiusGeoJSON,
  currentFlowGeoJSON,
  showNauticalChart,
  setShowNauticalChart,
  showFerryRoutes,
  setShowFerryRoutes,
  showHazards,
  setShowHazards,
  showEvents,
  setShowEvents,
  showZones,
  setShowZones,
  onMapLoad,
  onMapClick,
  onMouseEnter,
  onMouseLeave,
  onMouseMove,
  cursor,
  popup,
  hasMapToken,
  mapboxToken,
}: MapContainerProps) {
  // Tracks runtime Mapbox failures (CDN unreachable, tile fetch errors,
  // invalid token, user behind a firewall blocking api.mapbox.com).
  // The sidebar destination ranking still works without the map, so we
  // surface a non-blocking banner rather than killing the whole UI.
  const [mapError, setMapError] = useState(false);

  return (
    <MapErrorBoundary>
      <div className="flex-1 relative">
        {hasMapToken ? (
          <>
            <link
              rel="stylesheet"
              href="https://api.mapbox.com/mapbox-gl-js/v3.1.2/mapbox-gl.css"
            />
            {mapError && (
              <div
                className="absolute top-3 left-3 right-3 z-30 bg-warning-amber/15 border border-warning-amber/40 text-warning-amber rounded-lg px-3 py-2 text-xs sm:text-sm shadow-lg"
                role="alert"
              >
                Map provider unavailable — destination ranking and trip details still work in the sidebar.
              </div>
            )}
            <MapGL
              ref={mapRef}
              mapboxAccessToken={mapboxToken}
              initialViewState={{
                longitude: sfBay.center[1],
                latitude: sfBay.center[0],
                zoom: sfBay.defaultZoom,
              }}
              style={{ width: '100%', height: '100%' }}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              interactiveLayerIds={['destination-circles', 'destination-labels', 'origin-circle', 'route-lines-hit', 'hazard-markers']}
              onClick={onMapClick}
              onMouseEnter={onMouseEnter}
              onMouseLeave={onMouseLeave}
              onMouseMove={onMouseMove}
              onLoad={() => {
                setMapError(false);
                onMapLoad();
              }}
              onError={(e) => {
                console.warn('Mapbox runtime error:', e?.error?.message ?? e);
                setMapError(true);
              }}
              cursor={cursor}
            >
              <NavigationControl position="bottom-right" />

              {/* Map layer toggle buttons */}
              <div className="absolute top-3 right-3 z-10 flex flex-wrap gap-1.5 max-w-[280px] justify-end">
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
                <button
                  onClick={() => setShowHazards(!showHazards)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-colors shadow-lg ${
                    showHazards
                      ? 'bg-[#f59e0b] text-ocean-900 border border-[#f59e0b]'
                      : 'bg-ocean-900/80 text-ocean-200 border border-ocean-700/50 hover:bg-ocean-800/80'
                  }`}
                  title={showHazards ? 'Hide navigation hazards' : 'Show navigation hazards (rocks, shoals, bars)'}
                >
                  {showHazards ? 'Hazards ON' : 'Hazards'}
                </button>
                <button
                  onClick={() => setShowEvents(!showEvents)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-colors shadow-lg ${
                    showEvents
                      ? 'bg-compass-gold text-ocean-900 border border-compass-gold'
                      : 'bg-ocean-900/80 text-ocean-200 border border-ocean-700/50 hover:bg-ocean-800/80'
                  }`}
                  title={showEvents ? 'Hide Bay events' : 'Show Bay events this month (regattas, parades, swims)'}
                >
                  {showEvents ? 'Events ON' : 'Events'}
                </button>
                <button
                  onClick={() => setShowZones(!showZones)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium backdrop-blur-md transition-colors shadow-lg ${
                    showZones
                      ? 'bg-reef-teal text-white border border-reef-teal'
                      : 'bg-ocean-900/80 text-ocean-200 border border-ocean-700/50 hover:bg-ocean-800/80'
                  }`}
                  title={showZones ? 'Hide zone comfort overlay' : 'Show zone comfort + wind patterns for this month'}
                >
                  {showZones ? 'Zones ON' : 'Zones'}
                </button>
              </div>

              {/* Live conditions chip */}
              <ConditionsChip />

              {/* Destination marker legend */}
              <div
                className="absolute bottom-4 left-3 z-10 bg-ocean-900/85 backdrop-blur-md border border-ocean-700/50 rounded-lg px-3 py-2 text-2xs text-ocean-100 space-y-1 shadow-lg pointer-events-none"
                aria-label="Marker color legend"
              >
                <div className="text-2xs font-semibold uppercase tracking-wider text-ocean-300 mb-1">
                  Destinations
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#10b981]" aria-hidden="true" />
                  Nearby
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#f59e0b]" aria-hidden="true" />
                  Moderate distance
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#6b7280]" aria-hidden="true" />
                  Far
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-3.5 h-3.5 rounded-full bg-[#3b82f6] border-2 border-white" aria-hidden="true" />
                  Your origin
                </div>
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

              {/* Navigation hazards overlay */}
              {showHazards && (
                <Source id="hazards" type="geojson" data={hazardsGeoJSON}>
                  <Layer {...hazardCircleLayer} />
                  <Layer {...hazardLabelLayer} />
                </Source>
              )}

              {/* Zone comfort overlay — colored polygons showing conditions */}
              {showZones && (
                <>
                  <Source id="zone-overlay" type="geojson" data={zoneOverlayGeoJSON}>
                    <Layer {...zoneOverlayFillLayer} />
                    <Layer {...zoneOverlayBorderLayer} />
                    <Layer {...zoneOverlayLabelLayer} />
                  </Source>
                  <Source id="wind-arrows" type="geojson" data={windArrowsGeoJSON}>
                    <Layer {...windArrowLayer} />
                  </Source>
                  <Source id="current-flow" type="geojson" data={currentFlowGeoJSON}>
                    <Layer {...currentFlowLayer} />
                  </Source>
                </>
              )}

              {/* Bay events overlay */}
              {showEvents && (
                <Source id="events" type="geojson" data={eventsGeoJSON}>
                  <Layer {...eventCircleLayer} />
                  <Layer {...eventLabelLayer} />
                </Source>
              )}

              {/* SUP paddling radius */}
              <Source id="sup-radius" type="geojson" data={supRadiusGeoJSON}>
                <Layer {...supRadiusFillLayer} />
                <Layer {...supRadiusBorderLayer} />
              </Source>

              {/* Route lines */}
              <Source id="routes" type="geojson" data={routesGeoJSON}>
                <Layer {...routeLineLayer} />
                <Layer {...approxRouteLineLayer} />
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
                    {popup.type === 'hazard' && (
                      <span className="text-2xs font-semibold uppercase tracking-wider text-[#f59e0b]">Navigation Hazard</span>
                    )}
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
  );
}
