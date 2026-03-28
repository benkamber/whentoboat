# WhenToBoat — Scoring Validation Prompts

Use these prompts with ChatGPT, Gemini, Claude, or Perplexity to validate the scoring engine against expert marine knowledge. Each prompt targets a specific aspect of the scoring system.

---

## Prompt 1: SF Bay Conditions Expert Validation

I'm building a recreational boating planning app for San Francisco Bay. I need an expert with deep local knowledge of SF Bay marine conditions to validate my scoring data. Please answer as if you are an experienced SF Bay mariner who has sailed, motored, and paddled the Bay for 20+ years.

### My app scores conditions 1-10 for each zone/month/time-of-day. Here is the data I use for three key zones:

**Richardson Bay (Sausalito/Tiburon/Angel Island area):**
```
Month | AM wind (kts) | AM wave (ft) | AM comfort | PM wind | PM wave | PM comfort
Jan   |  5            | 0.3          | 7          |  8      | 0.5     | 5
Apr   |  5            | 0.3          | 8          | 12      | 1.0     | 6
Jul   |  6            | 0.5          | 7          | 14      | 1.2     | 5
Sep   |  4            | 0.2          | 10         |  6      | 0.4     | 9
Dec   |  7            | 0.5          | 6          | 10      | 0.8     | 4
```

**Central Bay (The Slot — Alcatraz to Bay Bridge):**
```
Month | AM wind (kts) | AM wave (ft) | AM comfort | PM wind | PM wave | PM comfort
Jan   |  8            | 1.0          | 5          | 12      | 1.5     | 3
Apr   |  8            | 0.8          | 7          | 20      | 3.0     | 3
Jul   | 10            | 1.2          | 6          | 24      | 4.0     | 2
Sep   |  5            | 0.5          | 9          | 10      | 1.0     | 7
Dec   | 10            | 1.5          | 4          | 14      | 2.0     | 2
```

**Ocean South (Half Moon Bay — outside the Gate):**
```
Month | AM wind (kts) | AM wave (ft) | AM comfort | PM wind | PM wave | PM comfort
Jan   | 12            | 6.0          | 1          | 18      | 8.0     | 1
Jul   |  6            | 3.0          | 4          | 14      | 5.0     | 1
Sep   |  4            | 2.0          | 7          |  8      | 3.0     | 3
```

### Questions:

1. **Are these wind and wave values accurate for typical conditions?** For each zone/month where you think the data is wrong, tell me what you'd estimate instead and why.

2. **Are the comfort scores calibrated correctly?** A "10" means perfect conditions, "1" means dangerous. Do the scores match what you'd expect from these wind/wave values?

3. **What am I missing?** Are there important condition factors for SF Bay that these numbers don't capture? (e.g., fog timing, current interactions, specific microclimate effects)

4. **Are there months or conditions where my data would be dangerously misleading?** Specifically: would my data ever show "safe" when real conditions are dangerous?

5. **How accurate is this characterization: "September and October are the best months on the Bay, and July PM in the central Bay is the worst for powerboats"?**

6. **For a kayaker, is Richardson Bay in September mornings really a 10/10?** Or are there risks I'm not accounting for?

7. **For a 21ft center console powerboat at 30mph, is Central Bay in July PM really a 2/10?** Or am I being too conservative/generous?

Please be specific about where my data is wrong and what the correct values should be. I'd rather hear "your July PM central bay wind should be 28, not 24" than "it's roughly right."

---

## Prompt 2: Activity Scoring Formula Validation

I'm building a boating conditions scoring engine. I need a marine weather expert to validate my scoring formulas. Here is how I score conditions for different activities:

### Activity Profiles:
```
Activity          | Ideal Wind (kts) | Max Wind | Max Wave (ft) | Scoring Weight
Kayak             | 0–8              | 12       | 1.5           | Wind 50%, Wave 50%
SUP               | 0–5              | 8        | 0.5           | Wind 50%, Wave 50%
Powerboat Cruise  | 0–10             | 15       | 2.0           | Wind 50%, Wave 50%
Casual Daysail    | 8–15             | 20       | 3.0           | Wind 50%, Wave 50%
```

