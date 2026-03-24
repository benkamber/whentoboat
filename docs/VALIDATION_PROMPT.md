# WhenToBoat — Implementation Plan Validation Prompt

Use this prompt with ChatGPT, Gemini, Claude, or any AI to pressure-test the implementation plan.

---

## Prompt

I'm building **WhenToBoat**, a web application that answers "When should I go boating, and where?" for recreational boaters. I have a 14-week implementation plan and need you to ruthlessly validate it. Be specific about what's wrong, what's missing, and what will fail. I don't want cheerleading — I want holes found.

### Context

**What it is:** A planning tool (NOT a real-time conditions authority) that synthesizes wind, waves, tides, currents, and 44 years of historical NOAA data into activity-specific comfort scores. A kayaker and a racing sailor see completely different maps of the same bay. Every recommendation links to authoritative sources (NOAA, NWS, CO-OPS) for verification. Variability warnings (P10/P50/P90) are a core feature — "7/10 today but historically ranges 3–9."

**Safety posture:** "Plan here, confirm there." The Tomales Bay kayaking fatality is our north star. Every trajectory panel includes a "Before You Go" checklist with direct NOAA links. We show variability ranges, not just averages.

**Data:** Zero user-generated content. ALL data from vetted government/OEM sources. Every API tested with real HTTP requests — NOAA NDBC buoys (44yr history, works), CO-OPS tides (90 stations, works), CO-OPS currents (285 stations, works), Open-Meteo (7-day forecast, works, no API key). Boat fuel data curated from manufacturer specs. Launch ramps from state government databases.

**Market:** 85M US recreational boaters. 11.67M registered vessels. SeaLegsAI (closest competitor — reactive go/no-go, no activity-specific scoring, no historical patterns) and Deckee (safety/compliance focused) are building in this space. Competitive window is 6–12 months.

**Wedge:** Kayakers/SUP paddlers (highest pain — most vulnerable to conditions) for organic growth. Boat club members (FBC: 60K+ members, $300-1K/mo dues, must reserve slots in advance) for B2B revenue.

**Tech:** Vite + React + TypeScript, Tailwind v4, Zustand, Mapbox GL JS, Recharts, Motion, Turf.js. All client-side scoring, no backend. Deploy to Vercel. PWA from day 1.

### The 14-Week Plan

**Phase 1 (Week 1–2): Foundation + Data**
- Scaffold project with all dependencies
- Nautical dark/light theme with Tailwind v4
- All SF Bay data: 23 destinations, 11 exposure zones (monthly AM/PM wind/wave/period), 253-pair distance matrix, cross-zone routing rules, 15+ boat ramps, 11 fishing spots with CDFW seasons, sunset data
- 12+ activity profiles with scoring formulas (sailing, powerboating, kayak/SUP, kiteboard, waterski, rowing, fishing, crabbing)
- Scoring engine returning P10/P25/P50/P75/P90 variability ranges
- Trajectory engine: leg-by-leg zone analysis, bottleneck identification, hourly/monthly profiles, "where else?" alternatives
- Vessel scaling: wave tolerance by LOA, draft restrictions, fuel range limits

**Phase 2 (Week 2–4): Interactive Map**
- Mapbox dark map of SF Bay with custom navy water
- 23 destination markers with color-coded scores
- Route lines as Bezier arcs between all viable destinations, colored by comfort
- Time-of-day slider (5AM–10PM) that recolors all routes in real time, with play button
- Month selector (12 buttons)
- Activity selector that transforms the entire map
- "Where else?" — when destination scores low, alternatives glow on map
- Trajectory panel (slide-in): at-a-glance score → leg-by-leg breakdown → hour-by-hour timeline → 12-month calendar → "Before You Go" checklist with NOAA links → trajectory comparison
- Launch ramp markers
- Mobile responsive

**Phase 3 (Week 4–5): Filters + Heatmap + Matrix**
- Filter sidebar: range sliders for all variables
- Heatmap: origin × destination × month, sortable
- 23×23 all-pairs matrix
- Dark/light mode
- URL state sync for shareable links

**Phase 4 (Week 5–7): Boat Selector + Multi-Leg Trips**
- Preset vessels (7 types) + custom entry (LOA, speed, fuel, GPH, draft)
- Vessel change re-runs entire model
- Trajectory comparison (2–3 routes side-by-side)
- Multi-leg trip builder: chain stops, cumulative stats, per-leg warnings
- Boat rental links at destinations (curated, not UGC)
- FBC-ready fleet preset system

