import type { VesselProfile, VesselType } from '@/engine/types';

export const vesselPresets: VesselProfile[] = [
  {
    type: 'kayak',
    name: 'Sea Kayak',
    loa: 16,
    cruiseSpeed: 3.5,
    fuelCapacity: null,
    gph: null,
    draft: 0.5,
    maxEnduranceHours: 3,
    beam: 2,
    hullType: 'sit-inside',
    notes: 'Touring sea kayak with spray skirt. Handles light chop but not open crossings in wind.',
  },
  {
    type: 'sup',
    name: 'Stand-Up Paddleboard',
    loa: 11,
    cruiseSpeed: 2.5,
    fuelCapacity: null,
    gph: null,
    draft: 0.3,
    maxEnduranceHours: 2,
    beam: 2.5,
    hullType: 'flat-bottom',
    notes: 'All-around SUP. Standing profile catches wind. Stay near shore in sheltered water.',
  },
  {
    type: 'powerboat',
    name: '21ft Center Console',
    loa: 21,
    cruiseSpeed: 30,
    fuelCapacity: 66,
    gph: 9,
    draft: 2,
    maxEnduranceHours: null,
    beam: 8.5,
    displacement: 3800,
    hullType: 'deep-v',
    engineType: 'Mercury 200XL',
    passengers: 6,
    notes: 'Deep-v hull handles chop well. Good all-around Bay boat.',
  },
  {
    type: 'sailboat',
    name: '25ft Daysailer',
    loa: 25,
    cruiseSpeed: 7,
    fuelCapacity: 30,
    gph: 0.6,
    draft: 4.5,
    maxEnduranceHours: null,
    beam: 8,
    displacement: 5000,
    hullType: 'monohull',
    keelType: 'fin',
    sailArea: 375,
    engineType: 'Yanmar 1GM10 diesel',
    passengers: 4,
    notes: 'Fin keel sloop. Good in moderate conditions. Needs 8+ kt to sail comfortably.',
  },
];

export function getVesselPreset(type: VesselType): VesselProfile {
  const vessel = vesselPresets.find((v) => v.type === type);
  if (!vessel) {
    throw new Error(`Unknown vessel type: ${type}`);
  }
  return vessel;
}
