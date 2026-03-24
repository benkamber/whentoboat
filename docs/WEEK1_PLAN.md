# WhenToBoat — Week 1 Implementation Plan

**Prerequisite:** Mapbox access token in `.env.local` as `NEXT_PUBLIC_MAPBOX_TOKEN`

---

## Phase 0: Documentation Discovery (COMPLETE)

### Verified Tech Stack
- **Next.js 16.2.1** — `npx create-next-app@latest` with `--yes` flag gives TypeScript + Tailwind v4 + App Router
- **Tailwind CSS v4.2.2** — installed automatically. CSS-first config via `@theme`. Dark mode via `@custom-variant dark`. No tailwind.config.js needed.
- **PostCSS plugin:** `@tailwindcss/postcss` (NOT `@tailwindcss/vite` — Next.js uses PostCSS)
- **Zustand 5.0.12** — `create<T>()()` double-parentheses pattern. Slice pattern with `StateCreator`. devtools middleware.
- **react-map-gl 8.1.0** — import from `'react-map-gl/mapbox'`. Requires `mapbox-gl` package + CSS import `'mapbox-gl/dist/mapbox-gl.css'`.
- **Motion** (Framer Motion) — import from `'motion/react'`

### Anti-Patterns to Avoid
- Do NOT create `tailwind.config.js` — Tailwind v4 uses CSS-first `@theme`
- Do NOT import from bare `'react-map-gl'` — must use `'react-map-gl/mapbox'`
- Do NOT use `@tailwindcss/vite` — Next.js needs `@tailwindcss/postcss`
- Do NOT forget `import 'mapbox-gl/dist/mapbox-gl.css'` — UI elements break without it
- Do NOT define GeoJSON `data` inline in Source components — use useMemo to prevent re-renders

---

## Phase 1: Project Scaffold + Theme

### What to implement
1. Create Next.js project: `npx create-next-app@latest whentoboat --yes`
2. Install additional deps: `npm install zustand react-map-gl mapbox-gl recharts motion @turf/turf`
3. Install dev deps: `npm install -D @types/mapbox-gl @redux-devtools/extension`
4. Create `.env.local` with `NEXT_PUBLIC_MAPBOX_TOKEN=pk.xxx`
5. Create `vercel.json` (empty object `{}` — Next.js handles routing natively on Vercel)
6. Create PWA manifest at `public/manifest.json`
7. Replace `src/app/globals.css` with nautical theme using Tailwind v4 `@theme`:
   - `@custom-variant dark (&:where(.dark, .dark *));` for class-based dark mode
   - Ocean palette: `--color-ocean-950: #0a1628` through `--color-ocean-50`
   - Heatmap scale: 10 stops green→gold→red (`--color-score-1` through `--color-score-10`)
   - Accents: compass gold, wake white, reef teal
   - Dark mode as default via `<html class="dark">`
8. Update `src/app/layout.tsx` to include dark class, manifest link, meta tags
9. Create a simple landing page at `src/app/page.tsx` confirming theme works

### Verification
- [ ] `npm run dev` starts without errors
- [ ] Dark nautical theme renders (navy background, light text)
- [ ] Tailwind utility classes work (`bg-ocean-950`, `text-score-8`, etc.)

---

## Phase 2: TypeScript Interfaces (engine/types.ts)

### What to implement
Create `src/engine/types.ts` with ALL core interfaces. The engine/ directory is city-agnostic — zero SF Bay references.

```typescript
// Core location types
City, Destination, Zone, ZoneConditions (monthly AM/PM wind/wave/period data)

// Activity
ActivityProfile (idealWindRange, maxWind, maxWave, preferredZones, vesselType)
ActivityType = 'kayak_sup' | 'powerboat_cruise' | 'casual_sail'

// Scoring
ComfortScore, ScoreRange (p10/p25/p50/p75/p90), ScoredRoute (score + range + verifyLinks + alternatives + riskFactors + beforeYouGo)
VariabilityWarning, RiskFactor

// Trajectory
TrajectoryAnalysis (origin, dest, distance, legs, overallScore, transitMinutes, fuelGallons, departureWindow, hourlyProfile, monthlyProfile, warnings)
TrajectoryLeg (zone, wind, waveHeight, wavePeriod, score, isBottleneck)

// Vessel
VesselProfile (type, name, loa, cruiseSpeed, fuelCapacity, gph, draft)
VesselType = 'kayak' | 'sup' | 'powerboat' | 'sailboat'

// Routing
RouteDistance, RoutingRule, CrossZoneRule

// Safety
VerifyLink (label, url, type: 'forecast'|'buoy'|'tide'|'wind'|'current')
BeforeYouGoItem (text, url?, activityTypes)

// Filters
FilterState (activity, month, hour, maxWind, minWind, maxWave, maxTransit, minScore)

// Data sources
DataSource (name, url, authority, updateFrequency)
```

