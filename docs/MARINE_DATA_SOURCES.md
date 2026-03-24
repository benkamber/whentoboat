# Marine & Weather Data Sources for SF Bay Recreational Boating App

**Research Date:** 2026-03-23
**Purpose:** Comprehensive catalog of free, public, reliable data sources

---

## 1. NOAA NDBC (National Data Buoy Center)

### Overview
The NDBC maintains a network of buoys and coastal stations providing meteorological and oceanographic observations. Data is distributed as flat files via HTTPS -- there is no native REST/JSON API, but data is machine-parseable.

### SF Bay Area Stations

| Station ID | Name / Location | Lat | Lon | Owner |
|-----------|----------------|-----|-----|-------|
| **46026** | San Francisco, 18NM West of SF | 37.750N | 122.838W | NDBC |
| **46237** | San Francisco Bar (Waverider) | 37.788N | 122.634W | CDIP |
| **46214** | Point Reyes, CA | 37.945N | 123.470W | CDIP |
| **46012** | Half Moon Bay, 24NM SSW of SF | 37.356N | 122.881W | NDBC |
| **46013** | Bodega Bay, 48NM NNW of SF | 38.235N | 123.317W | NDBC |
| **46247** | San Francisco Offshore | 37.753N | 122.833W | NDBC |
| **FTPC1** | Fort Point, San Francisco | 37.806N | 122.466W | NWS |
| **TIBC1** | Tiburon Pier, SF Bay | 37.892N | 122.447W | NOS |
| **AAMC1** | Alameda, CA | 37.772N | 122.300W | NOS |

### Data Fields Available (station 46026 as reference)
- **Wind**: direction, speed, gust, 10m/20m wind speeds
- **Waves**: significant wave height, dominant wave period, average wave period, mean wave direction, swell height/period/direction, wind wave height/period/direction, wave steepness
- **Atmospheric**: barometric pressure, pressure tendency, air temperature, dew point, visibility
- **Water**: sea surface temperature (1.5m below waterline), salinity, tide height (above MLLW)

### Real-Time Data (last 45 days)

**Base URL:** `https://www.ndbc.noaa.gov/data/realtime2/`

**URL Format:** `https://www.ndbc.noaa.gov/data/realtime2/{STATION_ID}.{DATATYPE}`

**File types available:**
| Extension | Data Type |
|-----------|-----------|
| `.txt` | Standard meteorological |
| `.drift` | Drifting buoy data |
| `.cwind` | Continuous winds |
| `.spec` | Spectral wave summary |
| `.data_spec` | Raw spectral wave data |
| `.swdir` | Spectral wave direction (alpha1) |
| `.swdir2` | Spectral wave direction (alpha2) |
| `.swr1` | Spectral wave (r1) |
| `.swr2` | Spectral wave (r2) |
| `.adcp` | Acoustic Doppler Current Profiler |
| `.ocean` | Oceanographic data |
| `.tide` | Tidal data |

**Sample requests:**
```
# Standard meteorological data for station 46026
https://www.ndbc.noaa.gov/data/realtime2/46026.txt

# Spectral wave data for station 46026
https://www.ndbc.noaa.gov/data/realtime2/46026.spec

# Continuous wind data for Fort Point
https://www.ndbc.noaa.gov/data/realtime2/FTPC1.cwind
```

**Format:** Space-delimited text with header rows (2 header lines: field names + units)
**Update frequency:** Most stations report hourly; data usually available by 25 minutes after the hour
**Retention:** Last 45 days (at least 24 hours for non-NDBC stations)

### Historical Data Archive

**Base URL:** `https://www.ndbc.noaa.gov/data/historical/{DATATYPE}/`

**URL Format:** `https://www.ndbc.noaa.gov/data/historical/stdmet/{STATION_ID}h{YEAR}.txt.gz`

**Download page:** `https://www.ndbc.noaa.gov/download_data.php?filename={STATION_ID}h{YEAR}.txt.gz&dir=data/historical/stdmet/`

**Available data types:** stdmet, cwind, adcp, ocean, swden, wlevel

**Historical range:** From station inception (some from 1970s) through the present. Files are gzipped text.

**Data types directories:**
```
https://www.ndbc.noaa.gov/data/historical/stdmet/
https://www.ndbc.noaa.gov/data/historical/cwind/
https://www.ndbc.noaa.gov/data/historical/ocean/
https://www.ndbc.noaa.gov/data/historical/swden/
```

### Authentication & Rate Limits
- **No authentication required**
- **No formal rate limits** documented, but use reasonable request frequency
- **Format:** Text/CSV (not JSON natively)

