# WhenToBoat — Implementation Plan

**Created:** 2026-03-23
**Status:** Draft — awaiting approval before execution

---

## Safety-First Design Philosophy

**WhenToBoat is a planning tool, not a conditions authority.**

A woman died kayaking in Tomales Bay. That tragedy is our north star. Could better planning have saved her? Maybe — if she'd known the wind was going to build, if she'd understood how fast conditions change, if she'd had a sense of what the bay does at 2 PM in March.

We help people **understand patterns and risks**, then we **link them to authoritative sources to confirm** before they go. We are never the sole decision point.

### Three rules baked into every screen:

1. **"Plan here, confirm there"** — every trajectory, every score, every recommendation links to the real-time authoritative source: NOAA buoy data, NWS marine forecast, CO-OPS tide predictions, local wind stations. We show a "Verify conditions before you go" section with direct links.

2. **Variability is the feature, not a footnote.** SF Bay weather changes fast. "Average 8 kts" sometimes means 25 kts. We show the full range — P10/P50/P90 — not just averages. Every afternoon trajectory in summer gets a banner: *"Central Bay typically builds from calm to 20+ kts between 11 AM and 2 PM. Plan your crossing before noon."*

3. **Educate about what they don't know they don't know.** Many users can't read tide charts. They don't check marine forecasts. They don't know about the afternoon slot effect. We teach them — not with a wall of text, but by showing them the pattern visually: watch the map turn from green to red as you drag the time slider through noon. That's worth a thousand words of warning.

### What this means in practice:
- Every trajectory panel includes a **"Conditions can change rapidly"** notice with the historical variability range
- High-variance zones (Central Bay, San Pablo) get explicit **"This zone is unpredictable"** warnings
- Comfort scores always show the range, not just the number: "7/10 (but ranges from 3 to 9)"
- A **"Before You Go" checklist** per activity: check weather, file float plan, tell someone, check tides
- **Links to real-time data sources** are always one tap away — never buried
- We do NOT show data we can't verify or cross-reference (this is why swimming is out of scope for now)

---

## Design Philosophy: Progressive Disclosure

The app has two faces — and the user never sees complexity they didn't ask for:

```
┌─────────────────────────────────────────────────────────────┐
│  SIMPLE SURFACE (default)                                   │
│  "I want to kayak this weekend — where should I go?"        │
│  → Pick activity → see the map light up → tap a glowing    │
│    destination → see "Saturday 9 AM, calm, 8/10"            │
│  → See: "⚠ Conditions typically change by afternoon"        │
│  → Link: "Confirm with NOAA forecast →"                    │
├─────────────────────────────────────────────────────────────┤
│  TRAJECTORY EXPLORER (one click deeper)                     │
│  Click any route line on the map → full trajectory panel:   │
│  start point, end point, zones traversed, leg-by-leg        │
│  conditions, variability range, hour-by-hour changes,       │
│  "Before You Go" checklist, links to live data sources      │
├─────────────────────────────────────────────────────────────┤
│  ADVANCED PLANNING (power users)                            │
│  Heatmap matrix, 23×23 all-pairs, Monte Carlo probability   │
│  bands, vessel profile tuning, multi-leg trip builder,      │
│  city comparison, global rankings, full data provenance     │
└─────────────────────────────────────────────────────────────┘
```

Every view supports this: the map is glanceable, but every element is clickable into depth. A trajectory (route line) is the core interactive unit — it's a journey, not just data.

---

## Architecture Overview

```
src/
├── engine/                    # City-agnostic scoring & routing core
│   ├── types.ts               # All TypeScript interfaces
│   ├── scoring.ts             # Activity scoring formulas
│   ├── routing.ts             # Cross-zone routing, transit time, fuel calc
│   ├── trajectory.ts          # Trajectory analysis: leg-by-leg zone breakdown
│   ├── interpolation.ts       # Time-of-day interpolation, Monte Carlo
│   └── vessel.ts              # Vessel profile scaling (wave tolerance, draft)
├── data/
│   ├── cities/
│   │   └── sf-bay/
│   │       ├── destinations.ts   # 23 destinations with lat/lng, dock info, tags
│   │       ├── zones.ts          # 11 exposure zones with monthly AM/PM data
│   │       ├── distances.ts      # 253-pair distance matrix
│   │       ├── routing-rules.ts  # Cross-zone exposure rules
│   │       └── sunset.ts         # Sunset times, golden hour, fog probability
│   └── activities.ts          # Activity profiles (wind/wave ranges, preferences)
├── store/
│   ├── index.ts               # Combined Zustand store
│   ├── filters.ts             # Filter slice (wind, wave, activity, month, time)
│   ├── trajectory.ts          # Selected trajectory slice (origin, dest, or multi-leg)
│   ├── vessel.ts              # Vessel profile slice
│   └── city.ts                # Active city slice
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx       # Top-level layout, nav, dark/light toggle
│   │   ├── Sidebar.tsx        # Filter panel / drawer
│   │   └── Header.tsx         # City selector, activity tabs
│   ├── map/
│   │   ├── BayMap.tsx         # Main Mapbox map container
│   │   ├── RouteLines.tsx     # GeoJSON arc lines between destinations
│   │   ├── DestinationMarkers.tsx  # Circle markers with score labels
│   │   ├── TimeSlider.tsx     # Horizontal time-of-day slider
│   │   ├── MonthSelector.tsx  # 12-month button row
│   │   ├── MapPopup.tsx       # Hover/click tooltip
│   │   └── WindOverlay.tsx    # Optional wind particle layer
│   ├── trajectory/
│   │   ├── TrajectoryPanel.tsx    # Slide-in detail panel for a selected route
│   │   ├── TrajectoryLegs.tsx     # Leg-by-leg zone breakdown with conditions
│   │   ├── TrajectoryTimeline.tsx # Hour-by-hour comfort across the day
│   │   ├── TrajectoryCalendar.tsx # 12-month comfort calendar for this route
│   │   ├── TrajectoryCompare.tsx  # Compare 2-3 trajectories side by side
│   │   └── MultiLegBuilder.tsx    # Chain multiple stops into a trip
│   ├── heatmap/
│   │   ├── HeatmapView.tsx    # Origin × destination comfort matrix
│   │   └── HeatmapCell.tsx    # Individual cell with tooltip
│   ├── matrix/
│   │   └── FullMatrix.tsx     # 23×23 all-pairs grid
│   ├── planner/
│   │   ├── CalendarPlanner.tsx    # "When should I go?" monthly strip
│   │   ├── SunsetPlanner.tsx      # Sunset cruise recommendation engine
│   │   └── ConditionCards.tsx     # Monte Carlo confidence charts
│   ├── detail/
│   │   └── DestinationDetail.tsx  # Destination info, activity tips
│   ├── boat/
│   │   ├── BoatSelector.tsx   # Vessel type/specs input panel
│   │   └── BoatPresets.tsx    # Quick presets (kayak, 21ft powerboat, 35ft sail)
│   ├── compare/
│   │   └── CityCompare.tsx    # Side-by-side city comparison
│   ├── charts/
│   │   ├── MonteCarloChart.tsx    # Probability fan chart (P10/P50/P90)
│   │   ├── ComfortSparkline.tsx   # Mini 12-month sparkline
│   │   ├── WindRoseChart.tsx      # Wind direction/speed distribution
│   │   └── ConditionBands.tsx     # Stacked confidence interval bands
│   └── shared/
│       ├── ScoreBadge.tsx     # Color-coded 1-10 score pill
│       ├── ColorScale.tsx     # Heatmap color utilities
│       └── ThemeToggle.tsx    # Dark/light mode switch
├── hooks/
│   ├── useComfortScore.ts     # Compute score for route/activity/time
│   ├── useTrajectory.ts       # Full trajectory analysis for selected route
│   ├── useRouteGeoJSON.ts     # Generate arc GeoJSON for current filters
│   ├── useTimeInterpolation.ts # Interpolate AM/PM data for slider position
│   └── useSunsetData.ts       # Sunset timing and glass-off scoring
├── lib/
│   ├── colors.ts              # Heatmap palette (green→yellow→red), nautical colors
│   ├── arcs.ts                # Bezier arc generation between coordinates
│   └── format.ts              # Number/time formatting utilities
├── App.tsx
├── main.tsx
└── index.css                  # Tailwind v4 imports + nautical theme
```