**Phase 5 (Week 7–9): Calendar Planner + Sunset Engine + Monte Carlo**
- "When should I go?" planner: ranked months, best time, P10–P90 per month
- Sunset cruise planner: best route, departure time, fog probability, view quality
- Monte Carlo fan charts (Recharts confidence bands)
- Comfort sparklines and condition bands

**Phase 6 (Week 9–11): Live Forecast ("This Weekend")**
- Fetch Open-Meteo + NWS forecasts
- 7-day strip scored per activity with hourly breakdown
- Compare forecast to historical averages
- Forecast confidence degrades for days 4–7

**Phase 7 (Week 11–13): Multi-City + Comparison**
- Add second city (San Diego or Puget Sound)
- City-agnostic engine confirmed (zero SF Bay references in engine/)
- City comparison: boatable days, water temp, season length

**Phase 8 (Week 13–14): Polish + Deploy**
- Performance, accessibility, responsive audit
- Legal (ToS, disclaimers)
- Vercel deploy, custom domain, analytics

### Monetization
- **Free:** Basic map, activity scoring (median), single trajectory, safety warnings, verify links
- **Premium ($49.99/yr):** Monte Carlo bands, multi-leg builder, custom vessels, "This Weekend" forecast, calendar planner, city comparison
- **B2B (boat clubs):** White-labeled, fleet presets, reservation advisor

### Post-MVP
- FBC B2B pilot (Month 4–5)
- Global expansion with Open-Meteo (Month 5–8)
- Boat lifestyle advisor + city rankings (Month 6–9)

---

## What I Need You To Validate

### 1. Technical Feasibility
- Is 14 weeks realistic for a solo developer (with AI assistance) to build all 8 phases?
- Are there technical risks I'm underestimating? (Mapbox performance with 253 animated route lines? Client-side scoring for 253 routes × 12 months × 18 hours × 12 activities?)
- Is Vite + React the right choice, or should I consider Next.js for SEO?
- Will Recharts handle Monte Carlo fan charts well, or do I need D3 directly?
- Is client-side-only sustainable at scale, or will I need a backend sooner than I think?

### 2. Product & UX
- Is the "where else?" flow prominent enough, or does the plan still feel too much like "here's a score" rather than "here's what you should do"?
- Is progressive disclosure (simple → trajectory → advanced) the right UX paradigm for this audience?
- Am I trying to do too many activities at launch? Should I ship with just kayak/SUP + powerboat + sailing and add fishing/kite/waterski later?
- Is the sunset cruise planner a distraction or a differentiator?
- Should the landing page be the map, or should it be a simpler "what are you doing today?" activity picker?

### 3. Data & Safety
- Is 44 years of NDBC buoy data enough for meaningful P10/P50/P90 estimates by month + time of day?
- The NWS marine forecast API returns unstructured text — is regex parsing reliable enough, or is this a fragile dependency?
- Am I underestimating the liability risk? Is "plan here, confirm there" legally sufficient?
- Should I have a marine safety advisor review the scoring formulas before launch?
- Are there edge cases where the scoring could be dangerously wrong? (e.g., wind-against-current creating steep waves that the model doesn't capture?)

### 4. Market & Strategy
- Is $49.99/yr the right price? Too high for paddlers? Too low for serious boaters?
- Should I pursue the FBC B2B partnership before building the consumer product, or after?
- Is SF Bay too niche to demonstrate product-market fit to investors?
- Am I right to exclude swimming and surfing, or am I leaving too much TAM on the table?
- Is "WhenToBoat" the right name? Does it alienate kayakers who don't think of themselves as "boaters"?

### 5. What's Missing?
- What critical features am I NOT building that users will expect?
- What data sources am I missing?
- What competitor moves could blindside me in the next 12 months?
- What's the #1 thing that will cause this product to fail?

### 6. Phasing
- Is the phase ordering correct? Should anything move earlier or later?
- Should Phase 6 (live forecast) be earlier — is that the killer feature that should be in MVP?
- Is Phase 7 (multi-city) premature? Should I stay single-city longer?
- Am I trying to build too much before shipping? What's the absolute minimum viable product?

---

Please be brutally honest. I'd rather hear "this won't work because X" now than discover it in month 3. Cite specific examples from comparable products (Surfline, OnX, SeaLegsAI, Fishbrain) where relevant.
