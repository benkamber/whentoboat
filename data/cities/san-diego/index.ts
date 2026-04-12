// AUTO-GENERATED city index
// San Diego Bay (California)
// Generated: 2026-04-12

import { destinations } from './destinations';
import { zones } from './zones';
import { distances } from './distances';
// City data — auto-generated, subset of full City type

export const san_diego = {
  id: 'san-diego',
  name: 'San Diego Bay',
  center: [32.71, -117.16],
  defaultZoom: 12,
  destinations,
  zones,
  distances,
  verifyLinks: [
    { label: 'NOAA Marine Forecast', type: 'forecast' as const, url: 'https://www.weather.gov/marine' },
    { label: 'Tide Predictions', type: 'tide' as const, url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9410170' },
  ],
};