### Scoring Formula:
```
Wind Score (1-10):
- In ideal range: 10
- Below ideal: 10 - (idealLow - actual) × 1.5
- Above ideal but below max: 10 - (actual - idealHigh) × 1.0
- Above max: 1

Wave Score (1-10):
- Linear: 10 - (waveHeight / maxWave) × 7
- Above max: max(1, 3 - (height - max) × 2)

Period Adjustment:
- Powerboat + period < 4s + waves > 1.5ft: -1
- Sailboat + period > 6s: +1
- Kayak + period < 3s + waves > 0.5ft: -2

Final = (Wind × 0.5) + (Wave × 0.5) + Period Adjustment
```

### Additional Factors (applied on top):
- Wind opposing current > 120°, current > 1.5kt, wind > 10kt: wave height multiplied up to 3x
- Water temp < 55°F for paddlers: -1 penalty
- Water temp < 50°F: -2 penalty
- Visibility < 1 mile (fog): -3 penalty
- Visibility < 3 miles: -1.5 penalty
- Strong ebb current + kayak/SUP: -2 penalty
- Vessel LOA scales wave tolerance: bigger boat = more tolerance

### Questions:

1. **Are the ideal wind ranges correct for each activity?** Would an experienced kayaker agree that 0-8 kts is ideal? Would a casual sailor agree that 8-15 kts is the sweet spot?

2. **Is the 50/50 wind/wave weighting correct?** For kayakers, is wind more important than waves? For powerboaters, is chop (short-period waves) more important than swell?

3. **Are the max thresholds right?** Is 12 kts really the absolute max for recreational kayaking? Is 20 kts really the max for casual sailing? Are these conservative enough for safety?

4. **Is the period adjustment adequate?** A 3-foot wave at 4-second period is MUCH worse than a 3-foot wave at 10-second period. Does my -1/-2 adjustment capture this difference, or should it be stronger?

5. **What about wave direction relative to vessel heading?** A beam sea is much worse than following seas for powerboats. My formula ignores this. How much does this matter?

6. **Is the wind-against-current multiplier (up to 3x wave height) accurate?** At the Golden Gate with 4+ knot ebb against 15kt wind, is 3x a reasonable worst-case?

7. **What scoring factors am I missing entirely?** Are there conditions that an experienced mariner checks that I don't factor in at all?

8. **If you were scoring these conditions for a SAFETY app, what would you change?** Where am I being dangerously generous?

---

## Prompt 3: Route Feasibility Expert Review

I'm building a boating planning app for SF Bay. I need an expert to validate whether specific routes are feasible for specific vessel types. For each route below, tell me if it's realistic, what conditions it requires, and what the key hazards are.

### Routes to Validate:

1. **Sausalito → Angel Island (Ayala Cove), Kayak, September AM**
   - Distance: 1.8 mi
   - Zones crossed: Richardson Bay
   - My score: 9/10
   - Is this realistic? What hazards exist?

2. **Sausalito → Jack London Square, Powerboat, July AM**
   - Distance: 7.5 mi
   - Zones crossed: Richardson Bay, Central Bay, East Bay
   - My score: 6/10
   - Central Bay is the bottleneck. Is this too generous or too conservative?

3. **Sausalito → Half Moon Bay, Powerboat, September AM**
   - Distance: 25 mi
   - Zones crossed: Richardson Bay, Central Bay, Ocean South
   - My score: 4/10 (ocean zone is the bottleneck)
   - What conditions does this trip ACTUALLY require? Bar crossing conditions? Swell requirements?

4. **Berkeley Marina → Tiburon, Casual Sail, April PM**
   - Distance: 7.5 mi
   - Zones crossed: East Bay, Central Bay, Richardson Bay
   - My score: 5/10
   - Is April PM really that bad for casual sailing? Or is the 20kt+ Central Bay wind exactly what a sailor wants?

5. **Stinson Beach → Any Bay destination, Kayak, Any time**
   - My score: 1/10 (ocean passage required)
   - Is there ANY scenario where a kayaker should attempt this?

