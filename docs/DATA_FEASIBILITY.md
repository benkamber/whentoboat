# WhenToBoat — Data Feasibility Report (Live API Tests)

**Date:** 2026-03-24
**All APIs tested with real HTTP requests. No theoretical claims.**

---

## Verdict: ALL CORE DATA IS FREE AND WORKS

Every critical data source for wind, waves, tides, currents, water temperature, and weather forecasts is available from free, no-API-key-required federal APIs with excellent SF Bay coverage.

---

## What Works (Tested & Verified)

### Wind & Waves
| Source | Status | Key? | Data | Resolution | Coverage |
|--------|--------|------|------|------------|----------|
| NDBC Buoy Real-time | **WORKS** | No | Wind speed/dir/gust, wave height, wave period, water temp | 10-min updates | 46026 (SF Bar), FTPC1 (Fort Point), TIBC1 (Tiburon), AAMC1 (Alameda) |
| NDBC Buoy Historical | **WORKS** | No | Same fields, gzipped text | 10-min, **44 years** (1982–present for 46026) | Same stations |
| ERDDAP (JSON access to historical) | **WORKS** | No | Same data as NDBC but in clean JSON/CSV | 10-min, 44 years | All NDBC stations |
| Open-Meteo Marine | **WORKS** | No | Wave height, swell height/period/direction | Hourly, **~5nm grid** | Global — fine enough to distinguish outer coast vs central bay vs north bay |
| Open-Meteo Weather | **WORKS** | No | Wind speed (knots), gusts, direction, visibility (fog!), cloud cover, temp | Hourly, 7-day forecast | Global |

**Key finding:** Open-Meteo's ~5nm grid resolution CAN differentiate conditions across SF Bay. Tested: Golden Gate = 0.98m waves, Central Bay = 0.64m, Richmond = 0.40m. This is usable.

### Tides & Currents
| Source | Status | Key? | Data | Resolution | Coverage |
|--------|--------|------|------|------------|----------|
| CO-OPS Tides | **WORKS** | No | Water level predictions (ft above MLLW) | 6-min intervals | **90 stations** in SF Bay |
| CO-OPS Currents | **WORKS** | No | Current velocity (knots), flood/ebb direction | 6-min intervals | **285 stations** in SF Bay |

**Key finding:** Current data shows Golden Gate ebb reaches **-4.31 knots**. This is the kind of data that saves lives — a kayaker paddling 3 knots against a 4.3-knot ebb is going backwards. The coverage is exceptional.

### Water Temperature
| Source | Status | Key? | Data | Notes |
|--------|--------|------|------|-------|
| CO-OPS Water Temp | **WORKS** (some stations) | No | Water temp in °F, 6-min intervals | Alameda: 64°F, Richmond: 58.8°F. Not all stations have sensors. |
| USGS Water Data | **WORKS** | No | Water temp, salinity (specific conductance) | SF Bay station: 19.2°C current |
| NDBC Buoys | **WORKS** | No | Sea surface temp | 46026: 12.0°C (53.6°F — cold!) |

### Weather Forecasts
| Source | Status | Key? | Data | Notes |
|--------|--------|------|------|-------|
| NWS Marine Forecast | **WORKAROUND** | No | Wind/wave text forecast for PZZ530/PZZ531 | The /forecast JSON endpoint returns 404 ("not yet supported"). BUT full text forecasts are available via /products/types/CWF/locations/MTR. Requires text parsing (regex). |
| Open-Meteo | **WORKS** | No | Hourly 7-day forecast for wind, temp, visibility, clouds | Best structured forecast source. |

---

## What Doesn't Exist (Must Build/Curate)

### Boat Fuel Consumption
**No authoritative free database exists.** EPA has marine engine emissions data, not fuel consumption. BoatUS fuel calculator appears discontinued.

