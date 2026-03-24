# WhenToBoat — Deep Research Prompt

Use this prompt with ChatGPT Deep Research, Gemini Deep Research, Perplexity, or Claude with web search to validate the idea, market, safety approach, and monetization strategies.

---

## Research Request

I'm building **WhenToBoat** — a web application that answers the question **"When should I go boating, and where?"** for recreational boaters. I need comprehensive research to validate the idea, assess the market opportunity, evaluate the safety approach, and identify monetization strategies.

Please conduct deep research across all of the following areas and provide a structured report with citations.

---

## 1. IDEA VALIDATION

### 1.1 Core Problem
WhenToBoat addresses the fact that recreational boaters — sailors, powerboaters, kayakers, SUP paddlers, kiteboarders, windsurfers, waterskiers, rowers, and fishermen — currently have no tool that proactively answers "When should I go, and where?" Existing tools are either raw data displays (Windy, SailFlow, Windguru) that require meteorological expertise to interpret, or navigation apps (Navionics, Savvy Navvy) that help while you're already on the water. No consumer app synthesizes weather, wave, tide, wind, and seasonal patterns into an actionable, activity-specific recommendation with probabilistic confidence intervals.

Research questions:
- **Is this a real unmet need?** Search boating forums (Cruisers Forum, SailNet, The Hull Truth, Reddit r/sailing, r/kayaking, r/boating), Facebook groups, and social media for people asking variants of "when is the best time to go boating in [location]?" or "what are conditions like for kayaking in [month]?" How frequently do recreational boaters ask these kinds of planning questions?
- **How do boaters currently plan trips?** What tools, apps, websites, and information sources do recreational boaters use to decide when and where to go? What's the current workflow? How fragmented is it?
- **What are the pain points with current solutions?** Search for complaints about existing marine weather apps (too complex, too much data, no recommendations, not activity-specific). What do casual boaters say they wish they had?
- **Has anything like this been tried before and failed?** Search for startups or products in the "boating trip planning" or "marine activity recommendation" space that launched and shut down. What can we learn from their failures?
- **Is there a demand signal for probabilistic/Monte Carlo weather presentation?** Are consumers in any adjacent domain (skiing, surfing, hiking, golf) using probability-based condition forecasts? Is there evidence that casual users can understand and value probability bands over point forecasts?

### 1.2 Competitive Landscape (deep dive)
I've identified the following competitors. Please verify my assessment of each and find any I've missed:

**Marine weather data tools:** Windy, PredictWind, SailFlow, Buoyweather, Surfline (surf-only)
**Navigation apps:** Navionics (Garmin), Savvy Navvy, Aqua Map, iNavX, Wavve Boating, Argo
**Wind sport apps:** iKitesurf/WindAlert, Windguru, Windfinder
**AI/recommendation tools:** SeaLegsAI (go/no-go safety assessment), Deckee (risk forecasts), Ramp Assist (ramp crowding)
**Water quality:** Swim Guide, Heal the Bay Beach Report Card

For each competitor, please find:
- Current pricing and business model
- User count / download count / MAU if available
- Funding history (Crunchbase, PitchBook)
- Recent product changes or pivots
- User reviews and ratings (App Store, Google Play)
- What they do well and where they fall short for the "when should I go?" use case
- Any evidence of them moving toward recommendation/planning features

**Specific question:** SeaLegsAI appears to be the closest competitor — it provides AI-powered go/no-go assessments for planned trips. How does it work exactly? What is its user base? Is it free/sustainable? How does WhenToBoat differentiate (proactive recommendation vs. reactive assessment)?

### 1.3 Analogous Success Stories
Research products in adjacent outdoor recreation categories that succeeded with a similar model (conditions data → activity-specific recommendations):
- **Surfline** — How did it grow from surf forecasts to a $200M+ business? What was its growth trajectory? Revenue model?
- **OnX / Gaia GPS** — How did they build a business around outdoor recreation mapping?
- **Ski resort condition apps** (OpenSnow, etc.) — How do they monetize weather-based recommendations for outdoor activities?
- **Strava** — Relevant lessons about building community around outdoor activity tracking?
- **Any fishing-specific apps** (Fishbrain, FishAngler, Anglr) — How large is the market? Revenue models? What worked?

---

## 2. MARKET SIZE & TAM