### Sources
- https://www.ndbc.noaa.gov/faq/rt_data_access.shtml
- https://www.ndbc.noaa.gov/historical_data.shtml
- https://www.ndbc.noaa.gov/station_page.php?station=46026

---

## 2. NOAA NWS Marine Forecasts (api.weather.gov)

### Overview
The National Weather Service provides a free, modern REST API at `api.weather.gov` serving marine zone forecasts in GeoJSON/JSON-LD format.

### SF Bay Marine Zones

| Zone ID | Description |
|---------|-------------|
| **PZZ530** | San Pablo Bay, Suisun Bay, West Delta, SF Bay north of Bay Bridge |
| **PZZ531** | San Francisco Bay south of the Bay Bridge |
| **PZZ540** | Coastal Waters from Point Arena to Point Reyes, 0-10 NM |
| **PZZ545** | Coastal Waters from Point Reyes to Pigeon Point, 0-10 NM |
| **PZZ560** | Coastal Waters from Pigeon Point to Point Pinos, 0-10 NM |
| **PZZ535** | Monterey Bay |
| **PZZ565** | Waters Point Pinos to Point Piedras Blancas, 0-10 NM |

### API Endpoints

**Base URL:** `https://api.weather.gov`

```
# Zone forecast (marine text forecast)
GET https://api.weather.gov/zones/forecast/{zoneId}/forecast

# Example: SF Bay north of Bay Bridge
GET https://api.weather.gov/zones/forecast/PZZ530/forecast

# Example: SF Bay south of Bay Bridge
GET https://api.weather.gov/zones/forecast/PZZ531/forecast

# Active alerts for a marine zone
GET https://api.weather.gov/alerts/active?zone=PZZ530

# All active alerts for California
GET https://api.weather.gov/alerts/active?area=CA

# Grid-based forecast (includes marine grids)
GET https://api.weather.gov/gridpoints/{office}/{gridX},{gridY}
```

**Also available as raw text:**
```
https://tgftp.nws.noaa.gov/data/forecasts/marine/coastal/pz/pzz530.txt
https://tgftp.nws.noaa.gov/data/forecasts/marine/coastal/pz/pzz531.txt
```

### Authentication
- **No API key required**
- **Must include User-Agent header** identifying your application
  ```
  User-Agent: (whentoboat.com, contact@whentoboat.com)
  ```

### Rate Limits
- Reasonable rate limiting; requests return error if exceeded
- Retry after ~5 seconds if rate-limited
- Direct client requests less likely to hit limits

### Data Format
- **Default:** `application/geo+json` (GeoJSON)
- Also supports: `application/ld+json`, `application/vnd.noaa.dwml+xml`, `application/cap+xml`, `application/atom+xml`

### Update Frequency
- Marine forecasts typically updated every 6 hours by NWS Monterey (MTR) office

### Sources
- https://www.weather.gov/documentation/services-web-api
- https://weather-gov.github.io/api/

---

## 3. NOAA Tides & Currents (CO-OPS)

### Overview
CO-OPS provides a well-documented REST API for tide predictions, water levels, currents, and meteorological data. This is one of the best-documented free marine APIs.

### API Endpoint

**Base URL:** `https://api.tidesandcurrents.noaa.gov/api/prod/datagetter`

### SF Bay Tide/Water Level Stations

| Station ID | Name |
|-----------|------|
| **9414290** | San Francisco (primary reference station) |
| **9414523** | Redwood City |
| **9414750** | Alameda |
| **9414392** | Oyster Point Marina |
| **9415020** | Point Reyes |
| **9414863** | Richmond |
| **9415144** | Port Chicago |

### SF Bay Current Prediction / OFS Stations

| Station ID | Name |
|-----------|------|
| **SFB1201** | San Francisco Bay Entrance (Outside) |
| **SFB1203** | East of Golden Gate Bridge |
| **SFB1205** | North of Pier 35 |

### Available Products

| Product | Description |
|---------|-------------|
| `predictions` | Tide predictions (harmonic) |
| `water_level` | Observed water levels |
| `hourly_height` | Hourly water level height |
| `high_low` | High/low tide observations |
| `daily_mean` | Daily mean water level |
| `monthly_mean` | Monthly mean water level |
| `air_temperature` | Air temperature |
| `water_temperature` | Water temperature |
| `wind` | Wind speed and direction |
| `air_pressure` | Barometric pressure |
| `conductivity` | Water conductivity |
| `visibility` | Visibility |
| `humidity` | Relative humidity |
| `salinity` | Salinity |
| `currents` | Observed currents |
| `currents_predictions` | Predicted currents |
| `ofs_water_level` | Operational forecast water level |

### API Parameters

