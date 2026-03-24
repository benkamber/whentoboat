# WhenToBoat — MVP Plan (6 Weeks)

**Date:** 2026-03-24
**Mantra:** Find my best outing window and backup option this weekend.

---

## What Changed and Why

The original 14-week, 10-phase plan was over-scoped. Three independent validators and competitive reality demand a tighter build. SeaLegsAI is already shipping route AI. The window is 6 months, not 24.

**Cut from MVP:**
- Fishing, crabbing, kiteboard, waterski, rowing, sculling (→ month 2–3)
- Multi-leg trip builder (→ month 3)
- Full 23×23 heatmap/matrix (→ month 3)
- Monte Carlo fan charts as front-and-center feature (→ month 2; P50 + range shown, just not as fancy charts)
- Sunset cruise planner (→ month 3; good differentiator but not the wedge)
- Multi-city / city comparison (→ month 4+)
- B2B fleet presets (→ after working demo exists, month 3–4)
- Boat rental integration (→ month 3)

**Moved earlier:**
- Live 7-day forecast ("This Weekend") → now in MVP
- "Where else?" alternatives → primary UX pattern from day 1
- Activity picker landing page → first screen, not the map

**Changed:**
- Vite → **Next.js** (SEO is the #1 growth channel; landing pages must be indexable)
- 12 activities → **3** (kayak/SUP, powerboat cruise, casual daysail)
- 23 destinations → **12–15** (the ones that matter most for these 3 activities)
- 253 route arcs → **pre-filtered to viable routes only** (~40–60), single Mapbox line layer
- Wind-against-current interaction modifier added to scoring for Golden Gate, Raccoon Strait

---

## The One Workflow That Matters

```
1. "What are you doing?"  → Kayak / Powerboat / Sail
2. "When?"                → This weekend / Pick a month
3. HERE'S YOUR ANSWER     → Best 3 destinations + best time windows + score with range
4. WHY                    → Wind, waves, current, what could change
5. WHERE ELSE             → Prominent fallback card if score < 7
6. VERIFY                 → Direct NOAA/NWS/CO-OPS links
7. EXPLORE (optional)     → Open the map for deeper exploration
```

The map is the second screen, not the first. Users earn complexity by choosing to explore.

---

## Tech Stack (Revised)

| Choice | Why |
|--------|-----|
| **Next.js** (App Router) | SEO-critical landing pages + SPA-like interactivity for map. Vercel deploys natively. |
| Tailwind CSS v4 | Same as before. Dark/light, nautical theme. |
| Zustand | Same. Right-sized state management. |
| Mapbox GL JS (react-map-gl v8) | Same. But single line layer with data-driven styling, NOT 253 individual components. |
| Recharts | Same. Simple sparklines and area charts. Monte Carlo fan charts deferred. |
| Motion | Same. Panel animations, slider. |
| Next.js API Routes / Edge Functions | Cache Open-Meteo + NWS forecast data server-side. Parse NWS text server-side. |
| Vercel | Same. Zero-config for Next.js. |

**Key architecture decisions:**
- Pre-compute zone-level percentiles (P10/P25/P50/P75/P90 by month × hour) into static JSON at build time. ~2–5MB compressed. Route scores computed from these at runtime — fast.
- Forecast data fetched and cached server-side via Next.js API routes (1-hour TTL). No fragile client-side NWS parsing.
- PWA manifest from day 1. Push notifications architected but not shipped until month 2.

---

## Data (Simplified for MVP)

### Destinations: 12–15 (not 23)
Focus on the destinations that matter for kayak/SUP, powerboat, and casual sail:
```
Sausalito, Angel Island, Tiburon, Aquatic Park, Pier 39, Ferry Building,
Clipper Cove, Jack London Square, Berkeley Marina, Pt Richmond,
McCovey Cove, Alameda, Half Moon Bay (experienced only)
```
Remaining 8–10 destinations added in month 2.

### Zones: 8 (not 11)
Drop deep_south, delta, ocean_north for MVP. These serve activities not in MVP (waterski, fishing, ocean fishing).

### Routes: ~50–60 viable pairs (not 253)
Pre-filter to routes under 2 hours for the 3 MVP activities. Drastically reduces rendering load.

### Ramps: 8–10 public launches
The ones that serve the 12–15 MVP destinations. Curated from CA government sources.

### Everything else stays:
- Zone exposure data (monthly AM/PM wind/wave/period) — same
- Cross-zone routing rules — same
- Sunset times — computed algorithmically
- Verify links per zone — same

---

## Scoring (Revised)

### 3 Activity Profiles Only
```
Kayak/SUP:    ideal 0–8 kts, max 12 kts wind, max 1.5 ft waves
Powerboat:    ideal 0–10 kts, max 15 kts wind, max 2.0 ft waves
Casual Sail:  ideal 8–15 kts, max 20 kts wind, max 3.0 ft waves
```

### Score = median + range
Every score shows: **7/10 (ranges 3–9)**. Not full Monte Carlo fan charts — just the P10 and P90 bounds displayed as a small range indicator. Clean, simple, communicates uncertainty.

### Wind-Against-Current Modifier (Safety-Critical)
```typescript
function currentWindInteraction(windSpeed, windDir, currentSpeed, currentDir): number {
  // When wind opposes current (>120° difference), wave steepness increases dramatically
  const angleDiff = Math.abs(windDir - currentDir);
  const opposing = angleDiff > 120 && angleDiff < 240;
  if (opposing && currentSpeed > 1.5 && windSpeed > 10) {
    // Effective wave height multiplier: 1.5x–3x depending on severity
    const severity = (currentSpeed / 3) * (windSpeed / 15);
    return Math.min(3.0, 1.0 + severity);  // wave height multiplier
  }
  return 1.0;  // no interaction
}
```
Applied at Golden Gate, Raccoon Strait, Alcatraz-Angel Island slot, Carquinez Strait.

### "Why This Score" (Mandatory)
Every score MUST surface:
- Top risk factor ("Wind builds to 20+ kts by 2 PM")
- What could change ("Afternoon thermal not yet reflected in morning conditions")
- Confidence indicator ("High confidence" for calm September mornings, "Variable" for July afternoons)
- What to verify next (specific NOAA link)

### "Where Else?" (Primary UX)
When score < 7/10, immediately show a card:
```
┌──────────────────────────────────────────────────┐
│  💨 Central Bay is choppy right now (4/10)       │
│                                                  │
│  ✅ Richardson Bay is calm (8/10)                │
│     Sausalito → 2.3 mi from your pick            │
│     Wind: 5 kts · Waves: 0.3 ft                 │
│     [Switch to this destination →]               │
│                                                  │
│  ✅ Clipper Cove is sheltered (7/10)             │
│     Treasure Island → 3.5 mi                     │
│     [Switch →]                                   │
└──────────────────────────────────────────────────┘
```

---

## 6-Week Build

### Week 1: Foundation
- Next.js project scaffold + Tailwind v4 dark theme + Zustand + Mapbox + PWA manifest
- TypeScript interfaces: `ScoredRoute` (with range, verifyLinks, alternatives, riskFactors)
- SF Bay data: 12–15 destinations, 8 zones, ~55 distances, routing rules
- 3 activity profiles with scoring formulas
- Scoring engine: `activityScore()` + P10/P50/P90 from pre-computed zone percentiles
- Wind-against-current modifier for Golden Gate zone
- Vessel presets: kayak, 21ft powerboat, 25ft sailboat (no custom entry yet)
- "Where else?" logic: when score < 7, find top 2 alternatives

**Deliverable:** Scoring engine returns correct values in tests. `npm run dev` works.

### Week 2: The Answer Page
- **Landing page:** "What are you doing?" activity picker (3 cards) → "When?" (this weekend or pick month)
- **Recommendation page:** best 3 destinations with scores, time windows, risk factors, verify links
- "Where else?" cards prominent on every low-scoring result
- "Before You Go" checklist per activity with direct NOAA/NWS/CO-OPS links
- "Why this score" explanation for every recommendation
- Next.js server-side rendering for SEO: `/sf-bay/kayak/march` is an indexable page
- Mobile-first responsive layout

**Deliverable:** A user can pick "kayak" → "this Saturday" → see "Clipper Cove, 8/10, depart before 11 AM" with verify links. The "where else?" card shows if primary pick is low.

### Week 3: The Map
- Mapbox dark map of SF Bay, custom navy water
- 12–15 destination markers, color-coded by score
- ~50 route lines as single GeoJSON line layer (NOT individual components), data-driven color/opacity
- Time-of-day slider (5 AM–10 PM) recolors routes via Mapbox paint property updates (GPU-accelerated)
- Month selector (12 buttons)
- Activity selector (3 options)
- Click destination → shows outbound routes + scores
- Click route → slide-in trajectory panel (score + range + risk factors + hourly bar + verify links)
- "Where else?" cards when selected route scores low
- Launch ramp indicators on hover

**Deliverable:** Map renders smoothly on mobile Safari. Time slider creates visible morning→afternoon color shift. Activity switch inverts the map.

### Week 4: Live Forecast ("This Weekend")
- Next.js API route fetches Open-Meteo Marine + Weather hourly data, caches 1hr
- Next.js API route fetches NWS CWF text products, parses warnings/advisories server-side
- 7-day strip: each day scored per activity with best time window highlighted
- "Saturday 9 AM–1 PM is a 9/10 for kayaking at Clipper Cove"
- Hourly condition blocks: green = go, yellow = marginal, red = stay home
- Compare to historical: "This Saturday will be better than typical for March"
- Small Craft Advisory / Gale Warning badges when NWS issues them

**Deliverable:** User can see "best time this weekend" for their activity. Forecast updates every hour.

### Week 5: Trajectory Deep Dive + Boat Selector
- **Trajectory panel expanded:**
  - Leg-by-leg zone breakdown (simplified: origin zone → transit zone → destination zone)
  - Hour-by-hour comfort bar with P10/P90 shading
  - 12-month sparkline for this route
  - Variability warning when applicable
  - "Compare with another route" (basic side-by-side)
- **Boat selector:** 3 presets (kayak, powerboat, sailboat) + simple custom override (LOA, speed)
  - Changing vessel recalculates scores and transit times
  - Draft warnings if applicable
- **Saved spots:** bookmark up to 5 destinations, see their scores on the home screen
- Dark/light mode toggle

**Deliverable:** Full trajectory analysis works. Boat switch recalculates. Saved spots persist.

### Week 6: Polish + Deploy
- Onboarding: 3-screen tutorial ("Pick activity → See your bay → Check the forecast")
- Performance audit: test on iPhone SE, mid-range Android, iPad
- Color-blind safe palette option
- Legal: click-through disclaimer on first use, ToS, privacy policy
  - Key language: "Planning tool only — verify conditions before departure"
  - Modeled on PredictWind: "You do so solely at Your own risk"
- SEO: OG tags, structured data, indexable destination pages (`/sf-bay/kayak/clipper-cove`)
- Vercel deploy, custom domain (whentoboat.com), Plausible analytics
- Emergency/VHF channel info per zone (zero-cost safety add)
- Offline: cache last forecast + historical scores for PWA use

**Deliverable:** Live at whentoboat.com. Works on mobile. Onboarding doesn't lose people.

---

## Post-MVP Roadmap (Month 2–4)

| Week | What |
|------|------|
| 7–8 | Add remaining destinations (23 total), fishing + crabbing activities, tide-specific scoring |
| 9–10 | Kiteboard/wingfoil, waterski/wake, rowing activities. Full heatmap/matrix views. Filter sidebar. |
| 11–12 | Sunset cruise planner. Monte Carlo fan charts. Multi-leg trip builder. |
| 13–14 | Push notifications ("Perfect kayaking morning tomorrow"). Saved trips / recurring planner. |
| 15–16 | FBC B2B demo + pitch. Fleet presets. Reservation advisor mockup. |
| 17–20 | Second city (San Diego). City comparison. Premium paywall implementation. |

---

## Before Week 1 Starts

1. **Marine safety review.** Contact USCG Auxiliary or US Sailing instructor in SF Bay. Have them review the 3 activity scoring profiles and the wind-against-current modifier. 2 hours of their time.

2. **Legal review.** 30-minute call with a maritime attorney about disclaimer language and click-through waiver. Not expensive, absolutely necessary.

3. **Mapbox token.** Create account, get API key, verify free tier (50K loads/month).

4. **Open-Meteo commercial terms.** Verify pricing for commercial use (~$20-50/month). Confirm rate limits.

5. **10 beta testers lined up.** 5 kayakers (BASK or Sausalito community boathouse), 3 casual sailors (local yacht club), 2 powerboaters. They test at week 4 and week 6.

---

## What Success Looks Like at Week 6

A kayaker in Sausalito opens whentoboat.com on Friday evening.
- Taps "Kayak/SUP"
- Sees: "Saturday is a 9/10 at Clipper Cove, 8 AM–12 PM. Sunday is a 5/10 everywhere — afternoon winds."
- Taps Saturday → sees the map with Clipper Cove glowing green, Central Bay faded red
- Drags the time slider → watches the bay go from green to red as afternoon approaches → "oh, THAT'S why they said before noon"
- Taps the route → sees "Before You Go: check NOAA forecast → (link), wear PFD, tell someone your plan"
- Texts the link to a friend: "Look at Saturday — let's go to Clipper Cove"

That's the product. Everything else is Phase 2.