### 2.1 Recreational Boating Market
Research and quantify:
- **Total recreational boaters in the US** (NMMA and Coast Guard statistics). Include: registered boats, estimated unregistered (kayaks, SUPs, canoes), boater households
- **Breakdown by boat type:** sailboats, powerboats, PWC (jet skis), kayaks, canoes, SUPs, rowing shells, inflatables. How many of each?
- **Breakdown by activity:** day cruising, fishing, watersports (skiing/wakeboarding), sailing, paddling, kiteboarding/windsurfing. Participation numbers for each.
- **Growth trends:** Is recreational boating growing? Which segments are growing fastest? (SUP and kayak growth in particular)
- **Annual spending per boater** on accessories, services, and digital products
- **International market size:** recreational boaters globally, top 10 countries by boater count
- **SF Bay specifically:** How many registered boats in the SF Bay Area? How many marinas? Estimated total boaters including kayakers/SUP?

### 2.2 TAM/SAM/SOM Calculation
Based on the data above, estimate:
- **TAM (Total Addressable Market):** All recreational boaters worldwide who could use a condition planning tool. Include adjacent water sports (fishing from shore, kiteboarding, etc.)
- **SAM (Serviceable Addressable Market):** English-speaking boaters with smartphones in countries with good weather data coverage (US, UK, Australia, Canada, EU)
- **SOM (Serviceable Obtainable Market):** Realistic year-1 and year-3 user targets for a free app launching in SF Bay and expanding to US coastal cities
- **Revenue TAM:** If X% of users convert to premium at $Y/year, what's the revenue potential?

### 2.3 Adjacent Markets
- **Fishing license holders in the US** (state-by-state data from USFWS). These are potential users for the fishing/crabbing features.
- **Kiteboarding/windsurfing participation** globally and in the US
- **Open water swimming** market size (excluded from MVP but relevant to future expansion)
- **Boat club memberships** (Freedom Boat Club, Carefree Boat Club, others) — how many members? Growing?

---

## 3. SAFETY VALIDATION

### 3.1 Recreational Boating Accidents & Fatalities
This is critical. WhenToBoat's mission is to improve safety. Research:
- **USCG Recreational Boating Statistics** (most recent annual report): total accidents, injuries, deaths, property damage
- **Top causes of boating accidents and fatalities.** What percentage are weather-related? What percentage involve operator inexperience or poor planning?
- **Kayak and canoe-specific fatality data.** These are the most vulnerable users. How many kayak/canoe deaths per year? What are the leading causes?
- **The Tomales Bay kayaking fatality** (and any other notable Bay Area incidents): What happened? What planning failures contributed? Could better weather/condition information have helped?
- **Cold water shock and hypothermia statistics** for boaters. How many deaths are attributable to unexpected immersion in cold water?
- **Weather-related boating incidents:** How often do boaters get caught in unexpected weather? Is "conditions changed faster than expected" a documented factor?

### 3.2 Could Better Planning Tools Prevent Deaths?
- **Is there research or published analysis** on whether access to better weather information reduces boating accidents? (NOAA, Coast Guard, academic papers)
- **What do boating safety organizations** (BoatUS, US Sailing, American Canoe Association, National Safe Boating Council) say about planning and weather checking? What planning steps do they recommend?
- **Float plan adoption rates:** What percentage of recreational boaters file or share a float plan before going out? Is there data suggesting that float plan users have fewer incidents?
- **Weather checking behavior:** What percentage of boaters check marine weather before going out? What sources do they use? Is there research on the gap between "checked weather" and "understood what it meant for my specific activity and route"?
- **Liability case law:** Have marine weather app developers or boating information providers ever been sued when users were injured or killed relying on their information? What legal precedent exists? What disclaimers and terms of service are used by comparable apps (Windy, PredictWind, Surfline)?

### 3.3 WhenToBoat's Safety Approach
WhenToBoat takes a specific safety posture: **"Plan here, confirm there."** The app is explicitly a planning tool, not a real-time conditions authority. Every recommendation includes:
- Links to authoritative real-time data sources (NOAA buoys, NWS marine forecasts, CO-OPS tide predictions)
- Variability warnings showing the full P10/P50/P90 range of historical conditions
- "Before You Go" checklists per activity (check forecast, wear PFD, tell someone your plan)
- Explicit disclaimers that conditions can change rapidly

