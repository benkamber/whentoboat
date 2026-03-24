# WhenToBoat — Revenue-Maximizing Feature Matrix

## Three Personas, Three Revenue Streams

---

## Persona 1: The Boat Owner (B2C — $49.99/yr Premium)

**Who:** Owns a $30K–$500K boat. Pays $5K–$25K/yr in slip, fuel, insurance, maintenance. Goes out 15–50 days/year. Lives in the Bay Area. Household income $150K+. Currently uses 3–4 apps and still texts their dock neighbor.

**Core pain:** "I spend $20K/year on this boat and I'm only confident enough to use it 20 days. I waste half my weekends second-guessing the weather."

### Features That Drive Premium Conversion

| Feature | Free | Premium | Why They Pay |
|---------|------|---------|-------------|
| Basic comfort score (median) | ✅ | ✅ | Gets them in the door |
| P10/P90 variability range | ❌ | ✅ | "The range tells me if I should trust the score" |
| "This Weekend" 7-day forecast | 3-day only | Full 7-day | Weekend planning requires seeing Wed→Sun |
| Custom vessel profile | 3 presets | Full custom (LOA, speed, fuel, GPH, draft) | Their specific boat matters |
| Multi-leg trip builder | ❌ | ✅ | "Sausalito → Angel Island → Tiburon → home" |
| Departure time optimizer | ❌ | ✅ | "Leave at 9:15 AM to catch slack current at Raccoon Strait" |
| Seasickness/comfort adjustment | ❌ | ✅ | "My wife gets seasick — show me only calm routes" |
| Saved spots (unlimited) | 3 max | Unlimited | Bookmark their favorite destinations |
| 12-month calendar planner | ❌ | ✅ | "When should I schedule my vacation days?" |
| Sunset cruise planner | ❌ | ✅ | Shareable, Instagram-worthy. "Depart 6:45, sunset at 7:42" |
| Push notifications | ❌ | ✅ | "Perfect morning for sailing tomorrow — don't miss it" |
| Historical condition explorer | ❌ | ✅ | "What's July typically like at Angel Island?" |
| Fuel cost estimator | ❌ | ✅ | "$47 fuel round-trip to Half Moon Bay at current prices" |
| Whale watching comfort index | ❌ | ✅ | "Bringing guests? Here's how rough it'll feel for them" |
| City comparison | ❌ | ✅ | "Planning a trip to San Diego — how does it compare?" |
| Ad-free experience | ❌ | ✅ | Clean, premium feel |
| Data export (PDF trip plan) | ❌ | ✅ | Print and post at the helm |

**Revenue model:** $49.99/yr. Target 5% conversion.
- 10K users → $25K ARR
- 50K users → $125K ARR
- 250K users → $625K ARR

**Upsell triggers:**
- Free user hits 3-day forecast limit on Wednesday → "Upgrade to see the full weekend"
- Free user tries to save 4th spot → "Upgrade for unlimited saved spots"
- Free user sees "P90 wind could reach 25 kts" teaser → "Upgrade to see full variability"

---

## Persona 2: The Boat Rental / Charter Company (B2B — $200–$500/mo)

**Who:** Kayak rental shops, yacht charter companies, fishing charter operators, pontoon rental docks. Revenue depends on bookings. Bad weather = cancellations = lost revenue.

**Core pain:** "Customers call us asking 'will Saturday be good?' and we don't have a great answer. Half our cancellations are weather-related."

### Features That Drive B2B Revenue

