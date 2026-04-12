# Canadian Marine Data Sources for Gulf Islands / Salish Sea

## Key Finding
Canadian buoys 46146, 46131, 46134, 46303 are cross-listed on NOAA NDBC.
Try existing ERDDAP endpoint first — may need zero new API integration.

## Buoy Stations
- 46146: Halibut Bank (49.34N, 123.73W) — central Strait of Georgia
- 46134: Pat Bay (48.65N, 123.50W) — near Sidney/Victoria  
- 46303: Strait of Georgia South (49.02N, 123.43W)
- 46131: Sentry Shoal (49.91N, 124.99W) — north Strait

Fallback API: CIOOS Pacific ERDDAP (data.cioospacific.ca) — identical query syntax

## Critical Current Stations (CHS IWLS API)
- 07527: Active Pass — ~6 kt (BC Ferries route, DANGEROUS)
- 07438: Porlier Pass — ~6 kt (overfalls and whirlpools)
- 07487: Dodd Narrows — ~8 kt (strongest tidal rapid on coast)
- 07545: Gabriola Passage — ~6 kt
- API: api-iwls.dfo-mpo.gc.ca/api/v1/stations/{id}/data

## Tide Stations
- 07330: Fulford Harbour (Salt Spring) — primary Gulf Islands station
- 07260: Sidney
- 07795: Point Atkinson — regional reference

## Weather Alerts (ECCC)
- Marine forecast areas: 14305 (Strait of Georgia south), 06100 (Haro Strait)
- CAP-XML alerts: dd.weather.gc.ca/today/alerts/cap/
- OGC API: api.weather.gc.ca/collections

## CBSA Customs for Cross-Border Boating
- Call 1-888-CANPASS 30 min to 4 hr before arrival
- Reporting sites: Bedwell Harbour (Pender), Sidney (24hr), Victoria (24hr)
- NEXUS program available for frequent crossers

## Gulf Islands Destinations
Marinas: Salt Spring (Ganges), Montague Harbour (Galiano), Bedwell Harbour (Pender)
Anchorages: Pirates Cove, Princess Bay, Montague Harbour, Winter Cove
Kayak: BC Marine Trail network with designated campsites
National Park: Gulf Islands National Park Reserve (whale protection zones Jun-Nov)