6. **Sausalito → Benicia, Powerboat, September**
   - Distance: 23 mi
   - Zones crossed: Richardson Bay, Central Bay, North Bay, San Pablo Bay
   - My score: ~7/10 in AM
   - Is this a realistic day trip? What time should they leave? What are the fuel/range implications for a 21ft center console (66 gal tank, 9 GPH)?

### For each route, please tell me:
- Is the distance approximately correct?
- What zones/conditions would you actually encounter?
- Is my comfort score reasonable?
- What's the #1 hazard I should warn users about?
- What time of day should this trip be done (if at all)?

---

## Prompt 4: Vessel Profile Validation

I'm building a boating app that adjusts recommendations based on vessel type and specs. I need a marine expert to validate my vessel assumptions.

### My Vessel Profiles:

```
Vessel              | LOA  | Speed | Draft | Fuel Cap | GPH  | Wave Tolerance
Sea Kayak           | 16ft | 4mph  | 0.5ft | N/A      | N/A  | 0.85x baseline
SUP                 | 11ft | 3mph  | 0.3ft | N/A      | N/A  | 0.78x baseline
21ft Center Console | 21ft | 30mph | 2ft   | 66 gal   | 9    | 1.03x baseline
25ft Daysailer      | 25ft | 6mph  | 4.5ft | 30 gal   | 2    | 1.13x baseline
```

### Wave Tolerance Formula:
`tolerance = 1.0 + (LOA - 20) × 0.025`
A 40ft boat handles 1.5x the waves of a 20ft boat.

### Questions:

1. **Are the cruise speeds realistic?** Is 4mph a fair average for a recreational kayaker? Is 30mph at cruise fair for a 21ft CC with a 200hp outboard? Is 6mph fair for a 25ft sailboat under auxiliary power?

2. **Is the wave tolerance scaling correct?** Does LOA really scale wave handling linearly? A 40ft displacement hull handles waves very differently than a 40ft planing hull. Should hull type matter more than length?

3. **Is the draft data correct?** Is 4.5ft typical for a 25ft daysailer? Would a J/24 be different from a Catalina 25?

4. **Is 9 GPH at cruise realistic for a 21ft CC with a 200hp outboard?** What about at trolling speed? What about fuel reserve rules (1/3 rule)?

5. **For a kayaker, is 2.5 hours max endurance a fair default?** What about a fit, experienced paddler vs a casual weekend paddler?

6. **What vessel-specific factors am I missing?** Freeboard? Windage? Stability? Self-righting capability? These all affect safety thresholds.

7. **For a 25ft sailboat, should wind scoring work differently under sail vs under power?** My app currently uses "casual sail" activity profile which expects 8-15 kts. But the same boat under auxiliary power in 5 kts is a completely different experience.

---

## Prompt 5: Safety-Critical Scenarios

I'm building a safety-adjacent boating planning app. I need to identify scenarios where my scoring engine could be DANGEROUSLY WRONG — where the app shows "go" but conditions are actually lethal.

### My Safety Assumptions:
- "Plan here, confirm there" — app is planning tool, not real-time authority
- Every score links to NOAA buoy data for verification
- Variability range (P10/P90) shown alongside median score
- "Before You Go" safety checklist per activity
- Wind-against-current interaction modeled at Golden Gate
- Fog penalty when visibility < 3 miles
- Cold water warning when temp < 55°F

### Scenarios to Stress-Test:

1. **March afternoon on Central Bay**: My data shows ~16kt wind, 2.5ft waves. Score for kayak: ~3/10 (bad). But what if an unusual heat event pushes it to 5kt and calm? My historical data would show "bad" when real conditions are fine. **Is this a problem or a feature?** (Conservative = safer)

2. **September evening "glass-off"**: My data shows evening winds dying to 6kt in Richardson Bay. Score: 9/10. But what if a user goes out at 5 PM and the wind DOESN'T die? **How reliable is the glass-off pattern?**

3. **Fog at the Golden Gate**: My app penalizes visibility < 3 miles with -1.5 score. But a kayaker in fog near shipping lanes faces **collision risk with ferries and container ships**, not just reduced visibility. **Is -1.5 enough for a kayak in fog, or should it be an absolute "do not go"?**