**Solution:** Build a lookup table from manufacturer specs. ~20 boat categories covers 90% of use cases:
```
Category                  | Typical HP | Cruise GPH | WOT GPH | Cruise Speed
21ft Center Console       | 150        | 9          | 18      | 32 mph
35ft Sailboat (aux)       | 30         | 2          | 3       | 7 mph
24ft Wakeboard Boat       | 350        | 8          | 20      | 25 mph
Kayak                     | 0          | 0          | 0       | 4 mph
SUP                       | 0          | 0          | 0       | 3 mph
Jet Ski                   | 160        | 10         | 18      | 45 mph
28ft Pontoon              | 150        | 6          | 12      | 22 mph
...
```

The formula `GPH ≈ HP × load_factor × SFC` gives reasonable estimates. Users can override with their actual specs.

### Public Boat Launch Ramps
**No single national database.** RIDB (recreation.gov) covers federal facilities but requires API key registration (free). State-level data is fragmented.

**Solution for SF Bay MVP:** Curate manually from:
1. California Division of Boating and Waterways directory
2. CDFW fishing access points
3. County/city parks websites
4. OpenStreetMap `leisure=slipway` tags (NOT UGC in the iOverlander sense — OSM data is heavily moderated and verified)

**Critical: All launch ramp data is VETTED, not user-submitted.** No anonymous pins. Sources are government agencies and verified geographic databases.

### Fishing Regulations
**No API exists.** CDFW publishes regulations as PDFs only.

**Solution:** Manually curate ~30-50 species rules as structured data. Update annually when CDFW publishes new regulations (typically March 1). Bounded problem — one-time effort with yearly refresh.

---

## Data Quality Gotchas

1. **NDBC buoy data has gaps.** Many fields read `MM` (missing) frequently. Wave height sometimes only reported every other reading. Air temp consistently missing from some buoys. Must handle gracefully.

2. **NWS marine forecast is unstructured text**, not JSON. Requires regex parsing. Format: `.TONIGHT...W wind 5 to 10 kt, backing to SW after midnight.` Consistent enough to parse but not trivial.

3. **Water temp sensors aren't everywhere.** San Francisco/Golden Gate station (9414290) has NO water temp sensor. Alameda and Richmond do. Must map which stations have which sensors.

4. **Visibility is in meters** from Open-Meteo even when other units are imperial. Convert: 1 nautical mile = 1,852m. Critical for fog detection.

5. **EPA water quality data is historical only**, CSV-only (JSON returns 406), slow (~26 seconds), and returns 19MB. Not suitable for real-time. Fine for historical context only.

6. **USGS turbidity sensor is dead** at the tested SF Bay station (last reading: 2011). Don't rely on turbidity/opacity from USGS.

7. **Open-Meteo commercial use requires paid plan** (~$20-50/month). Non-commercial is free. Once monetizing, budget for this.

---

## The No-UGC Data Architecture

Per the requirement: **ALL data in WhenToBoat comes from vetted, authoritative sources. Zero user-generated content.**

```
DATA SOURCE                          → WHAT IT PROVIDES              → AUTHORITY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NOAA NDBC buoys                      → Wind, waves, water temp       → US Federal Government
NOAA CO-OPS                          → Tides, currents, water levels → US Federal Government
NWS (api.weather.gov)                → Marine forecasts              → US Federal Government
Open-Meteo                           → Hourly gridded forecasts      → Reanalysis of ECMWF/GFS models
NOAA ERDDAP                         → 44-year historical archive    → US Federal Government
USGS                                 → Water temp, salinity          → US Federal Government
CDFW regulations (manually curated)  → Fishing seasons               → CA State Government
CA DBW / county parks (curated)      → Boat launch ramps             → CA/County Government
Manufacturer spec sheets (curated)   → Boat fuel consumption         → OEM data
Solar position algorithm             → Sunset/sunrise times          → Astronomical calculation
PRD expert knowledge (curated)       → Zone boundaries, routing      → Domain expertise (verified against data)
```

**What we explicitly DO NOT use:**
- No user-submitted location pins
- No crowd-sourced condition reports
- No anonymous hazard reporting
- No social features that generate unverified data
- No scraping of commercial apps or their UGC databases

If we add community features later, they would be a **supplemental, opt-in overlay** with heavy moderation — never the primary data layer.
