# WhenToBoat — Research Synthesis

**Date:** 2026-03-23
**Sources:** 5 independent deep research reports (ChatGPT, Gemini, Perplexity, Claude)

---

## Verdict: GO — Unanimous Across All Sources

Every research source independently reached the same conclusion: this is a real product opportunity with a validated unmet need. The "when should I go boating?" question is asked constantly across every boating forum, and no existing tool answers it.

---

## What All Sources Agree On

### 1. The Problem Is Real and Loud
- Forum evidence across Reddit (r/boating, r/kayaking, r/sailing), The Hull Truth, ifish.net, Trawler Forum, BASK, and Facebook groups shows boaters repeatedly asking "is it safe this weekend?", "what are typical conditions?", "too rough for my boat?"
- One Trawler Forum user literally said: **"So looking around, what I was looking for doesn't exist."**
- A Bay Area kayaker asked for **"an app that can simply tell them the best times to kayak in the Bay without having to figure out tides and swells"** — that IS the product.

### 2. Current Workflow Is Broken
- Boaters use 3–7 separate apps before deciding to go out
- NOAA for forecasts → Windy for visualization → tide app for currents → Navionics for charts → Facebook groups for local knowledge → VHF on the water
- The pain is NOT "more data" — it's **data-to-decision translation**
- 95% of boats are under 26 feet — these users are most vulnerable to conditions and least served by existing tools

### 3. No Competitor Answers "When + Where"
- Every existing tool is either a data display (Windy, SailFlow, Windguru) or a navigation tool (Navionics, Savvy Navvy)
- **SeaLegsAI is the closest threat** — AI-powered Go/Caution/Avoid with alternative timing — but it's reactive (evaluates YOUR plan), not proactive (recommends THE BEST plan), and lacks activity-specific scoring and historical context
- **Deckee** is second closest — personalized risk forecast by vessel, government safety partnerships — but more compliance-focused than planning-focused
- **No competitor does activity-specific scoring** (same bay scores 2/10 for kayak, 9/10 for racing sail)
- **No competitor shows historical variance** (P10/P50/P90)
- **No competitor helps with location discovery** ("where ELSE should I go?")

### 4. SF Bay Is the Right Launch Market
- Extreme condition variability (calm morning → 25kt afternoon in hours)
- Tidal currents up to 6 knots at the Gate
- Dense, tech-savvy community
- If the algorithm works in SF Bay, it works anywhere
- Multiple FBC locations for B2B validation

### 5. Safety/Liability Is Manageable But Critical
- USCG: 556 boating fatalities in 2024, 76% drowning, 87% without PFD, 69% no safety education
- Kayaks/canoes/SUP = 26% of all boating deaths despite being a fraction of vessels
- Legal precedent (Brown v. United States) protects weather forecasters — "prediction of indeterminate reliability"
- PredictWind's terms: "You do so solely at Your own risk"
- "Plan here, confirm there" is the right posture — enforced through UI, not just disclaimers

### 6. The Surfline Model Is the Template
- Surfline proved that activity-specific condition ratings + historical data + ML = $200M+ business
- OpenSnow proved probabilistic weather presentation works for consumers ($29.99/yr)
- OnX proved synthesizing public data into a single interface = $100+/yr subscriptions
- Fishbrain proved 12M+ users will engage with condition-based outdoor planning

---

## Where Sources Disagree

### Wedge Segment
| Source | #1 Pick | Reasoning |
|--------|---------|-----------|
| Report 1 | Kayakers/SUP | Highest pain, most vulnerable, easiest community distribution |
| Report 2 | N/A (UGC focus) | — |
| Report 3 | Boat club members | Acute scheduling pain, B2B distribution, high WTP, dockmaster safety net |
| Report 4 | Boat club members | High ARPU, B2B channel, liability mitigation via dockmaster |
| Report 5 | Boat club members | Reservation model creates monetizable version of "when to go" |