| Parameter | Values | Notes |
|-----------|--------|-------|
| `station` | Station ID | Required |
| `product` | See products above | Required |
| `begin_date` / `end_date` | YYYYMMDD or MM/DD/YYYY HH:MM | Date range |
| `date` | `today`, `latest`, `recent` | Shortcut |
| `range` | Hours | Duration from reference date |
| `datum` | MLLW, MHHW, MSL, NAVD, etc. | Required for water level products |
| `units` | `metric`, `english` | |
| `time_zone` | `gmt`, `lst`, `lst_ldt` | Default: GMT |
| `interval` | `h`, `hilo`, `max_slack`, 1-60 (min) | Varies by product |
| `format` | `json`, `xml`, `csv` | Default: xml |
| `application` | Your app name | Recommended |

### Data Length Limits Per Request

| Data Type | Max Duration |
|-----------|-------------|
| 1-minute data | 4 days |
| 6-minute data | 1 month |
| Hourly data | 1 year |
| High/Low & Daily | 1 year |
| Daily Means | 10 years |
| Monthly Means | 200 years |

### Sample Requests

```
# Tide predictions for SF, today, high/low only, JSON
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=9414290&product=predictions&datum=MLLW&time_zone=lst_ldt&interval=hilo&units=english&format=json

# Water temperature for Alameda, last 24 hours
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=latest&station=9414750&product=water_temperature&units=english&time_zone=lst_ldt&format=json

# Wind data for SF, today
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?date=today&station=9414290&product=wind&units=english&time_zone=lst_ldt&format=json

# 6-minute water levels for SF, last 48 hours
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=20260322&end_date=20260323&station=9414290&product=water_level&datum=MLLW&units=english&time_zone=lst_ldt&format=json

# Monthly mean water levels for SF (historical)
https://api.tidesandcurrents.noaa.gov/api/prod/datagetter?begin_date=20200101&end_date=20251231&station=9414290&product=monthly_mean&datum=MLLW&units=english&time_zone=gmt&format=json
```

### Sample JSON Response (tide predictions)
```json
{
  "predictions": [
    {"t": "2026-03-23 02:40", "v": "6.171", "type": "H"},
    {"t": "2026-03-23 09:48", "v": "-0.472", "type": "L"},
    {"t": "2026-03-23 15:32", "v": "4.558", "type": "H"},
    {"t": "2026-03-23 21:09", "v": "1.742", "type": "L"}
  ]
}
```

### SFBOFS (Operational Forecast System)
In addition to the API, NOAA runs the San Francisco Bay Operational Forecast System (SFBOFS) providing nowcast + 48-hour forecasts for water levels, currents, temperature, and salinity at 50+ locations, updated 4x daily. Uses the FVCOM model.

**Coverage:** SF Bay entrance through South/Central/North Bays, San Pablo Bay, Carquinez Strait, Suisun Bay, Sacramento River to Rio Vista, San Joaquin River to Antioch.

### Authentication & Rate Limits
- **No API key required** (but `application` parameter recommended)
- **Throttling** during heavy loads -- add sleep between successive calls
- **Format:** JSON, XML, CSV

### Metadata API
```
https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations.json
https://api.tidesandcurrents.noaa.gov/mdapi/prod/webapi/stations/9414290.json
```

### Sources
- https://api.tidesandcurrents.noaa.gov/api/prod/
- https://tidesandcurrents.noaa.gov/api-helper/url-generator.html
- https://tidesandcurrents.noaa.gov/ofs/sfbofs/sfbofs.html

---

## 4. NOAA ERDDAP

### Overview
ERDDAP provides a powerful RESTful API to access oceanographic and meteorological datasets. The key dataset for SF Bay buoy data is `cwwcNDBCMet` -- NDBC Standard Meteorological Buoy Data from 1970-present.

### ERDDAP Servers

| Server | URL |
|--------|-----|
| **CoastWatch West Coast** | `https://coastwatch.pfeg.noaa.gov/erddap/` |
| **NCEI** | `https://www.ncei.noaa.gov/erddap/` |
| **CeNCOOS** | `https://erddap.cencoos.org/erddap/` |
| **PolarWatch** | `https://polarwatch.noaa.gov/erddap/` |

### Key Dataset: cwwcNDBCMet

**Coverage:** 1970-02-26 to present (updated every 5 minutes)
**Variables:** station, longitude, latitude, time, wd (wind direction), wspd (wind speed), gst (gust), wvht (wave height), dpd (dominant wave period), apd (average wave period), mwd (wave direction), bar (pressure), atmp (air temp), wtmp (water temp), dewp (dewpoint), vis (visibility), ptdy (pressure tendency), tide, wspu (zonal wind), wspv (meridional wind)

### URL Format

