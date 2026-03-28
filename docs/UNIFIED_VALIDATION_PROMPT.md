# WhenToBoat — Unified Scoring Validation Prompt

One prompt. Paste into ChatGPT Deep Research, Gemini Deep Research, or Perplexity Pro.

---

I'm building a recreational boating planning app for San Francisco Bay called WhenToBoat. It scores conditions 1-10 for different activities (kayak, SUP, powerboat, sailboat) at 24 destinations across the Bay, by month and time of day. I need an expert review of my entire scoring system — conditions data, formulas, route feasibility, vessel assumptions, depth data, and safety-critical scenarios. Please answer as an experienced SF Bay mariner.

## Part 1: My Conditions Data

Here is my zone data for 5 key zones. For each, tell me which values are wrong and what they should be.

**Richardson Bay (Sausalito/Tiburon):**
Jan: AM 5kt/0.3ft, PM 8kt/0.5ft | Apr: AM 5kt/0.3ft, PM 12kt/1.0ft | Jul: AM 6kt/0.5ft, PM 14kt/1.2ft | Sep: AM 4kt/0.2ft, PM 6kt/0.4ft | Dec: AM 7kt/0.5ft, PM 10kt/0.8ft

**Central Bay (The Slot):**
Jan: AM 8kt/1.0ft, PM 12kt/1.5ft | Apr: AM 8kt/0.8ft, PM 20kt/3.0ft | Jul: AM 10kt/1.2ft, PM 24kt/4.0ft | Sep: AM 5kt/0.5ft, PM 10kt/1.0ft | Dec: AM 10kt/1.5ft, PM 14kt/2.0ft

**San Pablo Bay:**
Jul: AM 10kt/1.5ft, PM 24kt/4.5ft | Sep: AM 6kt/0.5ft, PM 10kt/1.5ft

**South Bay:**
Jul: AM 8kt/0.8ft, PM 22kt/3.5ft | Sep: AM 5kt/0.3ft, PM 10kt/1.0ft

**Ocean South (Half Moon Bay):**
Jul: AM 6kt/3.0ft, PM 14kt/5.0ft | Sep: AM 4kt/2.0ft, PM 8kt/3.0ft

## Part 2: My Scoring Formula

```
Wind Score: 10 in ideal range, drops 1.5/kt below, drops 1.0/kt above, = 1 over max
Wave Score: linear from 10 at 0ft to 3 at maxWave, then drops 2/ft
Period: kayak + <3s period + >0.5ft = -2 penalty; powerboat + <4s + >1.5ft = -1
Final = (Wind × 0.5) + (Wave × 0.5) + period adjustment
Additional: wind-vs-current up to 3x wave multiplier, cold water penalty, fog penalty, ebb penalty for paddlers
```

Activity thresholds: Kayak ideal 0-8kt max 12kt/1.5ft | SUP ideal 0-5kt max 8kt/0.5ft | Powerboat ideal 0-10kt max 15kt/2.0ft | Casual sail ideal 8-15kt max 20kt/3.0ft

**Are these thresholds right? Is 50/50 wind/wave weighting correct? What's missing?**

## Part 3: Route Feasibility

Score these 6 routes. Tell me if my score is right, what the #1 hazard is, and what time to go:

1. Sausalito → Angel Island, kayak, Sep AM — my score: 9/10
2. Sausalito → Jack London Square, powerboat, Jul AM — my score: 6/10
3. Sausalito → Half Moon Bay, powerboat, Sep AM — my score: 4/10
4. Berkeley → Tiburon, casual sail, Apr PM — my score: 5/10
5. Sausalito → Benicia, powerboat, Sep AM — my score: 7/10
6. Any origin → Stinson Beach, kayak — my score: 1/10

## Part 4: Vessel Assumptions

Validate: Kayak 16ft/4mph/0.5ft draft | SUP 11ft/3mph/0.3ft draft | 21ft CC powerboat 30mph/66gal/9GPH/2ft draft | 25ft sailboat 6mph/30gal/2GPH/4.5ft draft

My wave tolerance scales linearly with length: `1.0 + (LOA - 20) × 0.025`. Is this right or should hull type matter more?

## Part 5: Depth Data

My zone depths (min charted at MLLW): Richardson 6ft | Central Bay 30ft | East Bay 6ft | San Pablo 5ft | South Bay 2ft | Ocean 30ft

**Are these right? Where are the critical shoals I'm missing? Is 1.5ft safety margin above draft adequate?**

## Part 6: Safety-Critical Scenarios

For each, tell me if my scoring is dangerously wrong:

1. Kayak in fog near ferry lanes — I penalize -1.5. Should it be an absolute block?
2. Spring ebb at Golden Gate (6+ kts) + kayak — I penalize -2. Enough?
3. Beginner kayaker in December, Richardson Bay, 52°F water — I score 6/10. Too generous?
4. Potato Patch bar crossing with opposing ebb — I treat as wave hazard only. Is that enough?
5. September "glass-off" pattern — how reliable is it? Can a user trust "winds die by 6 PM"?
6. SUP to Clipper Cove from Sausalito — requires crossing Central Bay. My app should block this but does it?

## What I Need Back

For each part, give me SPECIFIC corrections — not "roughly right" but exact numbers where I'm wrong. Format as:

**Zone corrections:** "Richardson Bay Jul PM wind should be X not Y because Z"
**Formula changes:** "Kayak max wind should be X not Y because Z"
**Route flags:** "Route X is scored too generous/conservative because Z"
**Safety fixes:** "Scenario X needs to be changed from Y to Z because lives depend on it"
**Depth corrections:** "Zone X has shoals at Y location that you're missing"

Cite real NOAA data, nautical chart references, or documented incidents where possible.
