# WhenToBoat — Safety-Critical Data Validation Prompt

Paste this into ChatGPT Deep Research, Gemini Deep Research, or Perplexity Pro. This is a SAFETY validation — the goal is to identify scenarios where the app could contribute to someone dying.

---

I'm building WhenToBoat, a recreational boating planning app for San Francisco Bay. The app scores conditions 1-10 for kayaking, SUP, powerboating, and sailing at 24 destinations. It uses NOAA data, Open-Meteo forecasts, and expert-validated zone averages. The app explicitly positions itself as a planning tool ("plan here, confirm there") with disclaimers and links to NOAA — but I know users will anchor on whatever score they see.

I need a comprehensive safety review covering: (1) whether my data sources are reliable enough for each scoring factor, (2) where my scoring could show "safe" when conditions are lethal, (3) what UX patterns prevent or enable dangerous decisions, and (4) what liability exposure exists.

## My Current Data Architecture

### What drives the scores:

| Factor | Historical Source | Live Forecast Source | Confidence |
|--------|------------------|---------------------|------------|
| Wind speed/direction | Hand-entered zone averages (monthly AM/PM), expert-corrected | Open-Meteo Weather API (hourly, 7-day) | Historical: MEDIUM (not validated against raw NDBC). Live: HIGH |
| Wave height/period | Hand-entered zone averages | Open-Meteo Marine API (hourly) | Historical: MEDIUM. Live: HIGH for open water, LOW for within-bay |
| Tidal current speed | Estimated from CO-OPS tide height rate-of-change | Estimated (not real current prediction) | LOW — this is a simplified model, not actual current data |
| Tide height | None (historical) | NOAA CO-OPS station 9414290 predictions (hourly) | Tide predictions: VERY HIGH |
| Water temperature | Seasonal monthly averages from NOAA CO-OPS | Monthly average (not live) | MEDIUM — varies 5-10°F by location within the Bay |
| Visibility/fog | Seasonal fog probability from SFO ASOS | Open-Meteo visibility (hourly) | Historical: LOW. Live: MEDIUM |
| Depth/bathymetry | Zone-level minimums from NOAA Chart 18649 | Static (not tide-adjusted in real time) | MEDIUM — zone averages miss critical shoals |
| Current direction | Estimated from tide phase (flood=60°, ebb=240°) | Estimated | LOW — oversimplified, doesn't account for local current patterns |

### Safety blocks currently implemented:
- Kayak/SUP in <1 mile visibility → ABSOLUTE BLOCK (score 1)
- Kayak/SUP in >4kt current → ABSOLUTE BLOCK (score 1)
- Strong ebb >2kt + kayak/SUP → -3 penalty
- Water temp <60°F + kayak/SUP → -2 penalty; <55°F → -3; <50°F → -4
- Fog 1-3 miles + kayak/SUP → -3 penalty

### What I want to implement but am NOT confident about:
1. Tidal current as a 20-30% weighted scoring factor for paddlecraft
2. Dedicated Potato Patch bar-crossing module (block when swell >8ft + ebb >3kt)
3. Raccoon Strait current timing for Angel Island routes
4. SUP route blocking for all Central Bay crossings
5. Wind direction relative to route heading

## Questions for Validation

### Part 1: Data Source Reliability

1. **Is Open-Meteo Marine API accurate enough for SF Bay wave predictions?** The API uses global wave models (ERA5/WAM). These models have ~5nm grid resolution. SF Bay is ~6nm wide at the Golden Gate. Can a 5nm grid model accurately distinguish between Richardson Bay (sheltered) and Central Bay (exposed) conditions? Cite any published accuracy assessments of Open-Meteo or ERA5 for coastal/bay environments.

2. **Is estimating current from tide height rate-of-change scientifically valid?** I compute current speed as `abs(tideHeightChange) * 3` — so a 0.5ft/hour rise = 1.5kt flood. The actual NOAA CO-OPS current prediction stations (SFB1201 at Golden Gate, PCT0261 at Fort Point) give direct current velocity predictions. How far off could my estimate be from reality? Should I abandon the estimate and use only the CO-OPS API?