```
https://coastwatch.pfeg.noaa.gov/erddap/tabledap/{datasetID}.{fileType}?{query}
```

### Available Output Formats
`.csv`, `.json`, `.nc` (NetCDF), `.mat` (MATLAB), `.htmlTable`, `.tsv`, `.geoJson`, `.kml`, `.parquet`, `.png`, `.pdf`

### Query Syntax
```
{variables}&{constraint1}&{constraint2}...
```

**Constraint operators:** `=`, `!=`, `<`, `<=`, `>`, `>=`, `=~` (regex)

### Sample Requests

```
# Get wind speed, wave height, water temp for station 46026, last 7 days, JSON
https://coastwatch.pfeg.noaa.gov/erddap/tabledap/cwwcNDBCMet.json?station,time,wspd,wvht,wtmp&station=%2246026%22&time>=now-7days

# Get all available data for FTPC1 (Fort Point), last 24 hours, CSV
https://coastwatch.pfeg.noaa.gov/erddap/tabledap/cwwcNDBCMet.csv?station,time,wspd,gst,wvht,dpd,atmp,wtmp,bar&station=%22FTPC1%22&time>=now-1day

# Historical data for station 46026 for all of 2024, CSV
https://coastwatch.pfeg.noaa.gov/erddap/tabledap/cwwcNDBCMet.csv?station,time,wspd,gst,wvht,dpd,atmp,wtmp&station=%2246026%22&time>=2024-01-01T00:00:00Z&time<=2024-12-31T23:59:59Z

# List all stations (distinct station IDs)
https://coastwatch.pfeg.noaa.gov/erddap/tabledap/cwwcNDBCMet.json?station&distinct()
```

### CeNCOOS Datasets for SF Bay
CeNCOOS ERDDAP (`erddap.cencoos.org`) hosts additional SF Bay datasets:
- `gov_noaa_nws_hads_san_francisco_` -- San Francisco Downtown (air temp, humidity, precip, battery voltage)
- `gov_usgs_nwis_374811122235001` -- SF Bay at Pier 17 (USGS water quality)

### Authentication & Rate Limits
- **No authentication required**
- **No formal rate limits** but large requests may time out
- Use `&orderBy()` and time constraints to limit result sizes

### Sources
- https://coastwatch.pfeg.noaa.gov/erddap/tabledap/documentation.html
- https://coastwatch.pfeg.noaa.gov/erddap/info/cwwcNDBCMet/index.html
- https://coastwatch.pfeg.noaa.gov/erddap/tabledap/cwwcNDBCMet.html

---

## 5. EPA / State Water Quality

### 5a. Water Quality Portal (WQP)

**The best programmatic source for water quality data in SF Bay.** Aggregates data from USGS, EPA, and 400+ agencies.

**Base URL:** `https://www.waterqualitydata.us/data/`

**Endpoints:**
| Endpoint | Description |
|----------|-------------|
| `/data/Station/search?` | Find monitoring stations |
| `/data/Result/search?` | Get water quality results |
| `/data/Activity/search?` | Get sampling activities |
| `/data/summary/monitoringLocation/search?` | Summary statistics |

**Key Parameters:**

| Parameter | Example | Description |
|-----------|---------|-------------|
| `bBox` | `-122.6,37.4,-122.0,37.9` | Bounding box (W,S,E,N) |
| `statecode` | `US%3A06` | California FIPS code |
| `countycode` | `US%3A06%3A075` | San Francisco County |
| `siteType` | `Estuary` | Site type filter |
| `characteristicName` | `Enterococci` | Parameter name (case-sensitive) |
| `characteristicType` | `Microbiological` | Parameter group |
| `startDateLo` / `startDateHi` | `01-01-2020` | Date range (MM-DD-YYYY) |
| `mimeType` | `csv`, `json`, `geojson`, `xml`, `xlsx`, `kml` | Output format |
| `zip` | `yes` | Compress response |
| `providers` | `NWIS`, `STORET`, `STEWARDS` | Data source filter |

**Sample Requests:**
```
# Find water quality stations in SF Bay bounding box
https://www.waterqualitydata.us/data/Station/search?bBox=-122.6,37.4,-122.0,37.9&siteType=Estuary&mimeType=csv

# Get bacteria results for SF Bay area
https://www.waterqualitydata.us/data/Result/search?bBox=-122.6,37.4,-122.0,37.9&characteristicName=Enterococci&mimeType=csv&zip=yes

# Summary of monitoring locations in San Francisco County
https://www.waterqualitydata.us/data/summary/monitoringLocation/search?statecode=US%3A06&countycode=US%3A06%3A075&characteristicType=Microbiological&mimeType=csv
```