### Verification
- [ ] `src/engine/types.ts` compiles without errors
- [ ] No SF Bay references in engine/ directory

---

## Phase 3: SF Bay Data Modules

### What to implement
Create `src/data/cities/sf-bay/` with all location-specific data.

**destinations.ts** — 13 key destinations for MVP:
```
Sausalito (SAU), Angel Island (ANG), Tiburon (TIB), Aquatic Park (AQP),
Pier 39 (P39), Ferry Building (FBG), McCovey Cove (MCC), Clipper Cove (CLP),
Jack London Square (JLS), Alameda (ALM), Berkeley Marina (BRK),
Pt Richmond (PTR), Half Moon Bay (HMB - experienced only)
```
Each with: id, name, code, lat, lng, zone, dockInfo, activityTags, launchRamp (if applicable), verifyLinks

**zones.ts** — 8 exposure zones with monthly AM/PM data:
```
richardson, central_bay, sf_shore, east_bay, north_bay, san_pablo, south_bay, ocean_south
```
Each zone has 12 months × 2 (AM/PM) = 24 data points with wind_kts, wave_ft, period_s, comfort_1to10
Data from the PRD tables provided by the user.

**distances.ts** — Distance matrix for 13 destinations (~78 unique pairs)
Values from the PRD distance matrix (subset of the 253-pair full matrix).

**routing-rules.ts** — Cross-zone routing:
```
Marin ↔ SF/East Bay → adds central_bay
SF ↔ East Bay → adds central_bay
Any ↔ Ocean → adds central_bay (must transit Gate)
```

**verify-links.ts** — Per-zone NOAA/NWS/CO-OPS links:
```
Central Bay → PZZ530 forecast, FTPC1 buoy, 9414290 tides
Richardson → TIBC1 buoy, 9414290 tides
East Bay → AAMC1 buoy, 9414750 tides
Ocean → 46026 buoy
```

**sunset.ts** — Monthly sunset times and golden hour data (from PRD).

**index.ts** — Exports the complete SF Bay city data module conforming to City interface.

### Also create:
**src/data/activities.ts** — 3 activity profiles:
- Kayak/SUP: ideal 0–8 kts, max 12, max 1.5ft, beforeYouGo: ["Wear a PFD", "Check current speed", "Tell someone your plan"]
- Powerboat cruise: ideal 0–10 kts, max 15, max 2.0ft, beforeYouGo: ["Check marine forecast", "Verify fuel level", "Test engine cutoff switch"]
- Casual daysail: ideal 8–15 kts, max 20, max 3.0ft, beforeYouGo: ["Check wind forecast", "Reef plan for afternoon", "VHF Ch 16 monitoring"]

**src/data/vessels.ts** — 3 vessel presets:
- Kayak: 4mph, no fuel, 0.5ft draft, LOA 14
- 21ft Powerboat: 30mph, 66gal, 9GPH, 2ft draft
- 25ft Sailboat: 6mph, 30gal, 2GPH, 4.5ft draft

### Verification
- [ ] All data files import and compile without errors
- [ ] SF Bay city module exports valid City object
- [ ] 13 destinations × 8 zones × 12 months data is complete
- [ ] Distance matrix has all 78 pairs

---

## Phase 4: Scoring Engine

### What to implement
Create `src/engine/scoring.ts`:

```typescript
activityScore(activity: ActivityProfile, windKts: number, waveHtFt: number, periodS: number): number
// Returns 1-10. Uses the formula from the PRD:
// Wind: peak at ideal range center, drops both sides
// Wave: 10 at 0, drops to 1 at maxWave
// Period adjust: short period + power = worse, long period + sail = bonus
// Combined: windScore * 0.5 + waveScore * 0.5 + periodAdjust

windCurrentInteraction(windSpeed: number, windDir: number, currentSpeed: number, currentDir: number): number
// Returns wave height multiplier (1.0 = no interaction, up to 3.0)
// Triggers when wind opposes current >120° and current >1.5kts and wind >10kts
// Applied at Golden Gate, Raccoon Strait zones

vesselWaveToleranceMultiplier(loa: number): number
// Returns multiplier: 1.0 + (loa - 20) * 0.025
// 20ft = 1.0x, 30ft = 1.25x, 40ft = 1.5x, 14ft kayak = 0.85x

routeComfort(origin: Destination, destination: Destination, month: number, timeOfDay: 'am' | 'pm', activity: ActivityProfile, vessel: VesselProfile, city: City): ScoredRoute
// Gets zones traversed, computes score for each, returns min (bottleneck rule)
// Includes scoreRange (P10/P50/P90 from zone data variance)
// Includes verifyLinks for zones traversed
// Includes alternatives via findAlternatives()

findAlternatives(origin: Destination, month: number, timeOfDay: 'am' | 'pm', activity: ActivityProfile, vessel: VesselProfile, city: City, excludeId: string): ScoredRoute[]
// Returns top 2 alternative destinations sorted by score descending
// Only destinations scoring >= 6
```

### Verification
- [ ] `activityScore` for kayak at wind=5, wave=0.5, period=3 returns 8-9
- [ ] `activityScore` for kayak at wind=20, wave=3, period=3 returns 1-2
- [ ] `activityScore` for casual_sail at wind=12, wave=1.5, period=5 returns 8-9
- [ ] `windCurrentInteraction` returns >1.5 when 15kt wind opposes 3kt ebb
- [ ] `routeComfort` for Sausalito→Angel Island correctly identifies central_bay zone
- [ ] `findAlternatives` returns Richardson Bay destinations when Central Bay scores low

---

## Phase 5: Routing + Trajectory Engine

### What to implement

**src/engine/routing.ts:**
```typescript
getRouteZones(origin: Destination, destination: Destination, city: City): Zone[]
// Looks up cross-zone routing rules, returns ordered list of zones traversed

transitTime(distanceMiles: number, cruiseSpeedMph: number): number
// Returns minutes

fuelRoundTrip(distanceMiles: number, gphAtCruise: number, cruiseSpeedMph: number): number | null
// Returns gallons for round trip, null if human-powered

isInRange(distanceMiles: number, vessel: VesselProfile): boolean
// Checks if round trip is within 80% of fuel capacity (safety margin)
// For human-powered: checks against endurance limit (2.5hr × speed)

draftClearance(destination: Destination, vessel: VesselProfile): { clear: boolean; warning?: string }
// Checks draft against destination minimum depth
```

**src/engine/trajectory.ts:**
```typescript
analyzeTrajectory(
  origin: Destination,
  destination: Destination,
  month: number,
  hour: number,
  activity: ActivityProfile,
  vessel: VesselProfile,
  city: City
): TrajectoryAnalysis
// Returns full analysis:
// - legs with per-zone conditions and scores, bottleneck flagged
// - overallScore = min(leg scores)
// - transitMinutes, fuelGallons
// - hourlyProfile: score at every hour 5AM-10PM (18 values)
// - monthlyProfile: score for each month at current hour (12 values)
// - warnings: human-readable strings about risks
// - verifyLinks: aggregated from all zones traversed
// - alternatives: top 2 better-scoring routes via findAlternatives
```

**src/engine/interpolation.ts:**
```typescript
getTimeComfort(zone: Zone, hour: number, month: number): ZoneConditions
// Interpolates between AM and PM data based on hour:
// hour <= 6: AM * 0.8 (pre-dawn)
// 7-10: full AM
// 10-13: linear blend AM→PM
// 13-17: full PM
// 17-19: glass-off recovery (PM + partial recovery toward AM)
// 19+: below PM
```

