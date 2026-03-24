import type { ActivityProfile, ActivityType } from '@/engine/types';

export const activities: ActivityProfile[] = [
  {
    id: 'kayak',
    name: 'Kayak',
    description:
      'Sea kayaking in sheltered or moderate waters. Can handle light chop and short open-water crossings.',
    icon: '🛶',
    idealWindRange: [0, 8],
    maxWind: 12,
    maxWave: 1.5,
    vesselType: 'kayak',
    preferredZoneTypes: ['sheltered', 'protected'],
    maxShoreDistanceM: null, // can cross open water
    maxRangeRoundTripMi: 10,
    requiresOpenWaterCrossing: true, // kayaks can handle crossings
    beforeYouGo: [
      {
        text: 'Wear a PFD at all times',
        url: null,
        activityTypes: 'all',
      },
      {
        text: 'Check current speed and direction — paddling against 3+ knot current is dangerous',
        url: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
        activityTypes: ['kayak'],
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
        activityTypes: ['kayak', 'sup'],
      },
      {
        text: 'Carry a whistle and waterproof light',
        url: null,
        activityTypes: ['kayak'],
      },
    ],
    notes:
      'Can venture into moderate exposure zones. Current awareness critical. Spray skirt recommended for Bay conditions.',
  },
  {
    id: 'sup',
    name: 'Stand-Up Paddleboard',
    description:
      'Near-shore paddling in calm, protected water. Stay within 500m of shore. Very sensitive to wind and chop.',
    icon: '🏄‍♂️',
    idealWindRange: [0, 5],
    maxWind: 8,
    maxWave: 0.5,
    vesselType: 'sup',
    preferredZoneTypes: ['sheltered', 'protected'],
    maxShoreDistanceM: 500, // must stay near shore
    maxRangeRoundTripMi: 5,
    requiresOpenWaterCrossing: false, // warn on open water crossings
    beforeYouGo: [
      {
        text: 'Wear a PFD — required by law on SUPs in California',
        url: null,
        activityTypes: ['sup'],
      },
      {
        text: 'Use a leash — your board is your life raft',
        url: null,
        activityTypes: ['sup'],
      },
      {
        text: 'Check wind forecast — standing up means wind pushes you like a sail',
        url: 'https://forecast.weather.gov/MapClick.php?zoneid=PZZ530',
        activityTypes: ['sup'],
      },
      {
        text: 'Check current speed — even 2 knots can overpower a SUP paddler',
        url: 'https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201',
        activityTypes: ['sup'],
      },
      {
        text: 'Stay within 500m of shore at all times',
        url: null,
        activityTypes: ['sup'],
      },
      {
        text: 'Dress for immersion — you WILL fall in. SF Bay is 50-65°F.',
        url: null,
        activityTypes: ['sup'],
      },
      {
        text: 'Tell someone your plan and expected return time',
        url: null,
        activityTypes: 'all',
      },
    ],
    notes:
      'Most weather-sensitive activity. Sheltered water only. Standing = high wind profile. Stay near shore. Launch from any beach or dock.',
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
    maxShoreDistanceM: null,
    maxRangeRoundTripMi: null, // fuel-limited
    requiresOpenWaterCrossing: true,
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
    maxShoreDistanceM: null,
    maxRangeRoundTripMi: null, // wind-dependent
    requiresOpenWaterCrossing: true,
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