Research questions:
- **Is this the right approach?** How do other safety-adjacent consumer apps (avalanche forecasting, wildfire smoke apps, UV index apps) handle the liability of providing condition recommendations?
- **What disclaimer language** do marine weather and boating apps use? Collect examples from Windy, PredictWind, Surfline, SeaLegsAI, Navionics, and similar apps.
- **Could WhenToBoat partner with safety organizations** (BoatUS Foundation, NASBLA, Coast Guard Auxiliary) to validate the safety approach and gain credibility?
- **Insurance implications:** Does providing boating condition recommendations create any insurance or liability exposure? How do similar companies handle this?

---

## 4. DATA SOURCES — RELIABILITY & COVERAGE

### 4.1 NOAA Data Quality
WhenToBoat relies heavily on free NOAA data. Research:
- **NOAA NDBC buoy data reliability:** What is the uptime/availability of NDBC buoy stations? How often do they go offline? Are there documented data quality issues?
- **NWS marine forecast accuracy:** How accurate are NWS marine zone forecasts (PZZ530, PZZ531) for wind speed and wave height? Is there published verification data?
- **CO-OPS tide prediction accuracy:** How accurate are NOAA tide predictions vs. actual observed water levels? What's the typical error range?
- **NOAA API reliability and rate limits:** api.weather.gov uptime, failure modes, rate limiting behavior. Are there documented outages?

### 4.2 Historical Data for Monte Carlo
- **How many years of NDBC data are available for SF Bay stations?** Is the data continuous or are there gaps?
- **Is NDBC historical data sufficient for Monte Carlo/ensemble-style analysis?** What sample size is needed for meaningful P10/P50/P90 estimates by month and time of day?
- **Are there academic papers** using NDBC historical data for probabilistic marine condition analysis? What methodologies do they use?

### 4.3 Global Data Coverage
For international expansion:
- **Open-Meteo:** How accurate is Open-Meteo's marine forecast API for coastal and bay conditions? Any published accuracy assessments? Does it work for sheltered waters (bays, lakes) or only open ocean?
- **Copernicus Marine:** What is the spatial resolution of Copernicus wave/current models? Is it fine enough for within-bay conditions (e.g., distinguishing Richardson Bay from Central Bay in SF)?
- **What countries have good free marine weather data?** Map the availability of NOAA-equivalent data sources globally.

---

## 5. MONETIZATION STRATEGIES

### 5.1 Freemium Model Options
Research how similar apps monetize and propose a strategy for WhenToBoat:

- **What do boaters pay for digital products?** Survey app pricing in the marine space: Navionics ($49/yr), PredictWind ($29–$499/yr), Savvy Navvy ($99–$189/yr), Surfline ($70–$150/yr). What's the willingness to pay?
- **Free vs. premium feature split:** What should be free (to drive adoption and safety mission) vs. premium (to generate revenue)? Consider:
  - Free: basic map, activity scoring, trajectory analysis, safety warnings, verify links
  - Premium: multi-leg trip builder, vessel profile customization, this-weekend live forecast, Monte Carlo confidence bands, city comparison, data export, ad-free
- **Is the safety mission compatible with a paywall?** If the core value is keeping people safe, can you charge for it? How do avalanche safety apps (Avalanche.org) and weather safety apps handle this tension?

### 5.2 B2B Revenue Streams
- **Freedom Boat Club (FBC):** FBC has 400+ locations and 85,000+ members (verify these numbers). What does FBC spend on technology? Could WhenToBoat provide white-labeled trip planning for FBC members? What would FBC pay for a tool that increases boat utilization and member satisfaction?
- **Other boat clubs:** Carefree Boat Club, SailTime, Boatsetter, GetMyBoat. How large are these? Do they have technology partnerships?
- **Marina and harbor partnerships:** Could marinas pay for WhenToBoat integration to drive guest slip reservations? (Dockwa, Snag-a-Slip, Marinas.com as potential partners)
- **Boat manufacturers and dealers:** Would Yamaha, Mercury, Boston Whaler, etc. pay for branded vessel profiles in the boat selector? Is this a viable ad/sponsorship model?
- **Tourism boards and destination marketing:** Could coastal tourism boards pay to have their locations featured? ("Visit Half Moon Bay — 120 comfortable boating days per year")
- **Insurance companies:** Would marine insurance providers (GEICO Marine, Progressive Boat, BoatUS) partner with a safety-focused planning tool for premium discounts?

