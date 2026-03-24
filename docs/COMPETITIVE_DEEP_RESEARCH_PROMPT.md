# WhenToBoat — Competitive Intelligence Deep Research Prompt

Use this prompt with ChatGPT Deep Research, Gemini Deep Research, Perplexity, or Claude with web search.

---

## Research Request

I'm building **WhenToBoat**, a web application that answers "When should I go boating, and where?" for recreational boaters. I need an exhaustive competitive analysis that goes far beyond surface-level feature comparison. I need to understand exactly what I'm up against, where the real threats are, and how to build a defensible position.

**My app in one sentence:** WhenToBoat synthesizes wind, waves, tides, currents, and 44 years of historical NOAA data into activity-specific comfort scores (1–10) with variability ranges (P10/P50/P90), showing recreational boaters the best outing windows and alternative destinations for their specific vessel type — starting with SF Bay, expanding globally.

**My key differentiators (as I understand them today):**
1. Activity-specific scoring — same bay on same day scores 2/10 for kayak, 9/10 for racing sail
2. Historical variability — P10/P50/P90 ranges, not just point forecasts. "7/10 but historically ranges 3–9"
3. "Where else?" — proactive alternative destination suggestions when conditions are bad
4. Vessel-specific adjustments — wave tolerance scales with boat size, draft restricts destinations, fuel limits range
5. "Plan here, confirm there" — links to authoritative NOAA/NWS sources, never positions as real-time authority
6. Visual time-of-day slider showing conditions change across a day
7. Zero UGC — all data from vetted government sources

**My target segments:**
- Primary: kayakers/SUP paddlers (highest pain, most vulnerable)
- Revenue: boat club members (FBC: 60K+ members, reservation-based, high WTP)
- Secondary: casual powerboaters, casual sailors
- B2B: boat rental operators, yacht clubs, marinas

---

## Part 1: Deep Dive on SeaLegsAI (Primary Threat)

SeaLegsAI appears to be my closest direct competitor. I need to understand them thoroughly.

### Product Analysis
- **Download and test the SeaLegsAI app.** What does the actual user experience look like? Walk through a complete trip planning flow. Screenshots or detailed descriptions of every screen.
- **What inputs does it require?** Does the user specify vessel type, LOA, activity, departure time, route? How granular is it?
- **What does the output look like?** Is it a simple Go/Caution/Avoid? Or does it provide scores, confidence ranges, alternative timing, alternative routes?
- **Does it do activity-specific scoring?** Does it differentiate between a kayaker and a sailor and a powerboater? Or is it vessel-size-only?
- **Does it show historical data or patterns?** Can a user ask "what are typical July conditions?" or is it forecast-only?
- **Does it suggest alternative destinations?** If the user's chosen route is bad, does it proactively offer a better option?
- **Does it show variability/uncertainty?** Confidence intervals? Multiple model comparison?
- **What weather models does it use?** How many? Which ones? Does it explain disagreements between models?
- **What geographic coverage does it have?** US only? Global? Which specific bodies of water?
- **Does it have a map view?** What does it look like?
- **Does it work offline?**
- **What does the free tier include vs paid?** What are the exact pricing tiers?

### Business Analysis
- **Who founded SeaLegsAI?** Background, maritime expertise, technical team?
- **When did it launch?** App Store / Google Play first available date?
- **Download count and ratings** on both app stores. Trend over time if visible.
- **User reviews** — read the actual reviews. What do users love? What do they complain about? Are there patterns?
- **Funding history** — any VC funding? Angels? Bootstrapped? Check Crunchbase, PitchBook, LinkedIn.
- **Revenue model** — how do they make money? Is the free tier sustainable?
- **Recent product updates** — what have they shipped in the last 6 months? What direction are they heading?
- **Marketing and positioning** — how do they describe themselves? What keywords do they target? What's their SEO strategy?
- **Blog posts and announcements** — read their blog. What are they building next? Any hints at roadmap?
- **Social media presence** — Twitter/X, Instagram, Facebook, YouTube. How large? How active?
- **Partnerships** — any B2B deals, marina partnerships, boat club integrations?

### Threat Assessment
- **How quickly could SeaLegsAI add activity-specific scoring?** Is their architecture model-based (easy to add) or hardcoded (harder)?
- **How quickly could they add historical patterns?** Do they appear to have historical data infrastructure?
- **How quickly could they add "where else?" alternative suggestions?**
- **What would it take for SeaLegsAI to make WhenToBoat irrelevant?**
- **What can WhenToBoat do that SeaLegsAI structurally cannot?** (Architecture limitations, business model constraints, etc.)

