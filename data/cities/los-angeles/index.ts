// AUTO-GENERATED city index
// Los Angeles & Marina del Rey (California)
// Generated: 2026-04-12

import { destinations } from './destinations';
import { zones } from './zones';
import { distances } from './distances';
// City data — auto-generated, subset of full City type

export const los_angeles = {
  id: 'los-angeles',
  name: 'Los Angeles & Marina del Rey',
  center: [33.98, -118.46],
  defaultZoom: 11,
  destinations,
  zones,
  distances,
  verifyLinks: [
    { label: 'NOAA Marine Forecast', type: 'forecast' as const, url: 'https://www.weather.gov/marine' },
    { label: 'Tide Predictions', type: 'tide' as const, url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9410660' },
  ],
};