### 5.3 Affiliate & Lead Generation
- **Boat rental/charter affiliate revenue:** If users discover they want to go kayaking at Clipper Cove, can WhenToBoat earn a referral fee by linking to local kayak rental shops? What are typical affiliate rates in outdoor recreation?
- **Boat purchase lead generation:** The "What boat should I get?" advisor could generate leads for dealers. What is a qualified boat buyer lead worth?
- **Gear and accessory affiliate:** Link to PFDs, kayaks, SUPs, marine electronics on Amazon or REI with affiliate codes. What are typical commission rates?

### 5.4 Data & API Licensing
- **Could WhenToBoat license its scoring engine or data?** Would other apps, travel sites, or marina websites pay for an API that returns "boating comfort score" for a given location/date/activity?
- **Advertising revenue potential:** At scale, what CPMs are realistic for a niche outdoor recreation audience? What would a 100K MAU and 500K MAU generate in ad revenue?

### 5.5 Comparable Revenue Benchmarks
- **Surfline revenue and valuation** (acquired for $200M+ — verify). Revenue model breakdown.
- **Fishbrain revenue** (fishing app with 13M+ users — verify). How does it monetize?
- **Windy.com revenue** from Windy Premium subscriptions. Estimated revenue based on user count?
- **PredictWind revenue** — bootstrapped? VC-funded? Profitable?

---

## 6. PRODUCT FUNCTIONALITY BEING BUILT

For context, here is the complete functionality planned for WhenToBoat. Please assess whether this feature set is appropriate for the market, whether anything critical is missing, and whether the phasing makes sense.

### 6.1 Core Concept
WhenToBoat is a **planning tool** (not a navigation or real-time weather app) that uses historical weather/ocean data, activity-specific scoring, and vessel profiles to recommend when and where to go boating. It starts with San Francisco Bay and expands globally. It is **safety-first**: every recommendation links to authoritative real-time data sources and includes variability warnings.

### 6.2 Activity Types Supported
- **Sailing:** casual daysail (8–15 kts ideal), racing (12–22 kts ideal)
- **Powerboating:** cruising (calm water, < 10 kts wind), sunset cruises (glass-off conditions, < 8 kts)
- **Paddling:** kayaking and SUP (< 8 kts wind, < 1.5 ft waves, sheltered water)
- **Wind sports:** kiteboarding and wing foil (18–25 kts ideal, consistent wind required)
- **Watersports:** waterskiing, wakeboarding (< 5 kts, < 0.5 ft waves, flat water — early morning only)
- **Rowing:** sculling, rowing shells (< 5 kts, < 0.5 ft, protected water)
- **Fishing:** bay fishing (tide-dependent, dawn/dusk bite), ocean fishing (swell period matters), pier/shore fishing, crabbing (Dungeness season Nov–Jun), clamming/mussels (seasonal quarantine)
- **NOT included (for now):** surfing (Surfline owns this space, different model), swimming (water quality liability too high without real-time verification)

### 6.3 SF Bay Data (MVP)
- **23 boating destinations** with GPS coordinates, dock/landing info, activity suitability tags
- **11 exposure zones** (Richardson Bay, Central Bay, SF Shore, East Bay, North Bay, San Pablo Bay, South Bay, Deep South Bay, Delta, Ocean South, Ocean North) with monthly AM/PM wind, wave height, wave period, and comfort data
- **253-pair distance matrix** for all destination combinations (statute miles, water route)
- **Cross-zone routing rules:** routes that traverse multiple zones inherit the worst-case conditions (e.g., Sausalito→Oakland crosses Central Bay — comfort = min of Richardson, Central, East Bay scores)
- **11 fishing/harvest spots** with target species, seasonal regulations, and CDFW season gates
- **Sunset data:** monthly sunset times, golden hour windows, glass-off patterns, fog probability
- **Regulatory seasons:** Dungeness crab opener, salmon season, rockfish restrictions, mussel quarantine

### 6.4 Scoring Engine
- Each activity has ideal wind range, max wind, max wave, and preferred zones
- Comfort score (1–10) computed per zone/month/time-of-day for each activity
- The same location on the same day scores completely differently for different activities (Central Bay July PM: 2/10 for kayaks, 9/10 for racing sailors)
- **Variability range:** every score returns P10/P25/P50/P75/P90 historical range, not just a median
- **Vessel adjustment:** bigger boats get more wave tolerance, speed changes transit times, draft restricts certain destinations
- **Fishing-specific scoring:** tide phase bonus (incoming tide = better), dawn/dusk bite bonus, season gate (out of season = score tanks)