### Verification
- [ ] `getRouteZones` for Sausalito→JLS returns [richardson, central_bay, east_bay]
- [ ] `transitTime(1.8, 30)` returns ~3.6 minutes
- [ ] `fuelRoundTrip(10, 9, 30)` returns correct gallons
- [ ] `isInRange` returns false for kayak at 15 miles
- [ ] `analyzeTrajectory` returns complete analysis with legs, bottleneck, hourly profile
- [ ] `getTimeComfort` at hour 15 in July returns PM conditions (high wind)
- [ ] `getTimeComfort` at hour 8 in July returns AM conditions (calm)

---

## Phase 6: Zustand Store

### What to implement
Create `src/store/` with slices:

**src/store/filters.ts:**
```typescript
interface FilterSlice {
  activity: ActivityType
  month: number          // 0-11
  hour: number           // 5-22
  setActivity: (a: ActivityType) => void
  setMonth: (m: number) => void
  setHour: (h: number) => void
}
```

**src/store/vessel.ts:**
```typescript
interface VesselSlice {
  vessel: VesselProfile
  setVessel: (v: VesselProfile) => void
  setPreset: (type: 'kayak' | 'powerboat' | 'sailboat') => void
}
```

**src/store/trajectory.ts:**
```typescript
interface TrajectorySlice {
  selectedOrigin: string | null
  selectedDestination: string | null
  trajectoryAnalysis: TrajectoryAnalysis | null
  setOrigin: (id: string | null) => void
  setDestination: (id: string | null) => void
  setTrajectoryAnalysis: (t: TrajectoryAnalysis | null) => void
}
```

**src/store/index.ts:**
Combined store using slice pattern with devtools middleware.

### Verification
- [ ] Store compiles and renders in a test component
- [ ] Changing activity updates the store
- [ ] Vessel presets correctly populate all fields

---

## Phase 7: Integration Test Page

### What to implement
Create `src/app/test/page.tsx` — a simple page that:
1. Imports the SF Bay city data
2. Imports the scoring engine
3. Renders a list of all 13 destinations with their current comfort scores for the selected activity/month/hour
4. Shows a simple activity selector (3 buttons)
5. Shows a month selector (12 buttons)
6. Clicking a destination shows its TrajectoryAnalysis from origin=Sausalito
7. Shows "Where Else?" alternatives when score < 7
8. Shows verify links for each scored route

This page validates that the entire data + scoring + trajectory pipeline works before building the real UI.

### Verification
- [ ] All 13 destinations render with scores
- [ ] Switching activity changes scores (kayak vs sail should invert for windy zones)
- [ ] Switching month changes scores (September should be better than July for kayaks)
- [ ] Trajectory analysis shows correct legs and bottleneck
- [ ] Alternatives appear for low-scoring destinations
- [ ] Verify links point to correct NOAA pages

---

## File Structure After Week 1

```
src/
├── app/
│   ├── globals.css          # Nautical theme with @theme
│   ├── layout.tsx           # Dark mode default, meta tags, manifest
│   ├── page.tsx             # Simple landing (activity picker placeholder)
│   └── test/
│       └── page.tsx         # Integration test page
├── engine/                  # ZERO SF Bay references
│   ├── types.ts             # All TypeScript interfaces
│   ├── scoring.ts           # Activity scoring + wind-current interaction
│   ├── routing.ts           # Zone traversal, transit time, fuel, range
│   ├── trajectory.ts        # Full trajectory analysis
│   └── interpolation.ts     # Time-of-day interpolation
├── data/
│   ├── activities.ts        # 3 activity profiles
│   ├── vessels.ts           # 3 vessel presets
│   └── cities/
│       └── sf-bay/
│           ├── index.ts     # City data module export
│           ├── destinations.ts
│           ├── zones.ts
│           ├── distances.ts
│           ├── routing-rules.ts
│           ├── verify-links.ts
│           └── sunset.ts
├── store/
│   ├── index.ts             # Combined store
│   ├── filters.ts
│   ├── vessel.ts
│   └── trajectory.ts
public/
├── manifest.json            # PWA manifest
.env.local                   # NEXT_PUBLIC_MAPBOX_TOKEN
vercel.json                  # Vercel config
```
