# WhenToBoat — Final Implementation Plan

**Date:** 2026-03-24
**Status:** Ready for validation
**Competitive window:** 6–12 months (SeaLegsAI and Deckee are building in this space)

---

## What This Is

WhenToBoat answers **"When should I go boating, and where?"** — a question 85 million US recreational boaters ask constantly and no tool answers. It's a planning tool that synthesizes wind, waves, tides, currents, and historical patterns into activity-specific comfort scores. A kayaker and a racing sailor see completely different maps of the same bay on the same day.

**It is NOT a real-time conditions authority.** Every recommendation links to authoritative sources (NOAA, NWS, CO-OPS) for verification before departure. Variability warnings are a core feature: "7/10 today, but historically ranges 3–9 in this zone."

---

## Three Design Principles

**1. "Plan here, confirm there."** Every score includes direct links to live NOAA buoy data, NWS marine forecasts, and CO-OPS tide predictions. A "Before You Go" checklist is tailored per activity.

**2. Variability is the feature.** We show P10/P50/P90 ranges, not just averages. The time-of-day slider visually teaches that Central Bay goes from calm to 20+ knots by afternoon — more powerful than any warning text.

**3. "Where else?" not just "no."** When conditions are bad at the selected destination, immediately show alternatives: "Central Bay is 3/10 right now, but Richardson Bay is 8/10 — try Sausalito instead." This is the retention feature.

---

## Data Architecture: Zero UGC

ALL data comes from vetted, authoritative sources. No user-generated content. No anonymous pins. No crowd-sourced reports. Every data point is traceable.

All APIs tested with real HTTP requests on 2026-03-24. Results:

| Data Need | Source | Status | Key? | Notes |
|-----------|--------|--------|------|-------|
| Wind & waves (real-time) | NOAA NDBC buoys | **WORKS** | No | 10-min updates. Stations: 46026, FTPC1, TIBC1, AAMC1 |
| Wind & waves (44yr history) | NOAA ERDDAP | **WORKS** | No | Clean JSON. 1982–present. For Monte Carlo. |
| Tides | NOAA CO-OPS | **WORKS** | No | 90 stations in SF Bay. 6-min resolution. JSON. |
| Currents | NOAA CO-OPS | **WORKS** | No | 285 stations in SF Bay. Ebb at Gate: -4.31 kts. |
| Water temperature | CO-OPS + USGS | **WORKS** | No | Not all stations. Alameda: 64°F, offshore: 53.6°F. |
| 7-day forecast (wind, waves) | Open-Meteo Marine + Weather | **WORKS** | No | Hourly. ~5nm grid. Wind in knots. Visibility for fog. |
| Marine text forecast | NWS api.weather.gov | **WORKAROUND** | No | Unstructured text — requires regex parsing. |
| Boat fuel consumption | Manufacturer specs | **CURATE** | — | Build ~20-category lookup table from OEM data. |
| Public boat ramps | State/county gov databases | **CURATE** | — | CA DBW, county parks, CDFW. No UGC. |
| Fishing regulations | CDFW publications | **CURATE** | — | PDF only. ~50 species rules. Annual update. |
| Sunset times | Solar position algorithm | **COMPUTE** | — | Astronomical calculation. No external API needed. |

**Commercial note:** Open-Meteo requires paid plan (~$20-50/mo) for commercial use. All NOAA APIs are free forever.

---

## Activities Supported

### Core (MVP)
| Activity | Ideal Wind | Max Wind | Max Wave | Key Factors |
|----------|-----------|---------|---------|-------------|
| Daysail (casual) | 8–15 kts | 20 | 3.0 ft | Light air = boring; 20+ = stressful for guests |
| Racing sail | 12–22 kts | 30 | 5.0 ft | Wants wind. Central Bay slot is ideal. |
| Powerboat cruise | 0–10 kts | 15 | 2.0 ft | Optimizing for flat water, passenger comfort |
| Sunset cruise | 0–8 kts | 12 | 1.5 ft | Glass-off conditions. Golden hour timing. |
| Kayak / SUP | 0–8 kts | 12 | 1.5 ft | Sheltered water. Current awareness critical. |
| Kiteboard / Wingfoil | 18–25 kts | 30 | 4.0 ft | Needs strong, consistent wind |
| Waterski / Wake | 0–5 kts | 8 | 0.5 ft | Flat water. Early morning only in most zones. |
| Rowing / Sculling | 0–5 kts | 8 | 0.5 ft | Extremely wind/chop sensitive. Protected water. |