---

## Phase 1: Project Foundation & Data Layer
**Goal:** Scaffolded project with all SF Bay data, scoring engine, and a basic rendered page confirming everything works.

### Tasks

1. **Scaffold Vite + React + TypeScript project**
   ```bash
   npm create vite@latest whentoboat -- --template react-swc-ts
   ```
   - Install deps: `tailwindcss @tailwindcss/vite zustand react-map-gl mapbox-gl recharts motion @turf/turf`
   - Configure `vite.config.ts` with React + Tailwind plugins
   - Set up `.env.local` with `VITE_MAPBOX_TOKEN`
   - Configure `vercel.json` with SPA rewrite

2. **Tailwind v4 nautical theme** in `index.css`
   - CSS-first config with `@theme` directive
   - Dark mode via `@custom-variant dark (&:where(.dark, .dark *))`
   - Nautical color palette:
     - Navy depths: `--color-ocean-950` (#0a1628) through `--color-ocean-50`
     - Heatmap scale: 10 stops from emerald green → gold → crimson
     - Accent colors: compass gold, wake white, reef teal
   - Typography: system sans-serif, optional serif for headers
   - Dark mode default with JS toggle in `<head>`

3. **TypeScript interfaces** (`engine/types.ts`)
   - `City`, `Destination`, `Zone`, `ZoneConditions`, `ActivityProfile`
   - `VesselProfile`, `RouteComfort`, `MonthlyData`, `TimeOfDay`
   - `FilterState`, `ComfortScore`
   - `VerificationLink` — links to authoritative real-time data sources per zone/route
   - `VariabilityRange` — P10/P50/P90 historical range for conditions
   - All city-agnostic — a `City` contains `Destination[]`, `Zone[]`, distance matrix, `DataSource[]`

4. **SF Bay data modules** (`data/cities/sf-bay/`)
   - `destinations.ts` — 23 boating destinations from PRD with lat/lng, dock info, activity tags, zone assignment
   - `fishing-spots.ts` — SF Bay fishing & harvest locations:
     ```
     Spot                  | Type       | Zone          | Best Season    | Target Species
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Berkeley Pier         | pier       | east_bay      | Year-round     | Stripers, bat rays, perch
     Pacifica Pier         | pier       | ocean_south   | Year-round     | Crab (Nov–Jun), stripers, jacksmelt
     Fort Baker            | shore      | richardson    | Mar–Nov        | Halibut, stripers, leopard shark
     Candlestick Point     | shore      | south_bay     | Apr–Oct        | Halibut, stripers, perch
     San Pablo Bay (boat)  | bay        | san_pablo     | Jun–Oct        | Sturgeon, stripers
     Farallon Islands      | offshore   | ocean_far     | Apr–Nov        | Rockfish, lingcod (seasonal limits)
     SF Bar (boat)         | offshore   | ocean_south   | May–Oct        | Salmon (season varies by year—CDFW regulated)
     Pillar Point (boat)   | nearshore  | ocean_south   | Nov–Jun        | Dungeness crab (recreational)
     Tomales Bay           | bay        | far_north     | Year-round     | Clams, mussels (quarantine May–Oct), herring
     Delta channels        | river      | delta         | Year-round     | Stripers, catfish, sturgeon, crawdads
     Angel Island          | shore      | richardson    | Apr–Oct        | Perch, halibut from shore
     ```
   - `seasons.ts` — regulatory fishing/harvest seasons (from CDFW):
     ```
     Species              | Open Season          | Notes
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Dungeness crab (rec)  | Nov–Jun              | Check CDFW for exact opener date (varies)
     Salmon (ocean)        | Varies by year       | CDFW announces annually; often Apr–Oct
     Rockfish              | Year-round (varies)  | Depth restrictions; some months closed
     Halibut (bay)         | Year-round           | Min size 22"
     Striped bass          | Year-round           | Min size 18"
     Sturgeon              | Year-round           | Slot limit 40"–60", 1 per day
     Mussels               | Nov–Apr              | May–Oct quarantine (biotoxins)
     Clams                 | Year-round           | License + report card required
     ```
   - `zones.ts` — 11 exposure zones with 12 months × AM/PM condition data (wind, wave, period, comfort)
   - `distances.ts` — 253-pair distance matrix (boating routes)
   - `routing-rules.ts` — cross-zone exposure rules
   - `sunset.ts` — monthly sunset times, golden hour, glass-off windows, fog probability

5. **Activity profiles** (`data/activities.ts`)
   - Core activities: sailing (casual + racing), powerboating, kayak/SUP, kiteboard/wingfoil, waterski/wake, rowing, fishing, crabbing
   - **Swimming/surfing explicitly out of scope** — liability too high without ability to verify water quality and safety data in real time. May revisit later with proper data partnerships.
   - **Fishing & harvest profiles**:
     ```
     Activity          | Ideal Wind | Max Wind | Max Wave | Notes
     ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     Bay fishing       | 0–12       | 18       | 2.5 ft   | Stripers, halibut, leopard shark. Tide timing
                       |            |          |          | matters — incoming tide best. Dawn/dusk bite.
     Ocean fishing     | 0–12       | 15       | 4.0 ft   | Salmon, rockfish, lingcod. Long swell period OK,
                       |            |          |          | short steep chop = miserable. Season-dependent.
     Crabbing          | 0–10       | 15       | 3.0 ft   | Dungeness season Nov–Jun (recreational).
                       |            |          |          | Best: Pacifica Pier, Pillar Point, SF piers.
                       |            |          |          | Need to be stationary — chop tolerance low.
     Pier/shore fish   | 0–15       | 25       | any      | Berkeley Pier, Pacifica Pier, Fort Baker.
                       |            |          |          | Wind tolerant (on solid ground). Tide critical.
     Clamming/mussels  | 0–10       | 15       | 2.0 ft   | Low tide access required. Tomales Bay, Bodega.
                       |            |          |          | Seasonal quarantine (May–Oct for mussels).
     ```
   - **Fishing-specific scoring factors**:
     ```typescript
     function fishingScore(activity, zone, month, hour, tidePhase): number {
       const baseScore = activityScore(activity, zone.wind, zone.wave, zone.period);
       // Tide bonus — incoming tide is best for bay fishing
       if (tidePhase === 'incoming') baseScore += 1;
       if (tidePhase === 'slack_high') baseScore += 0.5;
       // Dawn/dusk bite bonus
       if (hour <= 7 || hour >= 17) baseScore += 1;
       // Season gate — salmon season, crab season, etc.
       if (!isInSeason(activity, month)) return Math.max(1, baseScore - 5);
       return Math.max(1, Math.min(10, Math.round(baseScore)));
     }
     ```
   - **Explicitly NOT included: Surfing & Swimming**
     - Surfing: Surfline owns this space with ML models + 700+ live cameras. Different model entirely.
     - Swimming: Liability too high — water quality data can be wrong/stale, bad advice could directly endanger someone.
     - Both can be linked to as external resources ("For surf conditions, see Surfline →")
   - Scoring formula from PRD implemented for all boating + fishing activities

6. **Scoring engine with variability** (`engine/scoring.ts`)
   - `activityScore(activity, wind, waveHt, period)` → 1-10
   - `routeComfort(origin, destination, month, timeOfDay, activity, city)` → score using cross-zone min rule
   - `vesselAdjustedScore(baseScore, vessel)` → adjusted for LOA wave tolerance, draft restrictions
   - **Variability range** — every score also returns the historical range:
     ```typescript
     interface ScoredRoute {
       score: number          // P50 (median) — the headline number
       scoreRange: {
         p10: number          // worst 10% of days — "it could be this bad"
         p25: number          // below average
         p50: number          // typical
         p75: number          // above average
         p90: number          // best 10% of days
       }
       variabilityWarning?: string  // "Central Bay can build from 5→25 kts between 10 AM–2 PM"
       verifyLinks: {               // always present — "confirm before you go"
         label: string              // "NOAA SF Bay Forecast"
         url: string                // direct link to authoritative source
         type: 'forecast' | 'buoy' | 'tide' | 'wind'
       }[]
       beforeYouGo: string[]        // safety checklist items for this activity
     }
     ```
   - Display: score badge shows "7/10" with a range indicator "(3–9)" beneath
   - High-variance routes/zones get a yellow warning banner
   - Every scored result includes `verifyLinks` — direct links to check real-time conditions

7. **Routing engine** (`engine/routing.ts`)
   - `getRouteZones(origin, destination, city)` → zones traversed
   - `transitTime(distance, cruiseSpeed)` → minutes
   - `fuelRoundTrip(distance, gph, cruiseSpeed)` → gallons
   - Cross-zone worst-case wind/wave/score calculation

8. **Trajectory engine** (`engine/trajectory.ts`)
   - A **trajectory** is the core data model: a journey from A → B (or A → B → C for multi-leg)
   - `analyzeTrajectory(origin, destination, month, hour, activity, vessel?, city)` → `TrajectoryAnalysis`:
     ```typescript
     interface TrajectoryAnalysis {
       origin: Destination
       destination: Destination
       distance: number              // statute miles, water route
       legs: TrajectoryLeg[]          // each zone traversed, in order
       overallScore: number           // min(leg scores) — bottleneck rule
       transitMinutes: number         // based on vessel speed
       fuelGallons: number | null     // null for human-powered
       departureWindow: TimeWindow    // best hours to depart
       returnWindow: TimeWindow       // best hours to return
       hourlyProfile: HourlyScore[]   // score at every hour 5AM-10PM
       monthlyProfile: MonthlyScore[] // score for each month at current time
       warnings: string[]             // "Crosses Central Bay — expect 20kt+ PM winds Apr-Aug"
     }

     interface TrajectoryLeg {
       zone: Zone
       distanceInZone: number         // approximate miles in this zone
       wind: number                   // wind speed in this zone at selected time
       waveHeight: number
       wavePeriod: number
       score: number                  // this leg's score (bottleneck leg highlighted)
       isBottleneck: boolean          // true if this is the worst-scoring leg
     }
     ```
   - Multi-leg: `analyzeMultiLeg(stops: Destination[], ...)` chains trajectories
   - This is the foundation — every view (map click, heatmap cell, planner) produces a TrajectoryAnalysis

9. **Time interpolation** (`engine/interpolation.ts`)
   - `getTimeComfort(route, hour, month, activity)` → interpolated score
   - AM data = 7-10 AM, PM data = 1-5 PM, with transition zones and glass-off recovery
   - Foundation for Monte Carlo: `getConditionDistribution(zone, month, hour)` → { p10, p25, p50, p75, p90 }

### Verification
- [ ] `npm run dev` starts without errors
- [ ] All 23 destinations render in console log
- [ ] Scoring function returns expected values for known test cases (Richardson Bay Sept AM kayak = high, Central Bay July PM kayak = low)
- [ ] Route between Sausalito→Angel Island correctly identifies Richardson Bay + central_bay zones

---

## Phase 2: Interactive Map — The Hero View
**Goal:** Beautiful dark-mode Mapbox map of SF Bay with destination markers, colored route lines, and the time-of-day slider.

### Tasks

1. **Map container** (`components/map/BayMap.tsx`)
   - `react-map-gl` v8 with `import Map from 'react-map-gl/mapbox'`
   - Style: `mapbox://styles/mapbox/dark-v11`
   - Customize water color to `#0a1628` via `mapRef.getMap().setPaintProperty('water', 'fill-color', '#0a1628')`
   - Bounds: SW (37.45, -122.55) to NE (38.15, -121.75)
   - Full viewport height, responsive

2. **Destination markers** (`components/map/DestinationMarkers.tsx`)
   - GeoJSON Source with circle layer + symbol layer (score text inside circle)
   - Circle color: data-driven `interpolate` expression on comfort score (green→red palette)
   - Circle radius scales with zoom
   - `interactiveLayerIds` for click/hover
   - Click → select destination, show routes from it
   - Hover → popup with name, dock info, current score

3. **Route lines** (`components/map/RouteLines.tsx`)
   - Generate Bezier arc GeoJSON for all viable routes (transit ≤ 3 hours)
   - Arc midpoint offset ~15% perpendicular to route for visual separation
   - Use `@turf/bezier-spline` for smooth curves
   - Line color: data-driven from comfort score
   - Line opacity: score mapped (10→1.0, 5→0.5, 1→0.08)
   - When origin selected: only show routes from that origin, fade others to 10%
   - Invisible wider hit-test lines (12px) behind visible 2px lines for mobile click targets

4. **Time-of-day slider** (`components/map/TimeSlider.tsx`)
   - Horizontal slider 5:00 AM → 10:00 PM across bottom of map
   - Custom styled with Tailwind (nautical feel, not default browser slider)
   - Dragging updates all route line colors/opacities in real time via Zustand store
   - Sun icon at current month's sunset time
   - Play button for auto-scrub animation (5 AM → 10 PM over ~15 seconds)
   - Routes near sunset glow gold when slider approaches sunset time

5. **Month selector** (`components/map/MonthSelector.tsx`)
   - 12 month buttons along top of map
   - Active month highlighted
   - Changing month re-scores and recolors entire map
   - Visual contrast: July (sparse red skeleton) vs September (dense green web)

6. **Activity selector** (in header or map overlay)
   - Activity cards with icons
   - Switching activity transforms the entire map coloring
   - Show current activity's ideal conditions summary

7. **Map popup** (`components/map/MapPopup.tsx`)
   - Route hover: "Sausalito → Angel Island · 11 min · 9/10 · Wind 4 kts · Waves 0.2 ft"
   - Destination hover: name, zone, dock info, current score
   - Styled dark with nautical palette

8. **Trajectory panel** (`components/trajectory/TrajectoryPanel.tsx`)
   - Click any route line on the map → trajectory panel slides in from the right
   - This is the "one click deeper" moment — simple surface → rich detail
   - **Panel contents (progressive disclosure within the panel itself):**

   **At a glance (always visible):**
   - Origin → Destination with score badge (e.g., "Sausalito → Angel Island · 9/10")
   - Transit time and distance
   - Current conditions summary: wind, wave, water temp
   - Big comfort score with color

   **Scroll down for depth:**
   - **Leg-by-leg breakdown** (`TrajectoryLegs.tsx`): each zone traversed shown as a horizontal bar, colored by that leg's score. Bottleneck leg highlighted in red with warning icon. "You'll cross Central Bay — expect 20kt winds and 3ft chop in PM"
   - **Variability warning** (when applicable): "⚠ This zone is highly variable. Score is 7/10 on a typical day, but ranges from 3 to 9. Central Bay can build from calm to 20+ kts between 10 AM and 2 PM in summer."
   - **Hour-by-hour timeline** (`TrajectoryTimeline.tsx`): horizontal bar chart showing comfort score at every hour 5 AM–10 PM. Green band = good window, with P10/P90 shading showing the range. "Depart before 11 AM to avoid afternoon winds"
   - **12-month calendar** (`TrajectoryCalendar.tsx`): this exact route scored across all 12 months. Sparkline + color-coded month pills. "This route is best Sept–Oct, worst Jun–Jul PM"
   - Dock info at destination
   - Activity-specific tips
   - **"Before You Go" checklist**:
     - ☐ Check current marine forecast → [NOAA PZZ530 →]
     - ☐ Check live wind conditions → [NDBC FTPC1 →]
     - ☐ Check tide predictions → [CO-OPS SF →]
     - ☐ Tell someone your plan and expected return time
     - ☐ Check your vessel and safety equipment
     - (Checklist items vary by activity — kayakers get "wear a PFD", fishers get "check CDFW season status")
   - **"Verify conditions" links** — direct links to relevant NOAA buoy, NWS forecast, tide predictions for this specific route's zones
   - "Compare with another route" button → opens side-by-side

   **Interaction:**
   - On map, selected trajectory route line glows/thickens, other routes fade to 5% opacity
   - Zones traversed subtly highlight on the map as colored overlays
   - Changing time slider while panel is open updates the panel's conditions in real time
   - Close panel → map returns to full network view

### Verification
- [ ] Map renders full SF Bay with dark nautical theme
- [ ] 23 destination markers visible with color-coded scores
- [ ] Route lines appear as curved arcs between destinations
- [ ] **Clicking a route line opens trajectory panel with full analysis**
- [ ] **Trajectory panel shows leg-by-leg zone breakdown with bottleneck highlighted**
- [ ] **Hour-by-hour timeline shows clear morning vs afternoon difference for central bay routes**
- [ ] **12-month calendar shows seasonal patterns for selected trajectory**
- [ ] Dragging time slider visibly changes route colors (morning green → afternoon red for central bay)
- [ ] Switching from "Kayak" to "Racing Sail" transforms July PM from red to green on central bay routes
- [ ] Clicking a destination highlights only its routes
- [ ] Month switch from July to September turns the map from sparse red to dense green

---

## Phase 3: Heatmap, Matrix & Filter Controls
**Goal:** Power-user views for slicing data by every variable. Full filter bar.

### Tasks

1. **App shell & navigation** (`components/layout/`)
   - Tab navigation: Map (default) → Heatmap → Matrix → Planner → Sunset
   - All views share same filter state from Zustand
   - Dark/light mode toggle (sun/moon icon)
   - Responsive: mobile drawer for filters, desktop sidebar

2. **Filter sidebar** (`components/layout/Sidebar.tsx`)
   - Range sliders (Tailwind-styled, custom):
     - Max wind (0-30 kts)
     - Min wind (0-20 kts, for sailors)
     - Max wave height (0-8 ft)
     - Max wave period (0-15 s)
     - Min comfort score (1-10)
     - Max transit duration (10-180 min)
   - Activity dropdown
   - Time of day: AM / PM / Sunset toggle
   - Month selector
   - All filters update all views in real-time via Zustand

3. **Heatmap view** (`components/heatmap/HeatmapView.tsx`)
   - Origin selector (any of 23 destinations)
   - Month × Destination matrix: rows = destinations, columns = months (or vice versa)
   - Cells colored by comfort score (same green→red palette)
   - AM/PM/Sunset toggle
   - Sortable by: distance, transit time, comfort score, wind, wave, name
   - Cell hover tooltip: full conditions breakdown
   - Built with CSS Grid + custom cells (not Recharts — more control over styling)

4. **Full matrix** (`components/matrix/FullMatrix.tsx`)
   - 23×23 all-pairs grid for selected month + activity
   - Every cell = comfort score for that route
   - Hover for: distance, transit, wind, wave, period
   - Diagonal is grayed out
   - Horizontally scrollable on mobile
   - Row/column headers are destination names, clickable to navigate to route detail

5. **Zustand store wiring**
   - All filter changes propagate to all views
   - URL state sync (optional) — share a URL with specific filters applied
   - Computed selectors for filtered/scored routes

### Verification
- [ ] Filter changes instantly update map, heatmap, and matrix
- [ ] Heatmap sorts correctly by each column
- [ ] Matrix shows correct 23×23 grid with accurate scores
- [ ] Dark mode and light mode both render correctly
- [ ] Mobile layout works with drawer and scrollable heatmap

---

## Phase 4: Boat Selector, Trajectory Comparison & Multi-Leg Trips
**Goal:** Vessel profiles that re-run the model. Compare trajectories side by side. Build multi-stop trips.

### Tasks

1. **Boat selector panel** (`components/boat/BoatSelector.tsx`)
   - Vessel type dropdown: Powerboat, Sailboat, Kayak, SUP, Rowboat, Kiteboard, Jet Ski
   - Quick presets with icons:
     - "21ft Center Console" → LOA 21, cruise 32mph, fuel 66gal, GPH 9, draft 2ft
     - "35ft Sailboat" → LOA 35, cruise 7mph, fuel 30gal, GPH 2, draft 5.5ft
     - "Kayak" → LOA 14, cruise 4mph, no fuel, draft 0.5ft
     - "24ft Wakeboard Boat" → LOA 24, cruise 25mph, fuel 50gal, GPH 8, draft 2.5ft
     - "SUP" → LOA 11, cruise 3mph, no fuel, draft 0.3ft
     - "Rowing Shell" → LOA 27, cruise 5mph, no fuel, draft 0.3ft
     - "Jet Ski" → LOA 11, cruise 45mph, fuel 18gal, GPH 10, draft 1ft
   - Custom entry: LOA, cruise speed, fuel capacity, GPH, draft — all with sensible defaults
   - Changing vessel re-runs ALL trajectories and scores across the entire app:
     - LOA scales wave tolerance (bigger boat = higher maxWave threshold)
     - Draft filters out shallow destinations (Larkspur at low tide, South Bay flats)
     - Speed recalculates all transit times
     - Fuel calculates range limits — destinations beyond range shown with warning

2. **Vessel scaling logic** (`engine/vessel.ts`)
   - `waveToleranceMultiplier(loa)` — e.g., 40ft boat handles 1.5x the wave height of a 20ft boat
   - `draftFilter(destination, draft, tideState)` — flags inaccessible destinations
   - `adjustedTransitTime(distance, cruiseSpeed)` — in minutes
   - `fuelRoundTrip(distance, gph, cruiseSpeed)` — gallons
   - `rangeLimit(fuelCapacity, gph, cruiseSpeed)` → max one-way distance
   - When vessel changes, trajectory panel updates in real time if open

3. **Trajectory comparison** (`components/trajectory/TrajectoryCompare.tsx`)
   - "Compare with another route" button in trajectory panel
   - Side-by-side comparison of 2-3 trajectories:
     - Parallel hour-by-hour timelines
     - Parallel 12-month calendars
     - Distance / transit / fuel / score comparison table
     - "Sausalito→Angel Island is 20 min shorter but crosses Central Bay (score 4 PM); Sausalito→Tiburon stays in Richardson Bay (score 8 PM)"
   - On map: compared trajectories shown in distinct colors (blue, orange, purple)

4. **Multi-leg trip builder** (`components/trajectory/MultiLegBuilder.tsx`)
   - Click destinations on map to chain stops: A → B → C → A (return)
   - Or select from suggested popular multi-leg routes:
     - "Marin Triangle": Sausalito → Angel Island → Tiburon → Sausalito
     - "East Bay Loop": Berkeley → Emeryville → Jack London Sq → Alameda → Berkeley
     - "City Tour": Pier 39 → Ferry Building → McCovey Cove → Clipper Cove → Pier 39
   - Each leg analyzed separately with its own zones/conditions
   - Cumulative stats: total distance, total time, total fuel, overall comfort (min of all legs)
   - Departure schedule: "Leave Sausalito 9:00 AM → arrive Angel Island 9:11 → depart 10:30 → arrive Tiburon 10:38 → depart 12:00 → arrive Sausalito 12:08"
   - Warnings accumulate: "Leg 2 crosses Central Bay — plan this leg before noon"
   - On map: multi-leg route shown as connected highlighted path with numbered waypoints

5. **Destination detail card** (`components/detail/DestinationDetail.tsx`)
   - Best activities for this destination (from activity tags)
   - Best months to visit (ranked)
   - Best time of day
   - Monthly condition profile (12-month chart)
   - All reachable destinations from here, ranked by comfort score
   - "From Angel Island, you can reach 8 destinations in under 30 min"

6. **Freedom Boat Club integration consideration**
   - Boat selector presets could include "FBC Fleet" boats
   - "Which boat should I take for this trajectory?" recommendation based on conditions + route
   - Design the presets system to be configurable per B2B partner

### Verification
- [ ] Switching from kayak to 35ft sailboat recalculates all transit times, scores, and trajectory panels
- [ ] Draft-limited destinations show warning badges and are flagged in trajectory analysis
- [ ] Trajectory comparison shows meaningful differences between routes
- [ ] Multi-leg trip correctly chains zones and accumulates conditions
- [ ] Multi-leg departure schedule accounts for vessel speed
- [ ] Fuel range limit correctly grays out unreachable destinations for small-tank boats
- [ ] Boat presets populate all fields correctly

---

## Phase 5: Calendar Planner, Sunset Engine & Monte Carlo Charts
**Goal:** "When should I go?" planner, sunset cruise optimizer, and probabilistic confidence visualizations.

### Tasks

1. **Calendar planner** (`components/planner/CalendarPlanner.tsx`)
   - User picks: activity + destination (or "anywhere")
   - Returns: ranked months, best time of day, departure time, expected conditions
   - Visual: 12-month horizontal strip with condition bars
   - Each month shows: comfort score range (P10-P90), best time window, # of "good" days
   - Click a month → expand to weekly/daily view showing variance
   - "Best weekend this month" highlight based on forecast data (future phase)

2. **Sunset cruise planner** (`components/planner/SunsetPlanner.tsx`)
   - Select month → app recommends:
     - Best route for sunset viewing
     - Optimal departure time (sunset - transit - 45 min)
     - Expected conditions at departure and arrival
     - Sunset direction and quality prediction
     - Fog probability overlay
     - View quality score (western-facing routes score higher)
   - Timetable: depart → arrive → sunset → return
   - Golden hour color gradient background on the card
   - "Share this sunset plan" (future: URL snapshot)

3. **Monte Carlo confidence charts** (`components/charts/MonteCarloChart.tsx`)
   - Fan chart showing P10/P25/P50/P75/P90 bands for conditions across a day
   - Recharts AreaChart with stacked transparent fills for confidence bands
   - Wind speed distribution for selected zone/month
   - Wave height probability envelope
   - "85% chance of < 2ft waves between 8 AM and 2 PM"
   - Color: ocean blue gradient bands

4. **Comfort sparklines** (`components/charts/ComfortSparkline.tsx`)
   - Mini inline chart: 12 months of comfort scores for a route
   - Used in heatmap cells, route detail cards, calendar planner
   - Responsive: shows in tight spaces

5. **Wind rose chart** (`components/charts/WindRoseChart.tsx`)
   - Directional wind distribution for a zone
   - Polar area chart (Recharts RadarChart or custom SVG)
   - Shows prevailing wind direction and speed distribution by month

6. **Condition bands** (`components/charts/ConditionBands.tsx`)
   - Stacked horizontal bars showing comfortable hours per day by month
   - Green = ideal, yellow = marginal, red = uncomfortable
   - Quick visual: "In July, you have a 4-hour morning window; in September, all day"

### Verification
- [ ] Calendar planner correctly ranks September as best overall month for most activities
- [ ] Sunset planner recommends Richardson Bay routes in calm months
- [ ] Monte Carlo chart shows wider bands for more variable months (winter storms)
- [ ] Sparklines render inline without layout issues
- [ ] Wind rose shows prevailing westerly pattern for central bay

---

## Phase 6: Multi-City Architecture & City Comparison
**Goal:** Extensible architecture proven by adding a second city. Comparison view.

### Tasks

1. **City abstraction** — refactor if needed so `engine/` has zero SF Bay references
   - `City` interface: `{ id, name, region, destinations, zones, distances, routingRules, sunsetData }`
   - `CityRegistry` — map of city ID → city data module
   - Dynamic imports: `await import(\`./data/cities/${cityId}/index.ts\`)`

2. **Add second city data module** (e.g., San Diego, Puget Sound, or Miami)
   - New `data/cities/{city}/` directory with same file structure as sf-bay
   - Demonstrates the pattern works for any coastal area

3. **City selector** in header
   - Dropdown or search box
   - Switching city reloads all data, map bounds, destinations, zones
   - Map auto-fits to new city bounds

4. **City comparison view** (`components/compare/CityCompare.tsx`)
   - Side-by-side or overlay comparison
   - Compare: total boatable days per year by activity
   - Monthly comfort score comparison (dual-line chart)
   - "SF Bay has 180 comfortable powerboating days; San Diego has 280"
   - Water temperature comparison
   - Best months comparison table

5. **City summary cards**
   - At-a-glance stats: best months, total boatable days, dominant wind pattern
   - Radar chart: rate each city on wind, waves, water temp, season length, variety of destinations

### Verification
- [ ] Second city loads and renders correctly with its own map bounds and data
- [ ] Switching between cities preserves filter state where applicable
- [ ] Comparison view shows meaningful differences between cities
- [ ] No SF Bay-specific code in the engine/ directory

---

## Phase 7: Polish, Performance & Deploy
**Goal:** Production-ready, beautiful, fast.

### Tasks

1. **Design polish**
   - Light mode theme: clean white, same heatmap palette, Mapbox `light-v11`
   - Dark mode refinement: navy gradients, subtle glow effects on high-score routes
   - Responsive audit: test all views on 375px (iPhone SE), 768px (iPad), 1440px (desktop)
   - Loading states: skeleton screens for map, shimmer on heatmap cells
   - Micro-interactions: marker pulse on best-hour, route glow on hover, smooth filter transitions
   - Framer Motion: AnimatePresence for panel open/close, layout animations for view switching

2. **Performance optimization**
   - Memoize GeoJSON generation (useMemo on route arcs)
   - Virtualize large lists (23×23 matrix is small enough, but future-proof)
   - Lazy load non-map views (code splitting)
   - Mapbox layer paint property transitions (GPU-accelerated, not React re-renders)
   - Debounce slider input (16ms frame budget)

3. **Accessibility**
   - Keyboard navigation for all controls
   - ARIA labels on map markers and controls
   - Color-blind safe palette option (blue→orange instead of green→red)
   - Screen reader descriptions for charts

4. **SEO & meta**
   - Open Graph tags with map screenshot for social sharing
   - Title/description per view
   - Structured data for the app

5. **Deploy to Vercel**
   - `vercel.json` with SPA rewrite
   - Environment variable: `VITE_MAPBOX_TOKEN`
   - Custom domain setup
   - Analytics (Vercel Analytics or Plausible)

### Verification
- [ ] Lighthouse score > 90 on performance, accessibility, best practices
- [ ] All views work on mobile Safari, Chrome, Firefox
- [ ] Dark/light mode toggle is instant with no flash
- [ ] Map interactions are smooth at 60fps
- [ ] Deployed and accessible at production URL

---

## Phase 8: "This Weekend" Live Forecast Mode
**Goal:** Real-time scoring of the next 7 days using free forecast APIs. The killer feature for regular boaters.

### Tasks

1. **Forecast data service** (`engine/forecast.ts`)
   - Fetch NWS marine zone forecasts (api.weather.gov, zones PZZ530/PZZ531) — free, no API key, GeoJSON
   - Fetch Open-Meteo Marine API (marine-api.open-meteo.com) — free, no key, hourly wave/wind/SST for any lat/lng globally
   - Fetch Open-Meteo Weather API — hourly wind, temp, cloud cover, visibility (fog proxy)
   - Parse into same zone/time format as historical data
   - Cache with 1-hour TTL (forecasts update every 6 hours)

2. **Weekend planner view** (`components/planner/WeekendPlanner.tsx`)
   - "This Weekend" toggle in the planner view — switches from historical averages to live forecast
   - 7-day strip: each day scored per activity with hourly breakdown
   - "Saturday 9 AM–1 PM is a 9/10 for kayaking at Clipper Cove"
   - Highlight the single best window in the next 7 days
   - Push notification potential (future): "Tomorrow morning is going to be a 10/10 — don't miss it"

3. **Forecast confidence overlay**
   - NWS forecasts are deterministic — show as solid prediction
   - For days 4-7, show wider confidence bands (forecast degrades with time)
   - Compare forecast to historical average: "This Saturday will be better than typical for July"

4. **Hourly condition timeline** (`components/planner/HourlyTimeline.tsx`)
   - For a selected day: horizontal hour-by-hour bar showing wind, wave, comfort score
   - Color-coded blocks: green hours = go, yellow = marginal, red = stay home
   - Optimal departure window highlighted with "leave by X, return by Y"

### Verification
- [ ] NWS and Open-Meteo data fetches work without API keys
- [ ] Forecast scores align with historical patterns (July PM should still score low for kayaks)
- [ ] Weekend planner shows reasonable 7-day forecast
- [ ] Hourly timeline accurately reflects forecast wind/wave changes through the day

---

## Phase 9: Global Expansion & Water Body Types
**Goal:** Support any body of water worldwide — oceans, bays, lakes, rivers. Community-driven growth.

### Tasks

1. **Water body type system**
   - Types: `ocean_coast`, `bay`, `lake`, `river`, `delta`, `reservoir`
   - Each type has different default data sources and scoring adjustments:
     - Lakes: no swell/period, wind-chop only, water temp more variable, ice season
     - Rivers: current speed matters, no waves, width constraints
     - Ocean coasts: full swell + wind, longer period waves, stronger currents

2. **Global data source adapters**
   | Region | Wind/Wave | Water Temp | Tides | Water Quality |
   |--------|-----------|------------|-------|---------------|
   | US waters | NOAA NDBC + NWS | USGS + NDBC | CO-OPS | EPA WQP |
   | Global oceans | Open-Meteo Marine | Copernicus SST | WorldTides (free tier) | Local agencies |
   | Lakes (US) | Open-Meteo Weather + nearest ASOS | USGS | N/A | EPA WQP |
   | Lakes (global) | Open-Meteo Weather | Copernicus/local | N/A | Local agencies |
   | Europe | Open-Meteo + ECMWF | Copernicus | EU tide services | EEA bathing water |

3. **Community location submission**
   - "Add your local spot" — user submits: location name, lat/lng, water body type, launch points
   - Automated data population: pull nearest weather station, generate zone data from Open-Meteo historical API
   - Moderation queue before publishing

4. **Example locations to prove global scale**
   - US: Lake Tahoe, Puget Sound, Chesapeake Bay, Florida Keys, Lake Michigan
   - International: Sydney Harbour, Mediterranean (Côte d'Azur), Lake Como, Caribbean (BVI)
   - Each demonstrates a different water body type

5. **"Best water in the world" explorer**
   - Filter globally by: water temp > X°F, clarity/visibility, wave height, season
   - "Where is the warmest, calmest, clearest water in the world right now?"
   - Powered by Copernicus SST + Open-Meteo + water quality databases
   - Leaderboard: rank locations by total annual boatable days, water temp, variety

### Verification
- [ ] Lake Tahoe renders correctly as a lake (no swell data, wind-only scoring)
- [ ] Open-Meteo provides reasonable wind data for any global coordinate
- [ ] "Best water" explorer returns sensible results (Caribbean for warm+clear, Tahoe for clear+cold)
- [ ] Community submission flow works end-to-end

---

## Phase 10: Boat Lifestyle Advisor & City Rankings
**Goal:** Help people decide what boat to buy and where to live for boating.

### Tasks

1. **"What boat should I get?" advisor** (`components/advisor/BoatAdvisor.tsx`)
   - Input: location, budget range, available time (weekends only / weekdays too / retired), interests (fishing, family cruising, watersports, sailing)
   - Output: ranked boat types with reasoning:
     - "In SF Bay, a 24ft sailboat gives you 200+ days/year and access to all 23 destinations"
     - "A SUP is $400 and gives you 250+ calm mornings/year in Richardson Bay"
     - "A wakeboard boat works best in the Delta — only 80 good days on the main bay"
   - Show annual "boating calendar" for each boat type at their location
   - Cost-per-boating-day estimate

2. **City rankings** (`components/compare/CityRankings.tsx`)
   - Global leaderboard: cities ranked by boating opportunity
   - Filterable by activity type: "Best cities for kayaking" vs "Best cities for sailing"
   - Metrics:
     - Total comfortable boating days per year (by activity)
     - Average water temperature
     - Season length (months with score > 6)
     - Destination variety (# of reachable spots)
     - Water clarity/quality
   - Side-by-side comparison: pick 2-4 cities, compare across all metrics
   - "If you're a kayaker considering where to live, San Diego gives you 300 days, SF Bay gives you 250, Seattle gives you 150"

3. **"Getting started" guides**
   - For each activity × location: what gear you need, where to launch, best first trip
   - "First-time SUP in SF Bay: Start at Clipper Cove on a September morning. Rent from X. Water temp 62°F — wear a wetsuit."
   - Link out to local rental shops, clubs, classes (future monetization)

4. **Seasonal opportunity calendar**
   - For any location: 12-month view showing which activities are in-season
   - "Lake Tahoe: SUP May–September mornings, kayak April–October, no boating November–March (ice/snow)"
   - Vacation planning tool: "Visiting Tahoe in August? Here's what you can do on the water"

### Verification
- [ ] Boat advisor gives sensible recommendations (doesn't suggest wakeboarding in open ocean)
- [ ] City rankings correctly reflect climate differences (SD > SF > Seattle for warm-water activities)
- [ ] Seasonal calendar aligns with known patterns
- [ ] Getting started guides are accurate for SF Bay launch points

---

## Data Sourcing Plan (Free, Reliable, Auditable)

### Tier 1: MVP (Static Historical Averages)
All data baked into the app as TypeScript constants. Derived from the PRD's expert knowledge of SF Bay conditions, cross-referenced with:

| Data Need | Source | Format | Cost |
|-----------|--------|--------|------|
| Historical wind/wave | NOAA NDBC (stations 46026, FTPC1, TIBC1, AAMC1) via ERDDAP | JSON/CSV | Free |
| Tide predictions | NOAA CO-OPS API (station 9414290) | JSON | Free |
| Current predictions | NOAA CO-OPS SFBOFS model (50+ bay points) | JSON | Free |
| Marine forecasts | NWS api.weather.gov (zones PZZ530, PZZ531) | GeoJSON | Free |
| Water temperature | USGS continuous monitoring (8 SF Bay stations) | JSON | Free |
| Water quality | EPA Water Quality Portal (bounding box query) | CSV/JSON | Free |
| Fishing seasons | CDFW regulations (static, updated annually) | Static | Free |
| Crab/shellfish closures | CDPH biotoxin monitoring (public notices) | Static | Free |
| Sunset times | Computed algorithmically (solar position formula) | N/A | Free |
| Fog probability | Derived from NDBC visibility data + SFO ASOS | CSV | Free |

### Tier 2: Live Forecast Integration (Post-MVP)
Replace static averages with live data feeds:

| Feed | Source | Update Frequency | API Key? |
|------|--------|-----------------|----------|
| Real-time buoy observations | NDBC realtime2/ | Hourly | No |
| 7-day marine forecast | NWS api.weather.gov | Every 6 hours | No (User-Agent only) |
| Tide predictions | CO-OPS API | On-demand | No |
| Current predictions | CO-OPS SFBOFS | 6-hourly | No |
| Wave model forecasts | Open-Meteo Marine API | Hourly | No |
| Water quality advisories | Swim Guide / Baykeeper | Weekly | No |
| Fishing season updates | CDFW news releases | Seasonal | No |
| Shellfish biotoxin alerts | CDPH public health advisories | As-needed | No |

### Tier 3: Monte Carlo Ensemble (Future)
- ECMWF ensemble runs (51 members) via Copernicus Marine — free with registration
- GFS ensemble (21 members) via NOAA NOMADS — free
- Generate probability distributions by running scoring formula across all ensemble members
- Display as confidence bands (P10/P25/P50/P75/P90)

### "Verify Before You Go" Links (baked into every scored result)
Each zone/route links to the real-time authoritative sources so users can confirm conditions:

| Zone / Area | Verify Link | What It Shows |
|-------------|-------------|---------------|
| Central Bay | [NOAA PZZ530 Forecast](https://api.weather.gov/zones/forecast/PZZ530/forecast) | NWS marine forecast text |
| South Bay | [NOAA PZZ531 Forecast](https://api.weather.gov/zones/forecast/PZZ531/forecast) | NWS marine forecast text |
| SF Bar / ocean | [NDBC Buoy 46026](https://www.ndbc.noaa.gov/station_page.php?station=46026) | Live wind, wave, temp |
| Fort Point / Gate | [NDBC FTPC1](https://www.ndbc.noaa.gov/station_page.php?station=FTPC1) | Live wind at Golden Gate |
| Tiburon / Richardson | [NDBC TIBC1](https://www.ndbc.noaa.gov/station_page.php?station=TIBC1) | Live wind at Tiburon |
| Alameda / East Bay | [NDBC AAMC1](https://www.ndbc.noaa.gov/station_page.php?station=AAMC1) | Live conditions |
| Tides (all) | [CO-OPS 9414290](https://tidesandcurrents.noaa.gov/noaatidepredictions.html?id=9414290) | Tide predictions SF |
| Currents | [CO-OPS Currents](https://tidesandcurrents.noaa.gov/noaacurrents/Predictions?id=SFB1201_18) | Current predictions Golden Gate |
| Fishing seasons | [CDFW Ocean Fishing](https://wildlife.ca.gov/Fishing/Ocean) | Current season status |
| Crab season | [CDFW Crab](https://wildlife.ca.gov/Fishing/Ocean/Regulations/Fishing-Map/Dungeness-Crab) | Dungeness opener/closures |
| General weather | [NWS Bay Area](https://forecast.weather.gov/MapClick.php?lat=37.78&lon=-122.42) | General forecast |

These links appear in every trajectory panel, every route detail card, and the "Before You Go" checklist.

### Data Provenance
Every data point in the app will show:
- Source (e.g., "NOAA NDBC Station 46026")
- Date range (e.g., "1996-2025 historical average")
- Update frequency
- Link to raw data
- **Disclaimer**: "This is a planning tool based on historical averages. Always check real-time conditions before going on the water."

---

## B2B Extension: Freedom Boat Club

Design the boat selector to support "fleet mode":
- FBC fleet presets: their actual boat models with real specs
- "Which boat should I take today?" recommendation based on:
  - Conditions at destination (rough day → bigger boat)
  - Activity (waterskiing → wake boat, fishing → center console)
  - Party size
  - Experience level
- Fleet availability integration (future API)
- White-label potential: custom branding, custom fleet data

---

## Key Technical Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Vite over Next.js | Pure SPA, no SSR needed — all data is static client-side | Simpler, faster, lighter |
| Tailwind v4 CSS-first | No config file, theme in CSS, native dark mode | Modern, clean, fast |
| Zustand over Redux | Small app state, no boilerplate, TypeScript-first | Right-sized for this app |
| Recharts over Nivo | Larger community, composable, good for confidence bands | Better Monte Carlo support |
| Mapbox over MapLibre | Better dark styles, smoother transitions, 50K free loads | Worth the free tier |
| Static data first | Ship fast, validate UX, add live data later | MVP velocity |
| City data modules | Each city is a directory of TypeScript files | Clean separation, easy to add cities |
| Client-side scoring | No backend needed, instant filter updates | Zero infrastructure cost |

---

## Execution Order

Each phase is a deployable increment. Phase 1-2 together = a visually stunning MVP worth sharing.

| Phase | Effort | Cumulative Value |
|-------|--------|-----------------|
| 1: Foundation + Data | Medium | Internal demo |
| 2: Interactive Map | Large | **Shareable MVP** — the "wow" moment |
| 3: Heatmap + Filters | Medium | Power-user tool, slice every variable |
| 4: Boat Selector + Details | Medium | Personalized experience, FBC-ready |
| 5: Planner + Monte Carlo | Large | Full product vision, probabilistic charts |
| 6: Multi-City | Medium | Platform scale, city comparison |
| 7: Polish + Deploy | Medium | Production launch |
| 8: Live Forecast ("This Weekend") | Medium | **Daily utility** — "should I go Saturday?" |
| 9: Global Expansion | Large | Lakes, rivers, oceans worldwide |
| 10: Boat Advisor + City Rankings | Large | **Lifestyle tool** — what to buy, where to live |
