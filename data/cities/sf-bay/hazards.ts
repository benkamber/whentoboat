import type { Source } from '@/engine/types';

export interface Hazard {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  severity: 'critical' | 'warning' | 'caution';
  depthFt?: number;
  sources: Source[];
}

const CHART_SOURCE: Source = { name: "NOAA Chart 18649", url: "https://charts.noaa.gov/ENCs/ENCs.shtml", date: "2026-03" };
const COAST_PILOT_SOURCE: Source = { name: "US Coast Pilot Vol 7, Ch. 7", url: "https://nauticalcharts.noaa.gov/publications/coast-pilot/", date: "2026-03" };

export const hazards: Hazard[] = [
  {
    id: 'harding_rock',
    name: 'Harding Rock',
    lat: 37.8258,
    lng: -122.4417,
    description: 'Submerged rock, 36 ft MLLW. Marked by lighted buoy RG "HR" Fl(2+1)R 6s with RACON. Located between Marin and Alcatraz.',
    severity: 'warning',
    depthFt: 36,
    sources: [CHART_SOURCE, COAST_PILOT_SOURCE],
  },
  {
    id: 'blossom_rock',
    name: 'Blossom Rock',
    lat: 37.8187,
    lng: -122.4033,
    description: 'Submerged rock, 40 ft MLLW. Marked by buoy GR "BR" Fl(2+1)G 6s. Between Alcatraz and Yerba Buena Island. Has claimed numerous vessels.',
    severity: 'warning',
    depthFt: 40,
    sources: [CHART_SOURCE, COAST_PILOT_SOURCE],
  },
  {
    id: 'alcatraz_shoals',
    name: 'Alcatraz Island Shoals',
    lat: 37.8267,
    lng: -122.4222,
    description: 'Submerged rocks and shoaling ledges surround Alcatraz. Do not approach closely. Strong tidal currents (3-4 kts) create rips and standing waves.',
    severity: 'warning',
    sources: [CHART_SOURCE, COAST_PILOT_SOURCE],
  },
  {
    id: 'southampton_shoal',
    name: 'Southampton Shoal',
    lat: 37.8819,
    lng: -122.4003,
    description: '2-mile-long shoal between Angel Island and Richmond. Marked by lighted buoys #1-#7. Stay in marked channel — depths outside drop to 6 ft. Southampton Shoal Channel is an RNA.',
    severity: 'warning',
    depthFt: 6,
    sources: [CHART_SOURCE, COAST_PILOT_SOURCE],
  },
  {
    id: 'san_bruno_shoal',
    name: 'San Bruno Shoal',
    lat: 37.6500,
    lng: -122.3500,
    description: 'Bares to 2 ft MLLW at low tide. Most dangerous obstacle for southbound traffic in South Bay. East of channel markers #4 and #6. Stay strictly in marked channel.',
    severity: 'critical',
    depthFt: 2,
    sources: [CHART_SOURCE, COAST_PILOT_SOURCE],
  },
  {
    id: 'berkeley_reef',
    name: 'Berkeley Reef',
    lat: 37.8631,
    lng: -122.3218,
    description: 'Marked by Fl G 2.5s daymark. Give 100-foot radius. Berkeley shoreline is rocky lee shore — loss of propulsion leads to rapid grounding.',
    severity: 'caution',
    sources: [CHART_SOURCE],
  },
  {
    id: 'clipper_cove_shoal',
    name: 'Clipper Cove Entrance Shoal',
    lat: 37.8200,
    lng: -122.3700,
    description: 'Large shoal across Clipper Cove entrance, 4-5 ft MLLW. Enter NORTH side hugging Pier 1 on starboard. Boats with 5+ ft draft have grounded. Enter only on rising tide.',
    severity: 'critical',
    depthFt: 4,
    sources: [CHART_SOURCE, { name: "ActiveCaptain community reviews", url: "https://activecaptain.garmin.com/", date: "2025" }],
  },
  {
    id: 'richardson_bay_shallows',
    name: 'Richardson Bay Shallows',
    lat: 37.8700,
    lng: -122.4800,
    description: 'Extremely shallow outside marked channel — 2 ft MLLW on the flats. Wildlife sanctuary in north part closed Oct-Mar. 5 mph no-wake enforced.',
    severity: 'caution',
    depthFt: 2,
    sources: [CHART_SOURCE, { name: "Cruising Guide to SF Bay (Mehaffy, 3rd ed.)", url: null, date: "2016" }],
  },
  {
    id: 'yellow_bluff',
    name: 'Yellow Bluff',
    lat: 37.8410,
    lng: -122.4680,
    description: 'Rock covered 5 ft east-southeast of Yellow Bluff near Marin Headlands. Turbulent eddies on ebb tide.',
    severity: 'caution',
    depthFt: 5,
    sources: [CHART_SOURCE, COAST_PILOT_SOURCE],
  },
  {
    id: 'point_blunt',
    name: 'Point Blunt (Angel Island)',
    lat: 37.8550,
    lng: -122.4200,
    description: 'Tidal races and strong current shear at east entrance of Raccoon Strait. Shoals and rocks extend from Point Blunt. Ebb sets directly across the entrance.',
    severity: 'warning',
    sources: [CHART_SOURCE, COAST_PILOT_SOURCE],
  },
  {
    id: 'golden_gate_bar',
    name: 'Golden Gate Bar (Potato Patch)',
    lat: 37.8100,
    lng: -122.5200,
    description: 'Shallow bar outside Golden Gate. Massive standing waves when strong ebb opposes Pacific swells. Extremely dangerous for small craft in heavy conditions.',
    severity: 'critical',
    sources: [CHART_SOURCE, COAST_PILOT_SOURCE],
  },
];