4. **Spring ebb at the Gate**: My app has a -2 penalty for strong ebb + kayak/SUP. But a 4.5-knot ebb at the Golden Gate can reach 6+ knots during spring tides. **Is -2 enough? Should the app block kayak routes that transit the Gate during max ebb?**

5. **A beginner in a new kayak in December**: Water temp 52°F, air temp 45°F. My app scores Richardson Bay AM at 6/10 for kayak. **Should a beginner kayaker go out in 52°F water without a drysuit?** Is my scoring dangerously generous here?

6. **Half Moon Bay bar crossing**: My app shows ocean routes with scores. But the Potato Patch (bar at the Gate exit) can have 8-12ft breaking waves when swell opposes ebb. **Is my ocean zone data sufficient to warn about bar conditions, or is this a separate hazard that needs special treatment?**

7. **A SUP user at Clipper Cove**: My app scores this as sheltered. But Clipper Cove is on Treasure Island, which means crossing open water to get there from most origins. **Does my near-shore distance constraint (500m) actually prevent a SUP from being recommended routes that require open crossings?**

For each scenario, tell me:
- Is my scoring approximately right?
- Where is it dangerously wrong?
- What should I change?
- What disclaimer or warning is needed?

---

## Prompt 6: Depth and Draft Validation

I'm using zone-level depth data for SF Bay. I need a nautical chart expert to validate my depth assumptions and identify where they're dangerously wrong.

### My Depth Data (minimum charted depth at MLLW by zone):

```
Zone          | Min Depth | Typical Depth | Shallow Areas
Richardson    | 6 ft      | 12 ft         | Richardson Bay shoals (2-4ft near shore)
Central Bay   | 30 ft     | 60 ft         | None — deep throughout
SF Shore      | 10 ft     | 25 ft         | Near piers, some shoaling
East Bay      | 6 ft      | 18 ft         | Oakland Estuary edges (6ft)
North Bay     | 10 ft     | 22 ft         | Transition shallows near Richmond
San Pablo     | 5 ft      | 12 ft         | Extensive shallows, stay in channels
South Bay     | 2 ft      | 6 ft          | Very shallow, tidal flats everywhere
Ocean South   | 30 ft     | 120 ft        | Deep except near shore/bars
```

### My Draft Safety Rule:
`safe = (chartedDepth + currentTide) >= (vesselDraft + 1.5ft margin)`

### Questions:

1. **Are these minimum depths approximately correct?** Specifically, is 2ft MLLW for South Bay right? Is 6ft for Richardson Bay right?

2. **Where do my zone-level averages miss critical shoals?** For example, are there 3-foot shoals in the middle of Richardson Bay that I'm not accounting for?

3. **Is 1.5ft safety margin adequate?** Some mariners use 3ft. What's standard for recreational boaters?

4. **For a sailboat with 4.5ft draft, which specific areas should be marked as restricted?** Not just "South Bay" but specific spots.

5. **How much does tide level change the navigability picture?** At a -0.5ft MLLW tide (below mean lower low), which zones become impassable for a 2ft draft powerboat?

6. **Is the Potato Patch (bar at the Golden Gate) a depth hazard, a wave hazard, or both?** My app treats it as a wave hazard only.

7. **Are there charted obstructions (rocks, wrecks, submerged piles) in any of my route corridors that I should warn about?**

---

## How to Use These Results

After running each prompt, compile the findings into a calibration report:

1. **Zone data corrections**: specific wind/wave values that need changing
2. **Scoring formula adjustments**: weight changes, threshold changes, missing factors
3. **Route feasibility flags**: routes that should be blocked or warned about
4. **Safety-critical fixes**: scenarios where the app could endanger someone
5. **Depth/draft corrections**: zones where my depth data is wrong

Apply corrections to:
- `data/cities/sf-bay/zones.ts` (condition data)
- `engine/scoring.ts` (formula weights and adjustments)
- `data/geo/sf-bay-depths.ts` (depth data)
- `data/activities.ts` (activity thresholds)

Then re-run the validation prompts to verify the corrections improved accuracy.
