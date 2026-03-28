# WhenToBoat — Route & Destination Validation Research Prompt

Paste this into ChatGPT Deep Research, Gemini Deep Research, or Perplexity Pro. The goal is to validate every route and destination in the app against real-world knowledge, and discover new routes we're missing.

---

I'm building WhenToBoat, a recreational boating planning app for San Francisco Bay. I need to validate all my destinations and routes against real-world local knowledge, published guides, Reddit discussions, social media trip reports, and maritime safety data.

## Current Destinations (31 total)

### Bay destinations (24):
1. Sausalito (kayak, SUP, powerboat, sail)
2. Angel Island / Ayala Cove (kayak, powerboat, sail)
3. Tiburon (kayak, SUP, powerboat, sail)
4. Aquatic Park, SF (kayak, SUP, powerboat)
5. Pier 39, SF (powerboat, sail)
6. Ferry Building, SF (powerboat, sail)
7. McCovey Cove, SF (powerboat, kayak, SUP)
8. Clipper Cove, Treasure Island (kayak, SUP, sail, powerboat)
9. Jack London Square, Oakland (powerboat, sail)
10. Alameda (powerboat, sail)
11. Berkeley Marina (kayak, powerboat, sail)
12. Point Richmond (powerboat, sail)
13. Half Moon Bay / Pillar Point (powerboat)
14. Redwood City (kayak, SUP, powerboat, sail)
15. Oyster Point (kayak, SUP, powerboat, sail)
16. Coyote Point (kayak, SUP, powerboat, sail)
17. San Rafael (kayak, SUP, powerboat, sail)
18. Vallejo (powerboat, sail)
19. Benicia (powerboat, sail)
20. Golden Gate Bridge / Fort Baker (powerboat, sail)
21. Stinson Beach (powerboat only)
22. Bolinas (powerboat only)
23. Point Reyes / Drakes Bay (powerboat only)
24. Monterey (powerboat only)

### New additions (7):
25. Santa Cruz (powerboat only — 75nm ocean)
26. Bodega Bay (powerboat only — 55nm ocean)
27. Tomales Bay (powerboat only — 40nm ocean, DANGEROUS bar)
28. Paradise Cay / Corte Madera (kayak, SUP)
29. Larkspur Landing (kayak, SUP)
30. Horseshoe Bay / Fort Baker (kayak, SUP, powerboat)
31. Schoonmaker Point (kayak, SUP)

## Questions for Validation

### Part 1: Destination Accuracy (for each destination)

For each of the 31 destinations, answer:
1. **Is this a real, commonly used launch/landing point for the tagged boat types?** If not, what's the correct nearby launch point?
2. **What are the actual launch ramp details?** (name, type, fee, hours, parking, max boat length)
3. **Are there kayak/SUP rental operators at or near this location?** List names and approximate seasonality.
4. **What are the known hazards specific to this location?** (currents, rocks, ferry traffic, shallow areas, restricted zones)
5. **Is this destination correctly tagged for each activity type?** Should any activities be added or removed?

### Part 2: Missing Destinations

What popular SF Bay boating destinations are we MISSING? For each category:

**Kayak/SUP (sheltered, near-shore):**
- Are there popular paddling spots in the East Bay (Oakland estuary, Lake Merritt, Lake Temescal)?
- What about Marin (China Camp, McNears Beach, Tomales Bay inside)?
- Peninsula (Foster City lagoon, Redwood Shores, San Mateo)?
- Are there any creek/estuary paddling routes we should include?

**Powerboat (day cruises, fishing):**
- What are the most popular powerboat destinations that recreational boaters actually visit?
- Are there anchorages or raft-up spots we're missing? (e.g., Ayala Cove is listed but what about other anchorages?)
- What fishing destinations are popular? (Stripers at San Pablo Bay, halibut at Berkeley Flats, etc.)

**Sailing (daysails):**
- What are the classic SF Bay daysail routes? (e.g., Berkeley to Angel Island, Sausalito to Tiburon, the "city front")
- Are there sailing destinations beyond our 31 that are popular?

**SUP (flat water, sheltered):**
- What are the most popular SUP launch points in the SF Bay Area?
- Are there any inland lakes or reservoirs where SUP is popular that we should consider for future expansion?

### Part 3: Route Viability

For the following route categories, validate whether they're realistic and identify hazards:

**Cross-bay routes (require Central Bay transit):**
- Sausalito → Jack London Square: Is this a realistic powerboat route? What are the conditions?
- Berkeley → Angel Island: Common daysail? What tidal current issues?
- Tiburon → SF waterfront: Kayak viable? What about ferry traffic?

**Ocean routes (require Golden Gate transit):**
- Any Bay origin → Half Moon Bay: Realistic powerboat day trip? How often is the bar safe to cross?
- Any Bay origin → Bodega Bay: How long does this actually take? Is it a realistic day trip or does it require overnight?
- Any Bay origin → Tomales Bay: What are the ACTUAL fatality statistics? How often is the bar passable?
- Any Bay origin → Santa Cruz: Is this realistic as a day trip or must it be overnight?
- Any Bay origin → Monterey: 75nm — is this ever done as a day trip?

**South Bay routes:**
- Redwood City → Coyote Point: Shallow water hazards? Mud flat exposure at low tide?
- Oyster Point → Alviso: Do people actually boat to Alviso? Is it navigable?

### Part 4: Innovative Route Ideas

Based on local knowledge, social media, and boating forums, what NEW routes or experiences could WhenToBoat suggest that would get more people on the water?

Examples to investigate:
- **Sunset cruises:** Best routes for golden hour photography?
- **Wildlife routes:** Best spots to see seals, whales, dolphins, pelicans from a kayak/SUP?
- **Historical routes:** Angel Island immigration station, Alcatraz views from kayak, Fort Point paddle?
- **Food/drink destinations:** Waterfront restaurants accessible by boat? (Sam's in Tiburon, Scoma's in Sausalito, Kincaid's in Jack London)
- **Seasonal events:** Opening Day on the Bay, Fleet Week viewing spots, 4th of July fireworks?
- **Group paddling routes:** Organized group paddles, meetup routes?
- **Full moon paddles:** Where is this done on SF Bay?

### Part 5: Data Sources for Validation

What publicly available data sources should I use to validate my route and destination data?

Look for:
- **Reddit communities:** r/kayaking, r/sailing, r/boating, r/BayArea, r/sanfrancisco — relevant threads about SF Bay boating
- **Facebook groups:** SF Bay kayaking, Bay Area SUP, SF sailing groups
- **Published guides:** Any SF Bay boating guide books? (Sea Kayaking series, etc.)
- **Marina databases:** DBAW (CA Division of Boating & Waterways) launch ramp inventory
- **Kayak/SUP rental company websites:** What destinations do they list?
- **Sailing school curricula:** What routes do OCSC, Modern Sailing, etc. teach on?
- **USCG District 11 safety reports:** Incident data for SF Bay recreational boating

## What I Need Back

1. **Destination-by-destination validation table** with corrections
2. **List of 10-20 missing destinations** with coordinates, activity tags, and notes
3. **Route viability assessment** for each route category
4. **5-10 innovative route ideas** with feasibility notes
5. **Links to source material** for ongoing validation

The goal is to get people on the water safely. Every destination and route must be vetted, realistic, and properly warned about hazards.
