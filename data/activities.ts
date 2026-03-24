import type { ActivityProfile, ActivityType } from '@/engine/types';

export const activities: ActivityProfile[] = [
  {
    id: 'kayak_sup',
    name: 'Kayak / SUP',
    description:
      'Paddling in sheltered waters. Wind and current are critical safety factors.',
    icon: '🛶',
    idealWindRange: [0, 8],
    maxWind: 12,
    maxWave: 1.5,
    vesselType: 'kayak',
    preferredZoneTypes: ['sheltered', 'protected'],
    beforeYouGo: [
      {
        text: 'Wear a PFD at all times',
        url: null,
        activityTypes: 'all',
      },
      {
        text: 'Check current speed and direction — paddling against 3+ knot current is dangerous',
        url: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
        activityTypes: ['kayak_sup'],
      },
      {
        text: 'Tell someone your plan and expected return time',
        url: null,
        activityTypes: 'all',
      },
      {
        text: 'Check marine forecast',
        url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
        activityTypes: 'all',
      },
      {
        text: 'Dress for immersion — SF Bay water is 50-65°F year-round',
        url: null,
        activityTypes: ['kayak_sup'],
      },
    ],
    notes:
      'Most weather-sensitive activity. Sheltered water only. Current awareness critical.',
  },
  {
    id: 'powerboat_cruise',
    name: 'Powerboat Cruise',
    description:
      'Day cruising with passengers. Optimizing for comfort and flat water.',
    icon: '🚤',
    idealWindRange: [0, 10],
    maxWind: 15,
    maxWave: 2.0,
    vesselType: 'powerboat',
    preferredZoneTypes: ['calm', 'moderate'],
    beforeYouGo: [
      {
        text: 'Check marine forecast',
        url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
        activityTypes: 'all',
      },
      {
        text: 'Verify fuel level for round trip plus 30% reserve',
        url: null,
        activityTypes: ['powerboat_cruise'],
      },
      {
        text: 'Test engine cutoff switch',
        url: null,
        activityTypes: ['powerboat_cruise'],
      },
      {
        text: 'Monitor VHF Ch 16',
        url: null,
        activityTypes: 'all',
      },
      {
        text: 'File a float plan with someone on shore',
        url: null,
        activityTypes: 'all',
      },
    ],
    notes: 'Passenger comfort is priority. Avoid short-period chop.',
  },
  {
    id: 'casual_sail',
    name: 'Casual Daysail',
    description:
      'Relaxed sailing with crew. Enough wind to sail, not enough to intimidate.',
    icon: '⛵',
    idealWindRange: [8, 15],
    maxWind: 20,
    maxWave: 3.0,
    vesselType: 'sailboat',
    preferredZoneTypes: ['moderate', 'exposed'],
    beforeYouGo: [
      {
        text: 'Check wind forecast — both speed and direction',
        url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
        activityTypes: ['casual_sail'],
      },
      {
        text: 'Plan reefing strategy for afternoon wind buildup',
        url: null,
        activityTypes: ['casual_sail'],
      },
      {
        text: 'Monitor VHF Ch 16',
        url: null,
        activityTypes: 'all',
      },
      {
        text: 'Check tide and current timing for route',
        url: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
        activityTypes: 'all',
      },
      {
        text: 'Verify engine starts for backup propulsion',
        url: null,
        activityTypes: ['casual_sail'],
      },
    ],
    notes:
      'Too little wind is boring. Too much is stressful. Sweet spot is 8-15 kts.',
  },
];

export function getActivity(id: ActivityType): ActivityProfile {
  const activity = activities.find((a) => a.id === id);
  if (!activity) {
    throw new Error(`Unknown activity: ${id}`);
  }
  return activity;
}