| Feature | Value to Rental Operator | Revenue Model |
|---------|-------------------------|---------------|
| **Embeddable conditions widget** | "Conditions for your rental: 8/10 calm morning" on their booking page. Reduces "should I cancel?" calls. | $99–$199/mo per operator |
| **Booking page integration** | Customer picks a date → widget shows conditions forecast → increases booking confidence | $149–$299/mo |
| **Fleet-specific scoring** | Score conditions for THEIR specific boats (e.g., "Our 16ft kayaks" vs "Our tandem kayaks" vs "Our SUP boards") | $199–$399/mo |
| **Cancellation risk indicator** | Dashboard showing which upcoming bookings are at risk of bad weather → proactive rebooking | $199–$399/mo |
| **Customer-facing trip planner** | White-labeled "Where should I go?" tool on their website. Drives engagement, reduces support calls. | $299–$499/mo |
| **Safety briefing generator** | Auto-generated safety briefing based on today's conditions for their fleet and routes | $99–$199/mo |
| **Multi-location dashboard** | For operators with 3+ locations: which location has best conditions today? Route customers accordingly. | $399–$599/mo |
| **"Best Day This Week" email** | Automated email to their customer list: "This Saturday is a 9/10 for kayaking at our Sausalito location" | $99–$199/mo |
| **Referral listing in WhenToBoat** | "Rent a kayak at Clipper Cove → Sea Trek Kayak" with booking link. Curated, premium placement. | $149–$299/mo listing fee |
| **Seasonal demand forecasting** | Historical analysis: "Your Sausalito location has 180 rentable days/yr. September is your best month." | $199/mo |

**Example operators in SF Bay:**
- Sea Trek Kayak & SUP (Sausalito) — kayak/SUP rentals
- Cal Adventures (Berkeley Marina) — sailboats, kayaks, SUP
- Stardust Fishing Charters — sportfishing
- SF Bay Adventures — powerboat charters
- Anchor Out Sailing — day charters
- Captain Kirk's (Sausalito) — yacht charters
- GetMyBoat / Boatsetter listings — peer-to-peer rentals

**Revenue model:** $200–$500/mo per operator. Target 20 operators in SF Bay = $48K–$120K ARR just from one market.

**Sales motion:** After MVP launches and has 1K+ users, approach operators with: "500 people searched for kayaking at your location last month. Here's how you can capture them."

---

## Persona 3: Boat Clubs & Marinas (B2B Enterprise — $1K–$5K/mo)

**Who:** Freedom Boat Club (60K+ members, 400+ locations), Carefree Boat Club, yacht clubs, large marinas. High-value memberships ($300–$1K/mo + $5K–$17K initiation). Revenue depends on member satisfaction and retention.

**Core pain:** "Members who don't use their membership don't renew. Weather uncertainty is the #1 reason members don't go out. 1/3 of our members are first-time boaters who need hand-holding."

### Features That Drive Enterprise Revenue

| Feature | Value to Club/Marina | Revenue Model |
|---------|---------------------|---------------|
| **Reservation advisor** | "Based on the 7-day forecast, Saturday 8AM slot will be a 9/10. Sunday PM is risky." Helps members pick the right slot BEFORE the calendar fills up. | $1K–$3K/mo per club |
| **Fleet-specific recommendations** | "For Saturday's conditions, take the 24ft Yamaha AR240 (calm enough for guests). The 21ft Boston Whaler would be better for fishing." | Included in enterprise |
| **Member onboarding tool** | New members get a guided "Your first trip" flow: best easy routes, what to expect, safety briefing. Reduces churn from intimidation. | Included in enterprise |
| **White-labeled member portal** | FBC-branded version of WhenToBoat. Members log in through FBC app → see conditions for their club location with their fleet. | $3K–$5K/mo |
| **Utilization analytics dashboard** | "Your fleet utilization is 34%. On days scoring 7+, utilization jumps to 68%. Here's how to nudge members to book on good-weather days." | $2K–$4K/mo |
| **Automated "Good Day" alerts** | Push notification to all members: "Tomorrow morning is a 9/10 — we have 3 boats available. Reserve now." Drives same-day/next-day bookings. | Included in enterprise |
| **Seasonal planning report** | "Your location has 180 comfortable boating days/yr. Here's the month-by-month breakdown for marketing and staffing." | Included in enterprise |
| **Multi-location comparison** | For FBC operators with multiple clubs: "Your Sausalito location averages 160 good days/yr vs Alameda at 145. Route members accordingly." | $1K–$2K/mo add-on |
| **Safety compliance dashboard** | Track which members received safety briefings, float plan reminders, PFD checks. Reduces liability for the club. | Included in enterprise |
| **Guest/demo day optimizer** | "Next month's best day for a prospective member demo ride: Saturday March 15, 9/10 conditions, calm morning." Drives new member acquisition. | Included in enterprise |