**Synthesis:** Three of four substantive reports pick boat club members. But Report 1 makes a compelling case for kayakers as the *pain* wedge (highest vulnerability, most conditions-sensitive, easiest organic distribution). The resolution: **kayakers/SUP for organic consumer growth, boat clubs for revenue and B2B validation**. They're not mutually exclusive — build for kayakers' pain, sell through boat clubs.

### Monetization
| Strategy | Evidence For | Evidence Against |
|----------|-------------|-----------------|
| Freemium $49.99/yr | Aligns with Navionics, OpenSnow pricing | Paddlers have low WTP; SeaLegsAI is free |
| B2B boat clubs | FBC has 60K+ members, 640K trips/yr, clear distribution | Requires enterprise sales capability |
| Affiliate/lead gen | West Marine 4-15% commission, high AOV in marine | Low margin, distraction from core product |
| API licensing | Unique scoring engine, no existing equivalent | Premature for MVP stage |

**Synthesis:** Start free to build user base and fulfill safety mission. B2B boat club partnerships for initial revenue. Consumer premium ($49.99/yr) for power features once proven. Don't chase affiliate revenue early — it dilutes focus.

### Naming
- "WhenToBoat" is functional and good for SEO but may alienate non-motorized users (kayakers, kiters)
- Suggestions: "TideWise," "AeroMarine," "Conditions," "BoatScore"
- **My read:** Keep "WhenToBoat" for now — it perfectly describes the value prop, and renaming is easy later once brand identity solidifies

---

## Key Numbers

### Market Size
| Metric | Value | Source |
|--------|-------|--------|
| US recreational boaters | 85 million | NMMA |
| Registered vessels (US) | 11.67 million | USCG 2024 |
| Unregistered paddlecraft | 3.6 million additional | NMMA |
| US recreational marine spend | $55.6 billion/yr | NMMA 2024 |
| US recreational anglers | 57.9 million | Multiple |
| US paddlesports participants | 30 million | Paddling Magazine |
| FBC members | 60,000–90,000+ | Multiple (varying estimates) |
| FBC locations | 400+ globally | Brunswick/FBC |
| FBC annual trips | 640,000+ | FBC |
| California registered boats | 645,951 | USCG |
| Florida registered boats | 1.2 million | USCG |
| Global recreational boating market | $55–93B by mid-2030s | Industry projections |

### TAM/SAM/SOM (Consensus)
| Tier | Size | Definition |
|------|------|------------|
| TAM | ~45M individuals | Global recreational boaters/paddlers/anglers with smartphones |
| SAM | ~10M individuals | Active boaters in English-speaking countries with good data coverage |
| SOM (Year 3) | 250K active users | SF Bay → FL → Chesapeake → PNW expansion |
| Revenue potential | $12.5M ARR at scale | 5M users × 5% conversion × $49.99/yr |

### Safety Data
| Stat | Value |
|------|-------|
| Boating fatalities (2024) | 556 |
| Drowning as cause | 76% of fatalities |
| No PFD worn | 87% of drowning victims |
| No safety education | 69% of fatal vessel operators |
| Paddlecraft fatalities | 26% of all boating deaths |
| Property damage | $88 million |
| Fatality rate trend | Lowest in 50+ years (4.8/100K vessels) |

---

## Critical Insights I Didn't Expect

### 1. The "Where Else?" Feature Is the Retention Key
Multiple sources flagged this independently: if the app only says "bad conditions, stay home," users stop opening it. The product MUST answer **"where else / when else?"** — not just "no." This is the difference between a tool and a habit. Our trajectory comparison and alternative route suggestions already address this, but it should be elevated to a primary feature.

### 2. Wave Period Is More Important Than Wave Height
Forum evidence shows boaters consistently misunderstand wave period. A 3ft wave at 10-second period = comfortable. A 3ft wave at 3-second period = dangerous steep chop. This is the EXACT kind of interpretation that boaters can't do themselves and that WhenToBoat should make obvious.