**Authentication:** None required
**Rate Limits:** No explicit limits documented; large downloads auto-compressed
**Formats:** CSV, JSON, GeoJSON, XML, TSV, XLSX, KML/KMZ

### 5b. EPA BEACON 2.0 (Beach Advisory and Closing Online Notification)

**URL:** `https://beacon.epa.gov/ords/beacon2/r/beacon_apex/beacon2/`

BEACON provides beach advisory, closure, and water quality monitoring data reported by states. However, BEACON 2.0 does **not** offer a public REST API for programmatic access. Data can be browsed and exported via the web interface.

**Workaround:** Use the Water Quality Portal (above) with `characteristicName=Enterococci` or `characteristicName=Escherichia%20coli` for beach bacteria data.

### 5c. California State Water Boards

Beach monitoring in the Bay Area is managed by county health departments. Data flows into both the WQP and the State Water Board's portal.

**URL:** `https://www.waterboards.ca.gov/water_issues/programs/beaches/beach_water_quality/`

**Not programmatically accessible** -- web-only interface.

### 5d. SF Estuary Institute (SFEI) Regional Monitoring Program

Long-term water quality monitoring in SF Bay since 1993. Data available for download but not via API.

**URL:** `https://www.sfei.org/programs/rmp`

### Sources
- https://www.waterqualitydata.us/webservices_documentation/
- https://beacon.epa.gov/ords/beacon2/r/beacon_apex/beacon2/about-page
- https://www.waterboards.ca.gov/sanfranciscobay/water_issues/programs/water_quality.html

---

## 6. Open-Meteo

### Overview
Open-Meteo is an **open-source** weather API providing marine forecasts, historical weather, and more. **No API key required for non-commercial use.** This is arguably the most developer-friendly free weather API available.

### Marine Weather API

**Endpoint:** `https://marine-api.open-meteo.com/v1/marine`

**Hourly Variables:**
- `wave_height`, `wave_direction`, `wave_period`, `wave_peak_period`
- `wind_wave_height`, `wind_wave_direction`, `wind_wave_period`, `wind_wave_peak_period`
- `swell_wave_height`, `swell_wave_direction`, `swell_wave_period`, `swell_wave_peak_period`
- Secondary swell: `secondary_swell_wave_height/direction/period/peak_period`
- Tertiary swell: `tertiary_swell_wave_height/direction/period/peak_period` (GFS Wave only)
- `ocean_current_velocity`, `ocean_current_direction`
- `sea_surface_temperature`
- `sea_level_height` (includes tides)

**Daily Variables:** `wave_height_max`, `wave_direction_dominant`, `wave_period_max`, `wind_wave_height_max`, `swell_wave_height_max`

**Models Available:**

| Model | Region | Resolution | Updates | Forecast Range |
|-------|--------|-----------|---------|----------------|
| MeteoFrance MFWAM | Global | ~8km | 12h | 10 days |
| ECMWF WAM | Global | 9km | 6h | 15 days |
| NCEP GFS Wave 0.25 | Global | ~25km | 6h | 16 days |
| NCEP GFS Wave 0.16 | Americas/Atlantic | ~16km | 6h | 16 days |
| DWD EWAM | Europe | ~5km | 12h | 8 days |
| ERA5-Ocean | Global | ~50km | Daily (5-day lag) | 1940-present |

**Parameters:**
| Parameter | Values |
|-----------|--------|
| `latitude` / `longitude` | Decimal degrees (required) |
| `hourly` | Comma-separated variable names |
| `daily` | Comma-separated variable names |
| `current` | Comma-separated variable names |
| `forecast_days` | 0-8 (default 5) |
| `past_days` | 0-92 |
| `timezone` | IANA timezone or `auto` |
| `length_unit` | `metric` or `imperial` |
| `cell_selection` | `sea`, `land`, `nearest` |
| `timeformat` | `iso8601` or `unixtime` |

**Sample Request:**
```
# Marine forecast for SF Bay area (37.8, -122.4), 7 days
https://marine-api.open-meteo.com/v1/marine?latitude=37.8&longitude=-122.4&hourly=wave_height,wave_period,wave_direction,wind_wave_height,swell_wave_height,sea_surface_temperature,ocean_current_velocity,ocean_current_direction&forecast_days=7&timezone=America/Los_Angeles&length_unit=imperial

# With current conditions
https://marine-api.open-meteo.com/v1/marine?latitude=37.8&longitude=-122.4&current=wave_height,wave_period,wave_direction,sea_surface_temperature&timezone=auto
```

### Weather Forecast API

**Endpoint:** `https://api.open-meteo.com/v1/forecast`

