// AUTO-GENERATED city index
// Puget Sound (Washington)
// Generated: 2026-04-12

import { destinations } from './destinations';
import { zones } from './zones';
import { distances } from './distances';
// City data — auto-generated, subset of full City type

export const puget_sound = {
  id: 'puget-sound',
  name: 'Puget Sound',
  center: [47.6, -122.4],
  defaultZoom: 10,
  destinations,
  zones,
  distances,
  verifyLinks: [
    { label: 'NOAA Marine Forecast', type: 'forecast' as const, url: 'https://www.weather.gov/marine' },
    { label: 'Tide Predictions', type: 'tide' as const, url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9447130' },
  ],
};