### 3. Boat Club Reservation Model Creates Acute "When" Pain
Boat club members pay $300–$1,000/month in dues + $5,000–$17,000 initiation. They MUST reserve slots days/weeks ahead. If weather is bad on their reserved day, they've wasted money. A tool that helps them pick the RIGHT slot to reserve is protecting a real financial investment. This makes the "when to go" problem monetizable in a way casual boating doesn't.

### 4. Wind-Against-Current Is the Hidden Killer
Multiple sources highlight that wind opposing tidal current creates steep, hazardous waves invisible to standard wind apps. This is especially lethal at the Golden Gate, inlets, and straits. Our scoring engine MUST eventually factor tide-wind interaction, not just wind alone.

### 5. The Dockmaster Safety Net for Liability
Boat clubs have professional dockmasters who red-flag the fleet in bad conditions. If WhenToBoat's algorithm recommends "Go" but a squall appears, the dockmaster prevents departure. This means WhenToBoat can train its models safely within the boat club context without bearing full liability for decisions. Brilliant natural safety net.

### 6. Public Launch Ramp Information Is Missing Everywhere
Multiple sources and the user noted this: boaters need to know where public launches are, hours, fees, conditions, and whether their boat/trailer fits. This is an underserved piece of the planning puzzle. Should be added to destination data.

---

## What This Means for the Plan

### Additions Needed
1. **Public launch ramp data** — hours, fees, ramp conditions, trailer parking, boat size limits. Add to destination data model.
2. **Boat rental service integration** — link to local kayak/SUP/boat rentals at destinations. "Rent a kayak at Clipper Cove" with partner links.
3. **"Where else?" as primary UX pattern** — when conditions are bad at selected destination, immediately show alternatives: "Central Bay is 3/10 right now, but Richardson Bay is 8/10 — try Sausalito instead"
4. **Wave period education** — make the difference between period and height visually obvious in trajectory analysis
5. **Wind-current interaction** — flag in scoring when wind opposes current (especially near Gate, Raccoon Strait, Carquinez)
6. **Boat club reservation advisor** — "Based on historical patterns, the best 3 slots to reserve next week are: Saturday 8AM, Sunday 8AM, Saturday 2PM (glass-off)"

### Validations of Existing Plan
- Safety-first "Plan here, confirm there" approach: **validated by all sources**
- Progressive disclosure UX: **validated** ("if you try to out-Windy Windy, you lose")
- SF Bay launch: **validated unanimously**
- Activity-specific scoring: **validated as primary differentiator**
- Monte Carlo/probabilistic presentation: **validated** (OpenSnow proves consumers understand it)
- Trajectory system: **validated** (leg-by-leg zone analysis is how professionals plan passages)
- No swimming/surfing: **validated** (liability, existing competitors)

### Things to Reconsider
- **PWA before native app** — multiple sources recommend PWA for shareability. Our Vite+React stack already supports this. Add PWA manifest early.
- **B2B boat club pilot in Phase 1** — don't wait until Phase 10 for FBC. Start conversations NOW and build boat club presets in Phase 4.
- **Speed matters** — SeaLegsAI and Deckee are building in this space. The window is 6–12 months, not 24 months. Ship MVP fast.
- **Off-season engagement** — seasonal churn is real. Need year-round features: historical exploration, trip planning for future months, maintenance reminders.
- **The "where else?" flow must be prominent** — not buried. When conditions are bad, the app should feel helpful, not discouraging.

---

## Bottom Line

The research confirms everything and adds crucial nuance:

**Build for kayakers' pain, sell through boat clubs, launch in SF Bay, ship fast.**

The product that wins is NOT "AI boating planner for everyone." It's:

> "For recreational boaters in tricky local waters: the best outing windows and backup spots for your craft and activity, using authoritative marine data, with links to verify before you go."

The version that fails tries to out-Windy Windy or out-Navionics Navionics.

The real test: **can you deliver a recommendation that a local beginner says is obviously more useful than their current multi-tab ritual?** If yes, this is a product. If not, it's a feature.