Provides standard weather variables: temperature, wind speed/direction/gusts, precipitation, cloud cover, pressure, humidity, visibility, UV index, etc.

**Sample Request:**
```
https://api.open-meteo.com/v1/forecast?latitude=37.8&longitude=-122.4&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation_probability,visibility,pressure_msl&forecast_days=7&timezone=America/Los_Angeles&wind_speed_unit=kn
```

### Historical Weather API

**Endpoint:** `https://archive-api.open-meteo.com/v1/archive`

**Coverage:** 1940-present (ERA5 reanalysis), 2017-present (ECMWF IFS at 9km)

**Sample Request:**
```
https://archive-api.open-meteo.com/v1/archive?latitude=37.8&longitude=-122.4&start_date=2025-01-01&end_date=2025-12-31&hourly=temperature_2m,wind_speed_10m,wind_gusts_10m&timezone=America/Los_Angeles
```

**NOTE:** Historical, climate, and ensemble data access is limited to the **Professional API Plan** on the free tier.

### Rate Limits (Free Non-Commercial Tier)

| Limit | Value |
|-------|-------|
| Per minute | 600 calls |
| Per hour | 5,000 calls |
| Per day | 10,000 calls |
| Per month | 300,000 calls |

- **No API key required** for non-commercial use
- **Commercial use requires paid plan** (starts at EUR 15/month)
- **Attribution required** under CC BY 4.0 license
- Historical data access requires Professional plan or higher

### Data Format
- **JSON** (default)
- Also supports: CSV, XLSX

### Important Limitation
"Accuracy at coastal areas is limited" and "not suitable for coastal navigation." The marine model resolution (~8-25km) may not capture SF Bay's complex geography well. Best for offshore conditions.

### Sources
- https://open-meteo.com/en/docs/marine-weather-api
- https://open-meteo.com/en/docs/historical-weather-api
- https://open-meteo.com/en/pricing

---

## 7. Copernicus Marine Service (CMEMS)

### Overview
The EU's Copernicus Marine Service provides free, registration-required access to global ocean analysis and forecast data, including waves, currents, temperature, and salinity. No quotas on volume or bandwidth.

### Registration
- **Free account** at https://data.marine.copernicus.eu
- Username/password authentication (not API key)
- No quotas on data volume or bandwidth

### Key Products for SF Bay

| Product ID | Description |
|-----------|-------------|
| `GLOBAL_ANALYSISFORECAST_WAV_001_027` | Global Ocean Waves Analysis & Forecast (MeteoFrance, 0.08 deg, 10 days) |
| `GLOBAL_ANALYSISFORECAST_PHY_001_024` | Global Ocean Physics Analysis & Forecast (1/12 deg, 10 days) |

### Access Methods

**1. Python Toolbox (recommended):**
```bash
pip install copernicusmarine
```

```python
import copernicusmarine

# Login (one-time)
copernicusmarine.login()

# Subset wave forecast data for SF Bay
copernicusmarine.subset(
    dataset_id="cmems_mod_glo_wav_anfc_0.083deg_PT3H-i",
    variables=["VHM0", "VTPK", "VMDR"],  # wave height, peak period, mean direction
    minimum_longitude=-123.0,
    maximum_longitude=-122.0,
    minimum_latitude=37.4,
    maximum_latitude=38.0,
    start_datetime="2026-03-23T00:00:00",
    end_datetime="2026-03-30T00:00:00",
    output_filename="sf_bay_waves.nc"
)
```

**2. WMTS API** (Web Map Tile Service) for map overlays
**3. CSW API** for metadata queries:
```
https://csw.marine.copernicus.eu/geonetwork/csw-MYOCEAN-CORE-PRODUCTS/eng/csw
```

### Data Formats
- NetCDF (primary)
- Also accessible as xarray datasets in Python

### Rate Limits
- **No quotas** on volume or bandwidth

### Limitations
- Resolution (1/12 degree ~ 9km) too coarse for within-bay conditions
- Best for offshore Pacific conditions approaching SF Bay
- Requires Python toolbox (no simple REST/JSON API for data)

### Sources
- https://help.marine.copernicus.eu/en/articles/4794731-which-apis-are-provided
- https://help.marine.copernicus.eu/en/articles/7949409-copernicus-marine-toolbox-introduction
- https://data.marine.copernicus.eu/product/GLOBAL_ANALYSISFORECAST_WAV_001_027/description

---

## 8. USGS Water Data

### Overview
USGS maintains a continuous water quality monitoring network in SF Bay since 1989, with 8 primary stations reporting every 15 minutes via cellular telemetry.

### SF Bay Continuous Monitoring Stations

