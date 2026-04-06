'use client';

import { type MutableRefObject } from 'react';
import dynamic from 'next/dynamic';
import { sfBay } from '@/data/cities/sf-bay';
import { MapErrorBoundary } from './MapErrorBoundary';
import {
  routeLineLayer,
  routeHitLayer,
  destinationCircleLayer,
  originCircleLayer,
  originRingLayer,
  destinationLabelLayer,
  originNameLayer,
  ferryLineLayer,
  ferryLabelLayer,
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
  type: 'destination' | 'route';
  name: string;
  detail: string;
}

interface MapContainerProps {
  mapRef: MutableRefObject<any>;
  destinationsGeoJSON: any;
  routesGeoJSON: any;
  ferryGeoJSON: any;
  showNauticalChart: boolean;
  setShowNauticalChart: (v: boolean) => void;
  showFerryRoutes: boolean;
  setShowFerryRoutes: (v: boolean) => void;
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
  showNauticalChart,
  setShowNauticalChart,
  showFerryRoutes,
  setShowFerryRoutes,
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
  return (
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
              mapboxAccessToken={mapboxToken}
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
  );
}