### Fishing (MVP)
| Activity | Ideal Wind | Max Wind | Max Wave | Key Factors |
|----------|-----------|---------|---------|-------------|
| Bay fishing | 0–12 kts | 18 | 2.5 ft | Tide phase matters (incoming = best). Dawn/dusk bite. |
| Ocean fishing | 0–12 kts | 15 | 4.0 ft | Long swell period OK, short steep chop = miserable |
| Crabbing | 0–10 kts | 15 | 3.0 ft | Dungeness season Nov–Jun. Stationary = low chop tolerance. |
| Pier/shore fishing | 0–15 kts | 25 | any | Wind tolerant (on solid ground). Tide critical. |

### NOT Included
- **Surfing:** Surfline owns this ($200M+ business, 35yr data, ML models, 700+ cams). Different model entirely.
- **Swimming:** Water quality liability too high without real-time verification capability.

---

## SF Bay Data (MVP)

- **23 boating destinations** with GPS coordinates, dock/landing info, activity tags, zone assignment
- **15+ public boat launch ramps** with hours, fees, parking, boat size limits (from CA government sources)
- **11 exposure zones** with monthly AM/PM wind, wave, period data (Richardson Bay, Central Bay, SF Shore, East Bay, North Bay, San Pablo, South Bay, Deep South, Delta, Ocean South, Ocean North)
- **253-pair distance matrix** (statute miles, water routes)
- **Cross-zone routing rules** (routes inherit worst-case conditions of all zones traversed)
- **11 fishing spots** with target species and CDFW season gates
- **Sunset/golden hour data** per month
- **Regulatory seasons** (crab, salmon, rockfish, mussel quarantine)
- **"Verify Before You Go" links** per zone (specific NOAA buoy, NWS forecast, CO-OPS tide station)

---

## Scoring Engine

```typescript
// Every score returns a range, not just a number
interface ScoredRoute {
  score: number              // P50 median — the headline number
  scoreRange: { p10, p25, p50, p75, p90 }  // full historical range
  variabilityWarning?: string  // "Can build from 5→25 kts between 10AM–2PM"
  verifyLinks: VerifyLink[]    // direct links to NOAA/NWS/CO-OPS
  beforeYouGo: string[]        // activity-specific safety checklist
  alternativeRoutes: ScoredRoute[]  // "where else?" — better-scoring alternatives
}

// Same bay, same day, different activity = different score
// Central Bay July PM:  kayak = 2/10,  racing sail = 9/10
// Richardson Bay Sept AM:  kayak = 9/10,  kiteboard = 3/10

// Vessel adjustment: bigger boat = more wave tolerance
// Draft restriction: shallow destinations flagged
// Fuel range: destinations beyond range grayed out
// Fishing: tide phase bonus, dawn/dusk bonus, season gate
```

---

## Tech Stack

| Choice | Why |
|--------|-----|
| Vite + React + TypeScript | Pure SPA, no SSR needed. Fast. Modern. |
| Tailwind CSS v4 | CSS-first config, native dark mode, no config file |
| Zustand | Small, TypeScript-first state management. Right-sized. |
| Mapbox GL JS (react-map-gl v8) | Best dark styles, smooth transitions. 50K free loads/mo. |
| Recharts | Largest community. Composable. Good for P10/P90 confidence bands. |
| Motion (Framer Motion) | AnimatePresence, layout animations, slider gestures. |
| @turf/turf | Bezier arc generation for route lines. |
| Vercel | Zero-config deploy for Vite SPA. |

**Architecture:** City-agnostic engine (scoring, routing, trajectory analysis) + city data modules. Each city is a directory of TypeScript files. No backend needed for MVP — all scoring is client-side.

**PWA manifest from day 1** — shareability via text links is the primary growth vector. A user should be able to text "look at Saturday's conditions for our kayak trip" as a link that opens instantly in mobile browser.

---

## Implementation Phases

### Phase 1: Foundation + Data (Week 1–2)

**Goal:** Scaffolded project with all SF Bay data, scoring engine with variability, and nautical dark theme.

1. Scaffold Vite + React + TypeScript + Tailwind v4 + Zustand + Mapbox + Recharts + Motion + Turf
2. Nautical dark theme: navy depths, green→gold→red heatmap scale, compass gold accents
3. Dark mode default, light mode toggle
4. All TypeScript interfaces including `ScoredRoute` with variability range and verify links
5. SF Bay data modules: 23 destinations, 11 zones (monthly AM/PM data), 253 distances, routing rules, sunset data, fishing spots/seasons, boat ramp data
6. Activity profiles: 12+ activities with scoring formulas
7. Scoring engine: `activityScore()`, `routeComfort()`, `vesselAdjustedScore()`, `fishingScore()`
8. Variability: every score returns P10/P25/P50/P75/P90 from historical data
9. Trajectory engine: `analyzeTrajectory()` → leg-by-leg zone breakdown, bottleneck identification, hourly profile, monthly profile, warnings, verify links, "where else?" alternatives
10. Routing engine: zone traversal, transit time, fuel calc, cross-zone worst-case
11. Time interpolation: AM/PM blending across hours, glass-off recovery modeling
12. PWA manifest + vercel.json