| USGS Station Number | Location |
|--------------------|----------|
| **11185185** | Suisun Bay at Mallard Island |
| **11455780** | Suisun Bay at Benicia Bridge |
| **11455820** | Carquinez Strait at Carquinez Bridge |
| **375607122264701** | SF Bay at Richmond-San Rafael Bridge |
| **374938122251801** | SF Bay at NE Shore of Alcatraz Island |
| **374811122235001** | SF Bay at Pier 17, San Francisco |
| **11162765** | SF Bay at San Mateo Bridge, Foster City |
| **373015122071000** | South SF Bay at Dumbarton Bridge |

### Parameters Monitored
Water temperature, salinity, suspended-sediment concentration (SSC), turbidity, dissolved oxygen, specific conductance, water level (at some stations)

### 8a. USGS Water Services API (Legacy, Stable)

**Base URL:** `https://waterservices.usgs.gov/nwis/iv/`

**Instantaneous Values (Real-Time) Endpoint:**
```
https://waterservices.usgs.gov/nwis/iv/?{parameters}
```

**Key Parameters:**
| Parameter | Description | Example |
|-----------|-------------|---------|
| `sites` | Site numbers (max 100) | `11162765` |
| `stateCd` | State code | `ca` |
| `bBox` | Bounding box (W,S,E,N; max 25 deg) | `-122.6,37.4,-122.0,37.9` |
| `parameterCd` | USGS parameter codes | `00010` (water temp) |
| `period` | ISO-8601 duration | `P7D` (7 days) |
| `startDT` / `endDT` | ISO-8601 dates | `2026-03-01` |
| `siteType` | Site type | `ES` (estuary) |
| `format` | Output format | `json` or `rdb` |

**Common Parameter Codes:**
| Code | Parameter |
|------|-----------|
| `00010` | Water temperature |
| `00060` | Discharge |
| `00065` | Gage height |
| `00095` | Specific conductance |
| `00300` | Dissolved oxygen |
| `00480` | Salinity |
| `63680` | Turbidity |

**Sample Requests:**
```
# Real-time water temperature at SF Bay Pier 17
https://waterservices.usgs.gov/nwis/iv/?site=374811122235001&parameterCd=00010&format=json

# All real-time data for SF Bay at San Mateo Bridge, last 7 days
https://waterservices.usgs.gov/nwis/iv/?site=11162765&period=P7D&format=json

# Multiple SF Bay stations, water temp + salinity
https://waterservices.usgs.gov/nwis/iv/?sites=374811122235001,11162765,375607122264701&parameterCd=00010,00480&period=P7D&format=json

# Daily values service
https://waterservices.usgs.gov/nwis/dv/?site=11162765&parameterCd=00010&startDT=2025-01-01&endDT=2025-12-31&format=json
```

### 8b. USGS OGC APIs (Newer)

**Base URL:** `https://api.waterdata.usgs.gov/`
- Provides OGC-compliant API access
- API key available for higher rate limits: `https://api.waterdata.usgs.gov/signup/`
- Still under active development

### 8c. USGS SF Bay Water Quality Database

**URL:** `https://sfbay.wr.usgs.gov/water-quality-database/`

Research cruise data from 1969-present with 23 variables including chlorophyll-a, dissolved oxygen, nutrients (nitrite, nitrate, ammonium, phosphate, silicate), salinity, temperature, depth, extinction coefficient, and suspended particulate matter.

**Access:** Web interface with CSV export. Internal API: `cruisedata.php?year={YEAR}`

### Authentication & Rate Limits
- **No authentication required** for legacy Water Services
- Optional API key for OGC APIs (higher rate limits)
- IPs blocked for "excessive" usage (no specific threshold published)
- Data available from October 1, 2007 onward for instantaneous values

### Sources
- https://waterservices.usgs.gov/nwis/iv/
- https://pubs.usgs.gov/publication/fs20223087/full
- https://sfbay.wr.usgs.gov/water-quality-database/
- https://api.waterdata.usgs.gov/docs/

---

## 9. Other Free Marine Data Sources

### 9a. Stormglass.io

**Endpoint:** `https://api.stormglass.io/v2/weather/point`

**Free Tier:** 10 requests/day, all parameters available, non-commercial only

**Parameters:** Wave height, swell, currents, wind, tides, water temperature, visibility, air temperature, precipitation, cloud cover, humidity, pressure

**Authentication:** API key required (free signup at stormglass.io)

**Sample Request:**
```bash
curl -X GET "https://api.stormglass.io/v2/weather/point?lat=37.8&lng=-122.4&params=waveHeight,wavePeriod,windSpeed,waterTemperature" \
  -H "Authorization: YOUR_API_KEY"
```

**Rate Limit:** 10 requests/day (free), up to 10 days forecast + historical
**Format:** JSON
**Source:** https://stormglass.io/