**Revenue model:** $1K–$5K/mo per club location.
- 5 FBC locations in Bay Area = $60K–$300K ARR
- 20 FBC locations nationally = $240K–$1.2M ARR
- Full FBC network (400+ locations) = enterprise deal, $500K–$2M+/yr

**Sales motion:** Build a polished demo with FBC fleet presets. Show utilization uplift potential. Pitch to Brunswick Corporation (FBC's parent company) regional managers. One enterprise deal validates the entire B2B model.

---

## Persona 3b: Yacht Clubs (B2B — $500–$2K/mo)

**Who:** St. Francis Yacht Club, Corinthian Yacht Club, Oakland Yacht Club, Richmond Yacht Club, Encinal Yacht Club. 200–2,000 members each. Mix of racers and cruisers.

| Feature | Value | Revenue |
|---------|-------|---------|
| **Race day wind forecast** | "Saturday's race: expect 18–22 kts from 270° by start time. Central Bay will be 9/10 for racing." | $500–$1K/mo |
| **Cruise committee planner** | "Best weekend for the Angel Island cruise: September 13–14, both days 8/10+." | Included |
| **New member orientation** | Same as FBC — guided first-trip tool. Yacht clubs have high new-member dropout. | Included |
| **Club website widget** | "Current conditions at our club" embedded on the yacht club website. | $200–$500/mo |
| **Event weather briefing** | Auto-generated weather briefing PDF for the race committee or cruise fleet captain. | Included |

---

## Revenue Summary (Optimistic but Grounded)

| Revenue Stream | Year 1 | Year 2 | Year 3 |
|----------------|--------|--------|--------|
| B2C Premium ($49.99/yr) | $25K (500 subs) | $125K (2,500 subs) | $625K (12,500 subs) |
| Rental operators ($250/mo avg) | $30K (10 operators) | $120K (40 operators) | $360K (120 operators) |
| Boat clubs ($2K/mo avg) | $48K (2 clubs) | $240K (10 clubs) | $960K (40 clubs) |
| Yacht clubs ($750/mo avg) | $18K (2 clubs) | $72K (8 clubs) | $180K (20 clubs) |
| **Total ARR** | **$121K** | **$557K** | **$2.1M** |

---

## Data Points Per Activity That Drive Revenue

### For Kayak/SUP Users (and their rental operators)
- Wind speed + gusts (kts) — the #1 safety factor
- Wave height (ft) — different threshold than any other vessel
- Wave period (seconds) — short period = steep chop = capsizing risk
- Current speed + direction (kts) — paddling against 3-knot current = going nowhere
- Current-vs-wind interaction — opposing = steep dangerous waves
- Water temperature (°F) — cold water shock risk (SF Bay is 50–65°F)
- Air temperature (°F) — hypothermia risk when wet
- Visibility (miles) — fog = can't see ferry traffic
- Tide level — affects launch ramp accessibility, beach exposure
- UV index — hours on the water with no shade
- Nearest shelter/landing — if conditions deteriorate, where do you go?
- Commercial vessel traffic patterns — ferry routes, shipping lanes to avoid
- PFD requirement reminder
- Sunset time — don't get caught in the dark

### For Powerboat Users (and boat clubs / charter operators)
- Wind speed + gusts (kts) — passenger comfort
- Wave height (ft) — ride quality, spray, guest experience
- Wave period (seconds) — short period = pounding ride; long period = gentle roll
- Current speed + direction — affects fuel burn and transit time
- Fuel consumption estimate (gallons round trip) — cost-conscious
- Fuel cost estimate ($) — at current fuel prices
- Transit time (minutes) — based on vessel speed, factoring current
- Range limit — can you get there and back?
- Draft clearance at destination — factoring current tide
- Bar crossing conditions — for routes exiting the bay (Half Moon Bay, ocean fishing)
- Seasickness comfort index — for guests, families, whale watching groups
- Dock availability at destination — guest slips, rafting, moorings
- Engine hours estimate — for maintenance planning
- Optimal departure window — factoring current, wind, return conditions
- "Return by" time — when conditions deteriorate for the return trip
- Slip/berth availability at destination
- Pumpout station locations
- Fuel dock locations along route

### For Sailors (and yacht clubs)
- Wind speed + direction (kts) — THE variable. Too little = boring. Too much = dangerous.
- Wind angle to route — beam reach (fast, fun) vs dead upwind (slow, wet) vs downwind (rolling)
- Gust factor — difference between sustained and gusts = difficulty
- Wave height + period — determines ride quality under sail
- Current direction — sailing with current vs against affects VMG dramatically
- Tacking angle penalty — headwind routes take 2–3x longer
- Reefing recommendations — "Expect to reef by 2 PM as wind builds past 18 kts"
- "Enough wind?" indicator — sometimes too LITTLE wind is the problem
- Racing wind forecast — predicted wind at race start time, expected shifts
- Sail selection guidance — "Main + 135% genoa" vs "Main + jib, reef at 2 PM"
- Heeling angle estimate — for crew comfort and safety
- Course VMG optimization — best time to depart for wind angle advantage
- Anchoring conditions at destination — wind direction, holding, fetch
- Engine backup needed? — if wind dies, can you motor home before dark?

---

## Features That Serve ALL Personas

| Feature | Boat Owner | Rental Op | Boat Club | Yacht Club |
|---------|-----------|-----------|-----------|------------|
| Comfort score with range | ✅ Core | ✅ Widget | ✅ Advisor | ✅ Briefing |
| "Where else?" alternatives | ✅ Core | ✅ Route customers to better location | ✅ Suggest different club location | ✅ Cruise planning |
| "This Weekend" forecast | ✅ Core | ✅ Booking page | ✅ Reservation advisor | ✅ Race committee |
| Vessel-specific scoring | ✅ Premium | ✅ Fleet scoring | ✅ Fleet matching | ✅ Club fleet |
| Safety checklist + NOAA links | ✅ Core | ✅ Safety briefing | ✅ Compliance | ✅ Crew briefing |
| Departure time optimizer | ✅ Premium | ✅ Customer guidance | ✅ Slot recommendation | ✅ Race start |
| Seasonal patterns | ✅ Premium | ✅ Demand forecasting | ✅ Utilization planning | ✅ Event calendar |
| Push notifications | ✅ Premium | ✅ Customer re-engagement | ✅ Member nudge | ✅ Race alerts |
| Trip plan export (PDF) | ✅ Premium | ✅ Customer handout | ✅ Float plan | ✅ Cruise plan |
| Range/fuel calculations | ✅ Premium | ✅ Fleet matching | ✅ Reservation advisor | ✅ Cruise distance |
| Embeddable widget | ❌ | ✅ Revenue | ✅ Revenue | ✅ Revenue |
| White-label portal | ❌ | ❌ | ✅ Revenue | ❌ |
| Analytics dashboard | ❌ | ✅ Revenue | ✅ Revenue | ❌ |

---

## The Algorithm (Simplified)

Every destination, for every user, at every point in time, gets a composite score:

```
REACHABILITY (binary gates — can you even get there?)
├── Fuel range: enough gas for round trip? (or enough wind for sail?)
├── Draft clearance: deep enough at current tide?
├── Current: can you make headway? (kayak vs opposing current)
├── Regulatory: is the area open? (fishing season, marine sanctuary)
└── Daylight: enough time to get there and back before dark?

COMFORT (1–10 score, activity-specific)
├── Wind score: in the ideal range for this activity?
├── Wave score: below threshold? Factor wave period.
├── Current-wind interaction: opposing = wave height multiplier
├── Vessel wave tolerance: scale by LOA
├── Personal comfort adjustment: seasickness sensitivity
├── Temperature comfort: air + water temp
└── Visibility: fog penalty

OVERALL = REACHABILITY gates × COMFORT score
+ "Where else?" = top alternatives if score < 7
+ "Why this score" = top risk factor + what could change
+ "Verify" = specific NOAA/NWS/CO-OPS links
```

The map colors every destination by this composite score, from the selected origin, factoring weather, vessel, activity, time, and personal preferences.