**Verify:** Scoring returns correct values (Richardson Bay Sept AM kayak = high, Central Bay July PM kayak = low). Route Sausalito→Angel Island correctly identifies zones. Alternatives populated when primary score is low.

### Phase 2: Interactive Map — The Hero (Week 2–4)

**Goal:** Beautiful dark Mapbox map with destinations, route arcs, time slider, and trajectory panel. The "wow" moment.

1. Full-viewport Mapbox dark map, custom navy water (#0a1628), SF Bay bounds
2. 23 destination markers: circle + score text, color-coded green→red, click/hover interactive
3. Route arc lines: Bezier curves between all viable destinations (<3hr transit), color/opacity driven by comfort score
4. **Time-of-day slider** (5AM–10PM): dragging recolors all routes in real time. Play button auto-scrubs across the day. Sun icon at sunset time.
5. **Month selector**: 12 buttons. July = sparse red skeleton. September = dense green web.
6. **Activity selector**: switching activity inverts the map (kayak vs racing sail)
7. **"Where else?" flow**: when a destination scores low, nearby high-scoring alternatives pulse/glow on the map
8. **Trajectory panel** (slide-in from right on route click):
   - At a glance: origin → destination, score with range, transit time, distance
   - Leg-by-leg zone breakdown with bottleneck highlighted
   - Variability warning when applicable
   - Hour-by-hour timeline with P10/P90 shading
   - 12-month calendar sparkline
   - "Before You Go" checklist with direct NOAA/NWS/CO-OPS links
   - "Compare with another route" button
9. **Launch ramp indicators**: markers showing public ramps with hours/fees on hover
10. Mobile-responsive: map fills viewport, controls overlay, panels slide up from bottom

**Verify:** Time slider visually shows morning green → afternoon red for central bay. Activity switch transforms map. Clicking route opens full trajectory analysis. "Where else?" shows alternatives. Launch ramps visible.

### Phase 3: Filters, Heatmap, Matrix (Week 4–5)

**Goal:** Power-user views. Slice and dice by every variable.

1. Tab navigation: Map (default) → Heatmap → Matrix → Planner
2. Filter sidebar with range sliders: max/min wind, max wave height, max wave period, min comfort score, max transit duration
3. Activity dropdown, month selector, AM/PM/Sunset toggle
4. **Heatmap view**: origin × destination × month, color-coded, sortable by every column
5. **Full 23×23 matrix**: all-pairs grid for selected month + activity, hover for details
6. Dark/light mode toggle (map switches to Mapbox light-v11)
7. All filters propagate to all views via Zustand
8. URL state sync for shareable filter configurations

**Verify:** Filter changes instantly update all views. Heatmap sorts correctly. Dark/light mode works. Mobile layout with drawer.

### Phase 4: Boat Selector + Trajectory Deep Dive (Week 5–7)

**Goal:** Vessel profiles that re-run the model. Multi-leg trips. Route comparison.

1. **Boat selector**: preset vessels (21ft CC, 35ft sailboat, kayak, SUP, wakeboard boat, jet ski, pontoon, rowing shell) + custom entry (LOA, speed, fuel, GPH, draft)
2. Changing vessel re-runs entire model: wave tolerance scales with LOA, transit times change, draft restricts destinations, fuel limits range
3. **Trajectory comparison**: side-by-side 2–3 routes with parallel timelines and calendars
4. **Multi-leg trip builder**: click waypoints on map, chain stops A→B→C→A, cumulative stats, per-leg warnings, departure schedule
5. **Destination detail**: best activities, best months, all reachable destinations ranked, ramp info
6. **Boat rental integration**: link to local kayak/SUP/boat rentals at destinations (curated, not UGC)
7. **FBC-ready presets**: design preset system to accept fleet configurations from boat club partners

**Verify:** Kayak→sailboat switch recalculates everything. Draft limits correctly flag shallow destinations. Multi-leg chains zones correctly. Fuel range grays out unreachable destinations.

### Phase 5: Calendar Planner + Sunset Engine + Monte Carlo (Week 7–9)

**Goal:** "When should I go?" planner, sunset optimizer, probability charts.

1. **Calendar planner**: pick activity + destination → ranked months, best time, expected conditions, P10–P90 range per month, # of "good" days
2. **Sunset cruise planner**: select month → best route, departure time, conditions, fog probability, view quality, timetable
3. **Monte Carlo fan charts**: P10/P25/P50/P75/P90 confidence bands for wind and waves across a day
4. **Comfort sparklines**: mini 12-month inline charts for route detail cards
5. **Condition bands**: stacked bars showing comfortable hours per day by month ("July: 4-hour morning window. September: all day.")

**Verify:** September ranks #1 for most activities. Sunset planner recommends Richardson Bay in calm months. Monte Carlo shows wider bands in variable months.

### Phase 6: "This Weekend" Live Forecast (Week 9–11)

**Goal:** Real-time scoring of the next 7 days. The daily utility feature.

1. **Forecast data service**: fetch Open-Meteo Marine + Weather (no key), parse NWS text forecasts (regex)
2. **Weekend planner**: 7-day strip, each day scored per activity with hourly breakdown
3. "Saturday 9AM–1PM is a 9/10 for kayaking at Clipper Cove"
4. Compare forecast to historical: "This Saturday will be better than typical for July"
5. Forecast confidence: wider bands for days 4–7
6. **Hourly timeline**: color-coded blocks per hour, optimal departure/return window highlighted
7. Cache forecasts with 1-hour TTL

**Verify:** Open-Meteo fetches work without keys. Forecast scores align with historical patterns. 7-day strip renders correctly.

### Phase 7: Multi-City + Comparison (Week 11–13)

**Goal:** Prove the architecture works for any body of water. Add one more city.

1. Refactor engine to ensure zero SF Bay references
2. Add second city data module (San Diego or Puget Sound)
3. City selector in header, map auto-fits to new bounds
4. **City comparison**: total boatable days per year by activity, monthly score comparison, water temp, season length
5. City summary cards with radar chart ratings

**Verify:** Second city loads correctly. Switching cities preserves filters. Comparison shows meaningful differences.

### Phase 8: Polish + Deploy (Week 13–14)

**Goal:** Production-ready. Beautiful. Fast.

1. Light mode theme refinement
2. Responsive audit: iPhone SE, iPad, desktop
3. Loading states, skeleton screens, shimmer effects
4. Micro-interactions: marker pulse, route glow, panel slide
5. Performance: memoize GeoJSON, GPU-accelerated paint transitions, debounce slider
6. Accessibility: keyboard nav, ARIA labels, color-blind palette option
7. SEO: Open Graph tags, structured data, title/description per view
8. Deploy to Vercel, custom domain, analytics
9. Legal: Terms of Service, disclaimer language modeled on PredictWind's ("You do so solely at Your own risk")

**Verify:** Lighthouse >90. Mobile Safari/Chrome/Firefox. 60fps map interactions. Dark/light toggle instant.

---

## Post-MVP Roadmap

| Phase | What | When |
|-------|------|------|
| 9: Boat club B2B pilot | FBC partnership, white-label fleet presets, reservation advisor | Month 4–5 |
| 10: Global expansion | Lakes, rivers, any body of water. Open-Meteo covers the globe. | Month 5–8 |
| 11: Boat lifestyle advisor | "What boat should I get?" + city rankings + seasonal calendar | Month 6–9 |
| 12: Community layer (optional) | Heavily moderated, opt-in, supplemental. Never primary data. | Month 9+ |

---

## Monetization Strategy

| Tier | Price | Features |
|------|-------|----------|
| Free | $0 | Basic map, activity scoring (median only), single trajectory, safety warnings, verify links. Fulfills safety mission. |
| Premium | $49.99/yr | Monte Carlo variance bands, multi-leg builder, custom vessel profiles, "This Weekend" live forecast, 12-month calendar, city comparison, data export |
| B2B (Boat Clubs) | Per-member/yr | White-labeled, fleet presets, reservation advisor, usage analytics, custom branding |

**Revenue targets:**
- Year 1: 10K users, 500 premium ($25K ARR) + 1 boat club pilot
- Year 2: 50K users, 2,500 premium ($125K ARR) + 3–5 boat club partnerships
- Year 3: 250K users, 12,500 premium ($625K ARR) + enterprise B2B

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Liability if someone gets hurt | "Plan here, confirm there" UI. Click-wrap ToS. P90 variance always shown. PredictWind-style disclaimer. |
| SeaLegsAI/Deckee catch up | Ship in 14 weeks. Activity-specific scoring + historical patterns + "where else?" are defensible differentiators. |
| NOAA API outage | Cache historical medians locally. App degrades gracefully to static data. |
| Low conversion to premium | Ensure free tier is genuinely useful (safety mission). Premium gates advanced planning, not basic safety. |
| Seasonal churn | Annual plans discounted in spring. Off-season features: historical exploration, trip planning for future months. Expand to year-round markets (FL, SoCal). |
| Data accuracy in sheltered bays | Manual zone tuning using local knowledge + NDBC station calibration. This IS the moat. |
