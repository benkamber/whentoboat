// AUTO-GENERATED city index
// Miami & Biscayne Bay (Florida)
// Generated: 2026-04-12

import { destinations } from './destinations';
import { zones } from './zones';
import { distances } from './distances';
// City data — auto-generated, subset of full City type

export const miami = {
  id: 'miami',
  name: 'Miami & Biscayne Bay',
  center: [25.76, -80.19],
  defaultZoom: 11,
  destinations,
  zones,
  distances,
  verifyLinks: [
    { label: 'NOAA Marine Forecast', type: 'forecast' as const, url: 'https://www.weather.gov/marine' },
    { label: 'Tide Predictions', type: 'tide' as const, url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=8723214' },
  ],
};
