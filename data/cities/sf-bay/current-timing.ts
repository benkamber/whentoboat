import type { Source } from '@/engine/types';

export interface CurrentTimingAdvice {
  zoneId: string;
  zoneName: string;
  maxEbbKts: string;
  maxFloodKts: string;
  slackAdvice: string;
  crossingAdvice: string;
  noaaStationUrl: string;
  sources: Source[];
}

const CURRENT_SOURCES: Source[] = [
  { name: "NOAA CO-OPS Tidal Current Predictions", url: "https://tidesandcurrents.noaa.gov/noaacurrents/Regions?g=530", date: "2026-03" },
  { name: "US Coast Pilot Vol 7, Ch. 7", url: "https://nauticalcharts.noaa.gov/publications/coast-pilot/", date: "2026-03" },
];

export const currentTimingAdvice: CurrentTimingAdvice[] = [
  {
    zoneId: 'central_bay',
    zoneName: 'Golden Gate / Central Bay',
    maxEbbKts: '5-6.5 kts',
    maxFloodKts: '3-4 kts',
    slackAdvice: 'Slack water occurs approximately 1-2 hours after high and low tide at the Golden Gate.',
    crossingAdvice: 'Cross on flood for favorable current into the bay. Avoid the Gate during max ebb — currents create dangerous standing waves when opposing Pacific swells. Kayaks and SUPs should ONLY cross at slack water.',
    noaaStationUrl: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
    sources: CURRENT_SOURCES,
  },
  {
    zoneId: 'richardson',
    zoneName: 'Raccoon Strait',
    maxEbbKts: '3-5 kts',
    maxFloodKts: '2-3 kts',
    slackAdvice: 'Slack water in Raccoon Strait lags Golden Gate slack by approximately 30 minutes.',
    crossingAdvice: 'Cross at slack water. Strong ebb sets directly across the east entrance — vessels can be swept past Angel Island. Kayaks must time crossings precisely. Flood current helps vessels entering from the west.',
    noaaStationUrl: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1212',
    sources: CURRENT_SOURCES,
  },
  {
    zoneId: 'east_bay',
    zoneName: 'Oakland Estuary / Bay Bridge',
    maxEbbKts: '2-3 kts',
    maxFloodKts: '1.5-2 kts',
    slackAdvice: 'Current accelerates between Bay Bridge piers. Strongest 2-3 hours after high water.',
    crossingAdvice: 'Bay Bridge pier eddies can sheer vessels off course. Maintain extra speed when transiting between piers. Oakland Estuary has 1-1.5 kt currents — manageable for all vessels.',
    noaaStationUrl: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1205',
    sources: CURRENT_SOURCES,
  },
  {
    zoneId: 'north_bay',
    zoneName: 'San Pablo Strait / Point San Pablo',
    maxEbbKts: '3-4 kts',
    maxFloodKts: '2-3 kts',
    slackAdvice: 'Currents strongest between The Brothers islands and Point San Pablo.',
    crossingAdvice: 'Do NOT navigate between The Brothers islands. Strong current between Point San Pablo and The Brothers can exceed 3 kts. Use flood to carry you north, ebb to return south.',
    noaaStationUrl: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1213',
    sources: CURRENT_SOURCES,
  },
  {
    zoneId: 'san_pablo',
    zoneName: 'Carquinez Strait',
    maxEbbKts: '3-4 kts (continuous during river freshets)',
    maxFloodKts: '2-2.5 kts',
    slackAdvice: 'During winter rain events, Sacramento River outflow can overpower flood tide — continuous ebb for days.',
    crossingAdvice: 'Navigate with the current, not against it. Eastbound: depart on flood. Westbound: depart on ebb. Wind against current creates very steep chop. Tankers operate in the narrow channel — stay clear (Rule 9).',
    noaaStationUrl: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
    sources: CURRENT_SOURCES,
  },
];

/** Look up timing advice for zones a route passes through */
export function getCurrentTimingForRoute(hazards: string): CurrentTimingAdvice[] {
  const advice: CurrentTimingAdvice[] = [];
  const lower = hazards.toLowerCase();

  if (lower.includes('golden gate') || lower.includes('harding') || lower.includes('central bay')) {
    const gg = currentTimingAdvice.find(c => c.zoneId === 'central_bay');
    if (gg) advice.push(gg);
  }
  if (lower.includes('raccoon') || lower.includes('point blunt') || lower.includes('angel island')) {
    const rs = currentTimingAdvice.find(c => c.zoneId === 'richardson');
    if (rs) advice.push(rs);
  }
  if (lower.includes('bay bridge') || lower.includes('oakland') || lower.includes('bar channel')) {
    const eb = currentTimingAdvice.find(c => c.zoneId === 'east_bay');
    if (eb) advice.push(eb);
  }
  if (lower.includes('southampton') || lower.includes('point san pablo') || lower.includes('brothers')) {
    const nb = currentTimingAdvice.find(c => c.zoneId === 'north_bay');
    if (nb) advice.push(nb);
  }
  if (lower.includes('carquinez') || lower.includes('pinole')) {
    const sp = currentTimingAdvice.find(c => c.zoneId === 'san_pablo');
    if (sp) advice.push(sp);
  }

  return advice;
}
