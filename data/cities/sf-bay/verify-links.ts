import type { VerifyLink } from '@/engine/types';

export const zoneVerifyLinks: Record<string, VerifyLink[]> = {
  richardson: [
    {
      label: 'TIBC1 Buoy — Wind at Tiburon',
      url: 'https://www.ndbc.noaa.gov/station_page.php?station=TIBC1',
      type: 'buoy',
    },
    {
      label: 'Tides — San Francisco (9414290)',
      url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414290',
      type: 'tide',
    },
  ],

  central_bay: [
    {
      label: 'NWS Forecast — San Francisco Bay (PZZ530)',
      url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
      type: 'forecast',
    },
    {
      label: 'FTPC1 Buoy — Fort Point Wind',
      url: 'https://www.ndbc.noaa.gov/station_page.php?station=FTPC1',
      type: 'buoy',
    },
    {
      label: 'Tides — San Francisco (9414290)',
      url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414290',
      type: 'tide',
    },
    {
      label: 'Currents — Golden Gate (SFB1201)',
      url: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
      type: 'current',
    },
  ],

  sf_shore: [
    {
      label: 'NWS Forecast — San Francisco Bay (PZZ530)',
      url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
      type: 'forecast',
    },
    {
      label: 'FTPC1 Buoy — Fort Point Wind',
      url: 'https://www.ndbc.noaa.gov/station_page.php?station=FTPC1',
      type: 'buoy',
    },
    {
      label: 'Tides — San Francisco (9414290)',
      url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414290',
      type: 'tide',
    },
  ],

  east_bay: [
    {
      label: 'AAMC1 Buoy — Alameda Wind',
      url: 'https://www.ndbc.noaa.gov/station_page.php?station=AAMC1',
      type: 'buoy',
    },
    {
      label: 'Tides — Alameda (9414750)',
      url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414750',
      type: 'tide',
    },
  ],

  north_bay: [
    {
      label: 'NWS Forecast — San Francisco Bay (PZZ530)',
      url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
      type: 'forecast',
    },
    {
      label: 'Tides — Richmond (9414863)',
      url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414863',
      type: 'tide',
    },
  ],

  san_pablo: [
    {
      label: 'NWS Forecast — San Francisco Bay (PZZ530)',
      url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
      type: 'forecast',
    },
    {
      label: 'Tides — Richmond (9414863)',
      url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414863',
      type: 'tide',
    },
  ],

  south_bay: [
    {
      label: 'NWS Forecast — South San Francisco Bay (PZZ531)',
      url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ531',
      type: 'forecast',
    },
    {
      label: 'Tides — Oyster Point (9414392)',
      url: 'https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414392',
      type: 'tide',
    },
  ],

  ocean_south: [
    {
      label: '46026 Buoy — San Francisco Bar',
      url: 'https://www.ndbc.noaa.gov/station_page.php?station=46026',
      type: 'buoy',
    },
    {
      label: 'NWS Forecast — Coastal Waters (PZZ545)',
      url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ545',
      type: 'forecast',
    },
  ],
};

export const cityVerifyLinks: VerifyLink[] = [
  {
    label: 'NWS Bay Area General Forecast',
    url: 'https://forecast.weather.gov/MapClick.php?lat=37.8&lon=-122.4',
    type: 'forecast',
  },
  {
    label: 'USCG SF Bay Safety Information',
    url: 'https://www.pacificarea.uscg.mil/Our-Organization/District-11/About-Us/Units/Sector-San-Francisco/',
    type: 'forecast',
  },
];
