# Multi-City Scaling Research Results (April 2026)

## Key Finding: 80% of city data is auto-generatable from NOAA + OSM

### Time per city:
- Zero-manual (auto-only): ~5 minutes (scripts only)
- Light curation: ~6 hours (review auto-gen + add dock details)
- Full curation (SF Bay level): ~25 hours

### Recommended approach: Build-time generation (Option B)
Scripts query NOAA ERDDAP + OSM Overpass at build time, output static data files per city.

## Verified NOAA Station Data

### Miami
- Buoys: VAKF1 (wind+temp), 41122 (waves+temp), PEGF1 (wind), FWYF1
- Tide: 8723214 (Virginia Key)
- Currents: NONE for predictions (Gulf Stream dominates, not tidal)
- NWS: AMZ651 (coastal Deerfield Beach to Ocean Reef)
- Gap: No single station has wind AND waves. Must combine.

### Puget Sound
- Buoys: 46088 (all sensors), WPOW1 (wind), EBSW1 (wind), BMTW1 (wind)
- Tide: 9447130 (Seattle)
- Currents: 50+ PUG stations, up to 3.7kt — EXCELLENT (safety-critical)
- NWS: PZZ131, PZZ132, PZZ134, PZZ135
- Gap: 46088 is at Strait entrance, not inner Sound. Need WPOW1 for Seattle.

### Los Angeles
- Buoys: 46221 (waves+temp), 46268 (waves+temp), 46253 (waves+temp)
- Tide: 9410660 (Los Angeles)
- Currents: PCT1451 (0.9kt), NB0101/NB0201 (Newport, weak)
- NWS: PZZ650, PZZ655
- Gap: NO wind from wave buoys. Use Open-Meteo for wind.

### San Diego
- Buoys: 46225 (waves+temp), 46258 (waves+temp), LJAC1 (wind+temp), SDBC1 (temp)
- Tide: 9410170 (San Diego)
- Currents: NONE found (negligible currents)
- NWS: PZZ740, PZZ745
- Gap: Same wind/wave split as LA.

## Auto-Generation Verified Working
- ERDDAP `orderByMean("station,time/12hours")` gives AM/PM split — confirmed
- ERDDAP `orderByMean("station,time/1month")` gives monthly averages — confirmed
- OSM Overpass for marina/slipway discovery — existing pattern in codebase
- OSM coastline polygons — global, existing pipeline
- NWS zone assignment — point query API works

## What CANNOT be automated
1. Zone boundary fine-tuning (NWS zones too coarse)
2. Dock details (fees, hours, amenities)
3. Events (regattas, shows — region-specific)
4. Activity-specific local knowledge notes
5. Fishing species/seasons
6. Comfort score calibration (default formula works, local review improves)