---

## Part 2: Deep Dive on Deckee (Secondary Threat)

### Product Analysis
- **Download and test the Deckee app.** Same level of detail as SeaLegsAI above.
- **What is the "Open Water Risk Forecast" feature?** How does it work? What inputs? What outputs?
- **Does it personalize by vessel type?** How granular?
- **What is the government partnership model?** Which agencies? What data do they provide?
- **Geographic coverage?** Australia-first — how strong is their US presence?
- **What does their "best time to go" feature actually show?**
- **How is Deckee monetizing?** They claim to be free — is it ad-supported? Government-funded? What's the business model?

### Business Analysis
- **Funding:** $700K reported. From whom? When?
- **Team:** Who are the founders? Maritime background?
- **User base:** 1M+ downloads claimed. Verify. What's the active user count estimate?
- **Expansion plans:** Are they actively expanding in the US? Any recent US-focused hires or announcements?
- **Partnerships:** Florida FWC confirmed. Any other state agencies? Any boat club deals?

### Threat Assessment
- **Could Deckee pivot from safety/compliance to trip planning?** How hard would that be?
- **Does their government partnership model create a distribution moat that WhenToBoat can't match?**
- **What happens if Deckee partners with FBC before WhenToBoat does?**

---

## Part 3: Full Competitor Inventory

### Direct Competitors (trip planning / condition recommendations)
For each, provide: what it does, pricing, user count, funding, strengths, weaknesses, recent moves, threat level to WhenToBoat.

- SeaLegsAI (covered above)
- Deckee (covered above)
- Savvy Navvy (smart routing with weather/tide awareness)
- Any other apps that provide go/no-go or condition-based planning recommendations

### Indirect Competitors (raw data tools that could add planning features)
- **Windy** — 60M users. Could they add a "Boating Mode" with activity scoring? How hard? Any signals they're moving that direction?
- **PredictWind** — has departure planning. Could they simplify for casual boaters? Any signs of downmarket move?
- **SailFlow** — has wind alerts. Could they add comfort scoring?
- **Windfinder** — similar to SailFlow. Threat level?
- **Buoyweather** — offshore fishing focused. Could they broaden?

### Navigation Apps That Could Expand Into Planning
- **Navionics (Garmin)** — $50/yr, millions of users. Could Garmin add weather-based trip recommendations? Any evidence they're considering this? What has Garmin's marine software strategy looked like over the past 2 years?
- **Wavve Boating** — already has vessel-specific safety alerts. How close are they to trip planning?
- **Argo** — free navigation with social. Any planning features?
- **Aqua Map** — any planning features?

### Activity-Specific Apps That Could Expand
- **Fishbrain** — 12M+ users in fishing. Could they add general boating planning? Any signs?
- **iKitesurf / WindAlert** — wind sport focused. Could they add multi-activity?
- **Surfline** — the model to emulate. Any chance they expand beyond surf into general marine recreation?

### Emerging / Stealth Competitors
- Search Product Hunt, App Store "new releases," Google Play for any marine trip planning apps launched in the past 12 months
- Search Y Combinator, Techstars, and other accelerator portfolios for marine/boating startups
- Search LinkedIn for startups with "marine" + "planning" or "boating" + "AI" or "marine" + "conditions" in their descriptions
- Search patent filings (Google Patents) for "marine activity recommendation" or "boating condition scoring" or "recreational marine planning"
- Any relevant academic research papers on marine recreation planning algorithms?

---

## Part 4: Competitive Moat Analysis

### For WhenToBoat specifically, assess the defensibility of each claimed differentiator:

**1. Activity-specific scoring**
- How hard is this for competitors to replicate? It's just different wind/wave thresholds per activity — is this really a moat or a feature that takes 2 weeks to copy?
- What would make it truly defensible? (e.g., ML-trained on actual user outcomes, local expert calibration, community validation)

**2. Historical variability (P10/P50/P90)**
- Does any competitor show historical variance? If not, why not? Is it technically hard or just not prioritized?
- How long would it take a competitor with NDBC access to add this?

**3. "Where else?" alternative suggestions**
- Does any competitor do this? Surfline has "nearby spots" — how does it work?
- Is this defensible or trivially copyable?

**4. Vessel-specific adjustments**
- SeaLegsAI already does vessel-based analysis. How does theirs work? How does WhenToBoat's approach differ?
- Deckee personalizes by vessel. How granular?

**5. Local zone tuning (the claimed "real moat")**
- WhenToBoat's plan includes 11 hand-tuned exposure zones for SF Bay with empirical correction factors. Is this really hard to replicate, or could a competitor with weather model data automate zone creation?
- How does Surfline's spot-specific tuning work? Is there a lesson here?

