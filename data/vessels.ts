import type { VesselProfile, VesselType } from '@/engine/types';

export const vesselPresets: VesselProfile[] = [
  {
    type: 'kayak',
    name: 'Sea Kayak',
    loa: 16,
    cruiseSpeed: 4,
    fuelCapacity: null,
    gph: null,
    draft: 0.5,
    maxEnduranceHours: 3,
  },
  {
    type: 'sup',
    name: 'Stand-Up Paddleboard',
    loa: 11,
    cruiseSpeed: 3,
    fuelCapacity: null,
    gph: null,
    draft: 0.3,
    maxEnduranceHours: 2,
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
  },
  {
    type: 'sailboat',
    name: '25ft Daysailer',
    loa: 25,
    cruiseSpeed: 6,
    fuelCapacity: 30,
    gph: 2,
    draft: 4.5,
    maxEnduranceHours: null,
  },
];

export function getVesselPreset(type: VesselType): VesselProfile {
  const vessel = vesselPresets.find((v) => v.type === type);
  if (!vessel) {
    throw new Error(`Unknown vessel type: ${type}`);
  }
  return vessel;
}