3. **Is Open-Meteo's visibility forecast reliable enough to trigger a safety block?** A false "clear" when conditions are actually foggy could lead a kayaker into a ferry lane. How accurate is Open-Meteo's visibility prediction for SF Bay fog, which is driven by marine layer dynamics that global models handle poorly?

4. **Can I use NOAA tide predictions as a proxy for current?** Tide height predictions are very accurate (within ~0.3ft). But the relationship between tide height change and current speed varies dramatically by location — Golden Gate currents reach 6.5kt while Richardson Bay currents are 0.5kt from the same tide. Is there a scientifically valid conversion, or must I use location-specific current data?

5. **How reliable is the "fog probability by month" seasonal data?** I use percentages from SFO ASOS historical records (e.g., July AM fog probability: 50%). But SFO is inland from the coast — fog at the Golden Gate is much more frequent than at SFO. How should I adjust these numbers for marine locations?

### Part 2: Fatal Scenario Analysis

For each scenario, tell me: (a) could my app currently show a misleading score, (b) has someone actually died or been seriously injured in a similar scenario on SF Bay, and (c) what should the app do differently.

1. **Kayaker crosses Raccoon Strait at wrong tide.** My app shows Richardson Bay as 9/10 in September but doesn't score the Raccoon Strait crossing separately. The strait has 2.7kt currents that create standing waves and whirlpools. Could a user see "9/10" and launch without checking current timing?

2. **Powerboat crosses the SF Bar (Potato Patch) during ebb with swell.** My app shows the ocean zone score based on wind and wave height but doesn't model the specific bar-crossing hazard where ebb current + swell = breaking waves up to 20ft. A score of "4/10" might seem manageable to an aggressive skipper.

3. **SUP user paddles from Aquatic Park toward Alcatraz.** My app shows Aquatic Park as a high-scoring SUP destination. The user sees the calm cove and decides to paddle toward Alcatraz. They're now in Central Bay with ferry traffic, 20kt wind, and 3kt current. Does my app warn them? Does the SUP activity profile block this?

4. **Family powerboat outing in South Bay hits mudflats at low tide.** My depth data shows South Bay at "2ft minimum." A family in a 2ft-draft powerboat sees a "good" score and launches at Coyote Point during a spring low tide. The actual water depth on the flats is 0ft. They're grounded 2 miles from shore.

5. **Beginner kayaker launches from Stinson Beach into ocean.** Stinson Beach is listed as a destination. A beginner sees "kayak" as an activity type and thinks this means they can kayak there. My app scores it 1/10 but doesn't physically prevent them from viewing the route.

6. **Sailor relies on September "glass-off" prediction, gets caught in Diablo wind event.** My app shows September evenings as 9/10. A sailor plans a sunset cruise. An unseasonable Diablo (offshore) wind event produces 40kt gusts through Carquinez Strait. My historical data can't predict this.

7. **Cold water capsize in March.** Water temp is 53°F. My app now penalizes this (-3 for kayak) but still shows some routes at 4-5/10. A user without a wetsuit capsizes. At 53°F, they have 10 minutes of useful movement before swim failure.

### Part 3: UX Safety Patterns

1. **Does "1/10" sufficiently communicate danger?** The Comfort Score legend says "1-4: Poor — not recommended." But "not recommended" is very different from "you could die." Should the app use different language for life-threatening vs merely uncomfortable scores?

2. **Should the app physically prevent viewing dangerous routes, or just warn?** Currently a kayaker CAN view a route to Stinson Beach (score 1/10). Should the app hide these routes entirely, show them with an un-dismissable warning, or keep the current approach?

3. **Is the "Before You Go" checklist adequate as a safety intervention?** The checklist says "Check marine forecast" with a link to NOAA. But a user who sees "8/10" might skip the checklist entirely. Is a checklist the right pattern, or should verification be mandatory?