### 6.5 Interactive Map (Hero View)
- Mapbox GL JS dark-mode map of SF Bay with custom navy water color
- 23 destination markers as color-coded circles (green→red by comfort score) with score text inside
- Route lines as Bezier arc curves between all viable destinations, colored by comfort score
- **Time-of-day slider** (5 AM–10 PM): dragging it recolors all routes in real time as conditions change through the day — the visual "aha" moment (morning: everything green → afternoon: central bay routes turn red, sheltered routes stay green → evening glass-off: partial recovery)
- **Play button:** auto-scrubs the slider to animate the bay "breathing" across a day
- **Month selector:** 12 buttons, switching month transforms the map (July = sparse red skeleton; September = dense green web)
- **Activity selector:** switching activity completely recolors the map (kayak vs. racing sail = inverted)
- Click a route line → trajectory detail panel slides in
- Click a destination → show all routes from it

### 6.6 Trajectory System (Core Interactive Unit)
A trajectory is a journey from point A to point B (or A→B→C for multi-leg). It is the core clickable element throughout the app:
- **Leg-by-leg zone breakdown:** each zone traversed shown as a bar, colored by score, with the bottleneck leg highlighted ("You'll cross Central Bay — expect 20kt winds and 3ft chop in PM")
- **Variability warnings:** "This zone is highly variable. Score is 7/10 typical, but ranges 3–9. Conditions can build from calm to 20+ kts between 10 AM and 2 PM."
- **Hour-by-hour timeline:** comfort score at every hour, with P10/P90 shading. Shows the safe departure/return window.
- **12-month calendar:** this trajectory scored across all months — seasonal sweet spots and danger zones
- **"Before You Go" checklist:** tailored per activity — check marine forecast (with direct link to NOAA), check live wind (with direct link to NDBC buoy), check tides, wear PFD (kayakers), tell someone your plan
- **Trajectory comparison:** side-by-side 2–3 routes showing tradeoffs ("Sausalito→Angel Island crosses Central Bay; Sausalito→Tiburon stays sheltered")
- **Multi-leg trip builder:** chain stops on the map, get cumulative time/fuel/conditions with per-leg warnings and a departure schedule

### 6.7 Boat Selector
- Preset vessels: 21ft center console, 35ft sailboat, kayak, SUP, wakeboard boat, rowing shell, jet ski
- Custom entry: LOA, cruise speed, fuel capacity, GPH, draft
- Changing vessel re-runs the entire model: wave tolerance scales with LOA, transit times change with speed, draft restricts destinations, fuel limits range
- **Freedom Boat Club "fleet mode":** presets for FBC's actual boat models, "which boat should I take for this route?" recommendation

### 6.8 Heatmap & Matrix Views (Power Users)
- **Heatmap:** origin × destination × month matrix, colored by comfort score. Sortable by every variable. AM/PM/Sunset toggle.
- **Full 23×23 matrix:** all-pairs comfort grid for a selected month + activity. Hover for details.
- **Filter sidebar:** range sliders for max/min wind, max wave, max period, min comfort score, max transit duration. Activity dropdown. All filters update all views in real time.

### 6.9 Calendar Planner
- Pick activity + destination (or "anywhere") → see ranked months, best time of day, optimal departure time, expected conditions
- 12-month strip with comfort score range (P10–P90), # of "good" days, best time window per month
- Click a month → expand to weekly view with daily variance

### 6.10 Sunset Cruise Planner
- Select month → app recommends best sunset route, optimal departure time (sunset - transit - 45 min), expected conditions, fog probability, view quality (western-facing routes score higher)
- Timetable: depart → arrive → sunset → return

### 6.11 "This Weekend" Live Forecast Mode (Post-MVP)
- Pulls live NWS marine forecasts (free, no API key) and Open-Meteo hourly forecasts (free, no key)
- Scores the next 7 days per activity with hourly breakdown
- "Saturday 9 AM–1 PM is a 9/10 for kayaking at Clipper Cove"
- Compares forecast to historical average: "This Saturday will be better than typical for July"

