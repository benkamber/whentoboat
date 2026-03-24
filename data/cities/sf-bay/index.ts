import type { City } from '@/engine/types';

import { destinations } from './destinations';
import { zones } from './zones';
import { distances } from './distances';
import { routingRules } from './routing-rules';
import { zoneVerifyLinks, cityVerifyLinks } from './verify-links';
import { sunsetData } from './sunset';

export { zoneVerifyLinks };

export const sfBay: City = {
  id: 'sf-bay',
  name: 'San Francisco Bay',
  region: 'California, USA',
  bounds: {
    sw: [37.45, -122.55],
    ne: [38.15, -121.75],
  },
  center: [37.8, -122.35],
  defaultZoom: 11,
  destinations,
  zones,
  distances,
  routingRules,
  verifyLinks: cityVerifyLinks,
  sunsetData,
  dataSources: [
    {
      name: 'NOAA NDBC',
      url: 'https://www.ndbc.noaa.gov/',
      authority: 'National Data Buoy Center',
      updateFrequency: 'Hourly',
      description:
        'Real-time and historical buoy observations for wind, waves, and atmospheric conditions.',
    },
    {
      name: 'NWS Marine Forecasts',
      url: 'https://www.weather.gov/mtr/MarineProducts',
      authority: 'National Weather Service — San Francisco Bay Area',
      updateFrequency: 'Twice daily (with amendments)',
      description:
        'Official marine weather forecasts for SF Bay zones including wind, wave, and visibility predictions.',
    },
    {
      name: 'NOAA CO-OPS',
      url: 'https://tidesandcurrents.noaa.gov/',
      authority: 'Center for Operational Oceanographic Products and Services',
      updateFrequency: 'Published annually (predictions); real-time observations continuous',
      description:
        'Tide predictions, current predictions, and water level observations for SF Bay stations.',
    },
    {
      name: 'Open-Meteo',
      url: 'https://open-meteo.com/',
      authority: 'Open-Meteo GmbH',
      updateFrequency: 'Hourly',
      description:
        'Open-source weather API providing hourly forecasts for wind, temperature, and precipitation.',
    },
    {
      name: 'USGS',
      url: 'https://sfbay.wr.usgs.gov/',
      authority: 'United States Geological Survey',
      updateFrequency: 'Varies by dataset',
      description:
        'SF Bay water quality, sediment transport, and bathymetric survey data.',
    },
  ],
};