4. **Does the "Typical for March" vs "This Week's Forecast" toggle create false confidence?** The historical mode shows what conditions are USUALLY like. But a user might interpret "8/10 typical" as "it's probably 8/10 right now." Should historical mode have a more prominent disclaimer?

5. **Is the color-coding (green/yellow/red) calibrated to actual risk?** Green (8-10) means "excellent — go for it." But conditions that are 8/10 for a powerboat are 2/10 for a SUP. Should the color scale be tighter for more vulnerable activities?

6. **Should the app require the user to confirm their experience level?** A beginner kayaker and an experienced sea kayaker have very different safety margins. My app treats them the same. Should there be a "beginner/intermediate/expert" toggle that adjusts scoring?

7. **What happens when the live forecast API fails?** Currently it falls back to historical averages with a small warning. But if a storm is approaching and the forecast API is down, the app shows calm historical patterns. Should the app refuse to show scores when live data is unavailable during certain conditions?

### Part 4: Liability and Legal

1. **What is the legal standard of care for a recreational boating planning app?** Has any marine weather/planning app developer been successfully sued when a user was injured or killed? What legal precedent exists?

2. **Are my disclaimers adequate?** My Terms of Service say "You do so solely at your own risk" (modeled on PredictWind). The click-through disclaimer says "Always verify conditions before departure." Is this sufficient legal protection, or do specific scenarios (like the safety blocks) create a higher duty of care?

3. **Does implementing safety blocks (score = 1, "Do NOT launch") create greater liability than not having them?** If the app blocks a route due to fog, and the fog lifts 30 minutes later, the user might argue the app was wrong. Conversely, if the app doesn't block and someone dies, they might argue the app should have blocked. Which position has better legal defensibility?

4. **Should the app carry product liability insurance?** Given the safety-adjacent nature of the recommendations, what type and amount of insurance is appropriate? What do comparable apps (Windy, PredictWind, Surfline) carry?

5. **What regulatory bodies should I engage with?** Should I seek endorsement or review from USCG Auxiliary, US Sailing, American Canoe Association, or NASBLA before public launch? Would their endorsement provide liability protection?

### Part 5: Recommended Architecture for Safety-Critical Features

Given the data reliability assessment above, recommend the safest architecture for each of these features:

1. **Should I implement dynamic current-based scoring, or just static warnings?** The current data I have is estimated, not measured. Is it better to show an estimated current score (which could be wrong) or a static warning ("Check NOAA currents before crossing Raccoon Strait")?

2. **For the Potato Patch bar crossing, should I build an algorithmic model or just block + link to NOAA?** Building a model requires combining swell data (buoy 46026) with ebb timing (CO-OPS) — both reliable sources. But the model could have bugs. Is "block during ebb + swell and link to NOAA bar forecast" safer than trying to compute a score?

3. **Should the app ever show a score above 5 for any ocean route?** Given that ocean swell is persistent (never below 4ft) and bar crossings are dangerous, should ocean routes be permanently capped at 5/10 for all vessel types?

4. **What is the minimum data quality threshold for publishing a score?** If I don't have reliable current data for a route, should the app (a) show a score with a warning that current data is missing, (b) refuse to show a score and say "insufficient data — check NOAA," or (c) show a score based on available data and note what's missing?

## What I Need Back

A structured report with:

1. **Data reliability verdict for each factor** — is it safe to use for scoring? Yes/no/conditional.
2. **Fatal scenario verdicts** — for each of the 7 scenarios, would my app currently contribute to the death? What specific change prevents it?
3. **UX pattern recommendations** — specific changes to how scores, warnings, and blocks are presented to prevent dangerous decisions.
4. **Liability recommendations** — what legal protections are needed before public launch.
5. **Architecture recommendations** — for each proposed feature, should I build it algorithmically, use static warnings, or not implement it at all?

Cite maritime safety research, USCG statistics, documented SF Bay incidents, and legal precedent where available. This is a safety review — err on the side of caution. If in doubt, recommend the more conservative approach.