**6. B2B integration (boat clubs, rental operators)**
- Has any competitor pursued B2B marine partnerships? Who?
- Is there a first-mover advantage in boat club partnerships, or will FBC just pick the best product regardless of timing?

### What moats do competitors have that WhenToBoat lacks?
- Windy: 60M users, massive brand recognition, global data infrastructure
- Navionics/Garmin: hardware ecosystem lock-in, chart data IP, massive installed base
- PredictWind: proprietary weather models (not just NOAA/GFS/ECMWF), 15+ years of tuning
- Surfline: 35 years of historical surf data, ML models, 700+ live cameras, $200M+ valuation
- Fishbrain: 12M users, social network effects, catch data moat
- Deckee: government partnerships, regulatory data access
- SeaLegsAI: first-mover in AI go/no-go recommendations

---

## Part 5: Mitigation Strategies

Based on your findings, recommend specific strategies for WhenToBoat to:

### 5.1 Defend Against SeaLegsAI
- What features should WhenToBoat prioritize that SeaLegsAI would find hardest to replicate?
- Should WhenToBoat position directly against SeaLegsAI or avoid the comparison?
- Is there a partnership or acquisition angle? (e.g., could WhenToBoat acquire SeaLegsAI's user base, or vice versa?)

### 5.2 Defend Against Incumbent Expansion
- If Garmin/Navionics adds a "Best Time to Go" feature, how does WhenToBoat survive?
- If Windy adds a "Boating Mode," how does WhenToBoat survive?
- What features or positioning make WhenToBoat impossible to replicate as a feature within a larger app?

### 5.3 Build a Sustainable Moat
- What should WhenToBoat invest in that creates compounding defensibility over time?
- Is the moat in data curation, algorithm accuracy, B2B relationships, community, brand, or something else?
- How did Surfline build a moat that prevented Windy from killing it? What's the analogous strategy for WhenToBoat?

### 5.4 Speed-Based Strategies
- Given a 6–12 month competitive window, what are the highest-leverage actions WhenToBoat can take in the first 90 days?
- What partnerships or distribution deals should WhenToBoat pursue immediately?
- Is there a "land grab" opportunity (e.g., signing exclusive B2B deals with boat clubs before competitors approach them)?

### 5.5 Differentiation Through Positioning
- Should WhenToBoat position as a "planning tool" (complementary to Navionics/Windy) or as a "replacement" for the multi-app workflow?
- Is "plan here, confirm there" a strong enough positioning, or does it make WhenToBoat sound like it's not confident in its own data?
- What positioning has worked for successful outdoor recreation apps (Surfline, OnX, AllTrails, OpenSnow) and what can WhenToBoat learn?

---

## Part 6: Scenario Planning

### Scenario A: SeaLegsAI raises $5M and adds activity scoring + historical data in the next 6 months
- What happens to WhenToBoat?
- What's the defensive playbook?
- Is there still a viable path?

### Scenario B: Garmin adds a "Boating Conditions" tab to Navionics with go/no-go recommendations
- How would this impact the market?
- What niche does WhenToBoat retreat to?
- Is B2B the survival path?

### Scenario C: Windy launches "Windy for Boaters" with activity-specific wind/wave thresholds
- How fast could this happen?
- What would WhenToBoat's response be?
- Is there a "better together" partnership angle?

### Scenario D: WhenToBoat launches successfully, gets 10K users in SF Bay in 6 months
- Who tries to acquire you?
- What's the negotiating position?
- What do you need to have built to be acquisition-attractive?

---

## Part 7: Deliverables

Structure your report as:

1. **Threat Ranking** — all competitors ranked by threat level (1–10) with specific justification
2. **SeaLegsAI Deep Profile** — product teardown, business analysis, growth trajectory, exact feature comparison with WhenToBoat
3. **Deckee Deep Profile** — same depth
4. **Incumbent Risk Assessment** — Garmin, Windy, PredictWind expansion probability
5. **Emerging Competitor Scan** — anything new in the last 12 months
6. **Moat Assessment** — honest evaluation of each WhenToBoat differentiator's defensibility
7. **Competitive Playbook** — specific actions to take in weeks 1–4, months 2–3, months 4–6
8. **Scenario Response Plans** — for each scenario above
9. **"What Would Kill WhenToBoat?"** — the single most dangerous competitive move, and how to preempt it

Cite all sources with URLs. Distinguish between confirmed facts (from app stores, websites, press releases) and informed inferences. If you can't find information on a competitor, say so explicitly rather than guessing.