### 9b. Windy API (Point Forecast)

**Endpoint:** `POST https://api.windy.com/api/point-forecast/v2`

**Free/Trial Tier:** Available for development purposes only (not production)

**Available Models:** GFS, GFS Wave, AROME, IconEU, namConus, namHawaii, namAlaska, CAMS

**Marine Parameters:** `waves` (height, period, direction), `windWaves`, `swell1`, `swell2`

**Authentication:** API key required (free signup at api.windy.com)

**Sample Request:**
```json
POST https://api.windy.com/api/point-forecast/v2
{
    "lat": 37.8,
    "lon": -122.4,
    "model": "gfsWave",
    "parameters": ["waves", "windWaves", "swell1", "wind", "temp"],
    "levels": ["surface"],
    "key": "YOUR_API_KEY"
}
```

**Format:** JSON
**Limitation:** Trial version for development only, not production use
**Source:** https://api.windy.com/point-forecast/docs

### 9c. WorldTides API

**Endpoint:** `https://www.worldtides.info/api/v3`

**Free Tier:** 100 credits on signup (1 prediction = 2 credits = ~50 predictions)

**Authentication:** API key required

**Sample Request:**
```
https://www.worldtides.info/api/v3?heights&lat=37.8&lon=-122.4&key=YOUR_API_KEY
```

**After free credits:** 10,000 credits for $10 (5,000 predictions)
**Source:** https://www.worldtides.info/apidocs

### 9d. SeaLegs AI

**Endpoint:** `https://api.sealegs.ai/v3/spotcast`

**Free Tier:** Free developer account, but pay-as-you-go pricing ($10 for 200 forecast-day credits)

**Authentication:** API key (X-API-Key header)

**Parameters:** Wind speed, gusts, wave height, swell, precipitation, visibility, plus AI-analyzed vessel-specific forecasts

**Source:** https://developer.sealegs.ai/

### 9e. Windy.app (Separate from Windy API)

Different service from Windy.com. Provides forecasts for sailing/marine use but no public API.

### 9f. Meteosource Maritime Weather API

**Endpoint:** `https://www.meteosource.com/api/`

Commercial API with free trial. Maritime-specific forecasts.

**Source:** https://www.meteosource.com/api-maritime-weather

---

## Summary: Recommended Data Source Stack

For a **recreational boating app for SF Bay**, here is the recommended priority:

### Tier 1: Core Data (Free, No API Key)

| Data Need | Best Source | Why |
|-----------|-----------|-----|
| **Tide predictions** | NOAA CO-OPS API | Best accuracy, JSON, no key |
| **Real-time water levels** | NOAA CO-OPS API | Official NOAA data |
| **Wind observations** | NOAA CO-OPS + NDBC | Station data at Fort Point, buoys |
| **Marine text forecasts** | NWS api.weather.gov | Official NWS zones PZZ530/531 |
| **Buoy observations** | NOAA ERDDAP (cwwcNDBCMet) | JSON output, flexible queries, 1970-present |
| **Weather forecast** | Open-Meteo Forecast API | No key, generous limits |
| **Water quality** | Water Quality Portal (WQP) | Aggregated multi-agency data |

### Tier 2: Enhanced Data (Free, API Key Required)

| Data Need | Best Source | Why |
|-----------|-----------|-----|
| **Wave forecast** | Open-Meteo Marine API | No key needed, good model selection |
| **Ocean model data** | Copernicus Marine | Free, high-quality ECMWF models |
| **Water quality real-time** | USGS Water Services | 8 stations, 15-min updates |

### Tier 3: Supplementary (Limited Free Tier)

| Data Need | Best Source | Limitation |
|-----------|-----------|------------|
| **Multi-model marine data** | Stormglass | 10 req/day |
| **Marine forecast (dev)** | Windy Point Forecast | Dev-only trial |
| **Historical weather** | Open-Meteo Archive | Requires paid plan |

### Key Caveats for SF Bay

1. **Offshore wave models** (Open-Meteo, Copernicus, GFS Wave) have 8-25km resolution and do NOT capture conditions inside SF Bay. They are useful for conditions at the Golden Gate and offshore.
2. **Within-bay conditions** are best captured by NOAA CO-OPS stations (wind, water level, temperature) and NDBC coastal stations (FTPC1, TIBC1, AAMC1).
3. **Current predictions** in SF Bay are available through CO-OPS for select stations and through SFBOFS model output (48-hour forecasts at 50+ locations).
4. **Water quality** data has significant latency -- most monitoring is discrete (weekly/monthly sampling), not real-time. Only USGS continuous monitoring stations provide near-real-time water quality data.