### 6.12 Multi-City Architecture
- City-agnostic engine: scoring, routing, and trajectory analysis work for any body of water
- Each city/location is a self-contained data module (zones, destinations, distances, seasonal data)
- Supports bays, lakes, rivers, ocean coasts, reservoirs — each water body type has different scoring adjustments
- **City comparison:** side-by-side metrics (total boatable days, water temp, season length, destination variety)
- **City rankings:** global leaderboard of best boating locations, filterable by activity

### 6.13 Boat Lifestyle Advisor (Future)
- "What boat should I get?" — input location, budget, available time, interests → ranked recommendations with reasoning
- "In SF Bay, a SUP gives you 250+ calm mornings/year for $400"
- Annual boating calendar per boat type, cost-per-boating-day estimates
- Seasonal opportunity calendar for any location

### 6.14 Design & UX
- **Aesthetic:** "Marine chart meets Bloomberg terminal" — clean, modern, nautical. Not kitschy. Dark mode default (navy palette), light mode available.
- **Progressive disclosure:** simple surface (pick activity, see green dots, tap one) → trajectory explorer (click route for full analysis) → advanced planning (heatmaps, matrices, Monte Carlo). Users never see complexity they didn't ask for.
- **Tech stack:** Vite + React + TypeScript, Tailwind CSS v4, Zustand state management, Mapbox GL JS, Recharts, Framer Motion. Deploy to Vercel. All scoring computed client-side, no backend needed for MVP.

---

## 7. STRATEGIC QUESTIONS

Please research and provide informed opinions on:

1. **Should WhenToBoat launch as a web app, mobile app, or both?** What do boaters prefer? Is there a PWA opportunity?
2. **What's the right launch market?** SF Bay first (deep, opinionated, prove the concept) vs. broad-but-shallow (many cities, less depth)? What did Surfline, Fishbrain, and Windy do?
3. **Is the "plan here, confirm there" safety model strong enough?** Or will users treat the app as authoritative regardless of disclaimers? How can we mitigate that risk?
4. **What's the growth strategy?** Organic (shareable map visualizations going viral), SEO (rank for "best time to kayak SF Bay"), partnerships (BoatUS, FBC), paid acquisition, or community-driven?
5. **Should WhenToBoat seek VC funding or bootstrap?** What's the right capital strategy for a niche outdoor recreation SaaS? What have comparable startups raised?
6. **Is there a defensible moat?** If Windy or Navionics decided to build this feature, how would WhenToBoat compete? What's defensible — data curation, community, brand, UX, B2B relationships?
7. **What's the role of AI/LLM?** Could a conversational interface ("I'm visiting SF for the weekend with my family and we have a 21ft powerboat — what should we do Saturday?") be more powerful than a dashboard? Should WhenToBoat have a chat-based planner?
8. **International expansion priority:** After US coastal cities, what countries/regions should be next? Where is boating participation growing fastest?
9. **What are the biggest risks?** (e.g., NOAA API goes down, competitor builds this, liability incident, data accuracy problems, user adoption barriers)
10. **Name and positioning:** Is "WhenToBoat" the right name? Is "When to Boat" clear enough as a value proposition? What names do comparable apps use? Would something like "BoatWeather" or "BoatScore" or "TideWise" be stronger?

---

## 8. DELIVERABLES REQUESTED

Please structure your research report with:

1. **Executive Summary** (1 page) — key findings, go/no-go recommendation, top 3 opportunities, top 3 risks
2. **Market Analysis** — TAM/SAM/SOM with data sources cited, growth trends, comparable company benchmarks
3. **Competitive Landscape** — matrix of competitors with features, pricing, user counts, strengths, weaknesses
4. **Safety Analysis** — accident statistics, preventability assessment, legal/liability framework, recommended disclaimers
5. **Data Source Assessment** — reliability, coverage, and gaps in the free data sources
6. **Monetization Strategy** — recommended pricing model with revenue projections at 10K, 50K, 100K, 500K users
7. **Product Feedback** — assessment of the planned feature set: what's right, what's missing, what should be cut or re-prioritized
8. **Strategic Recommendations** — launch market, growth strategy, funding approach, timing
9. **Risk Matrix** — top 10 risks ranked by likelihood and impact, with mitigation strategies

Cite all sources. Include links. Distinguish between hard data and informed estimates.
