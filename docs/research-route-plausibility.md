# Deep Research: SF Bay Boating Route Popularity & Feasibility by Vessel Type

## Context

WhenToBoat is a trip-planning app for San Francisco Bay boaters. It currently has **37 destinations** and **4 activity types** (kayak, SUP, powerboat cruise, casual daysail). We need ground-truth data on which routes real boaters actually use, broken down by vessel type, to: (1) prune unrealistic routes, (2) prioritize waypoint validation for heavily-used routes, and (3) create content/guides for popular routes.

**Current 37 destinations (by ID and name):**

| ID | Name | Activity Tags |
|---|---|---|
| sau | Sausalito | kayak, sup, powerboat, sail |
| ang | Angel Island | kayak, powerboat, sail |
| tib | Tiburon | kayak, sup, powerboat, sail |
| aqp | Aquatic Park | kayak, sup only |
| p39 | Pier 39 | powerboat, sail |
| fbg | Ferry Building / South Beach Harbor | powerboat, sail |
| mcc | McCovey Cove | powerboat, kayak, sup |
| clp | Clipper Cove (Treasure Island) | kayak, sup, sail, powerboat |
| jls | Jack London Square | powerboat, sail |
| alm | Alameda | sail, powerboat |
| brk | Berkeley Marina | sail, powerboat, kayak |
| ptr | Pt Richmond | powerboat, sail, kayak |
| hmb | Half Moon Bay (Pillar Point) | powerboat only |
| rwc | Redwood City | kayak, sup, powerboat, sail |
| oyp | Oyster Point | kayak, sup, powerboat, sail |
| cop | Coyote Point | kayak, sup, powerboat, sail |
| srf | San Rafael (Loch Lomond) | kayak, sup, powerboat, sail |
| val | Vallejo | powerboat, sail |
| ben | Benicia | powerboat, sail |
| ggb | Golden Gate Bridge / Fort Baker | powerboat, sail |
| stn | Stinson Beach | DISABLED (no marine infrastructure) |
| bol | Bolinas Lagoon | kayak, sup only |
| mry | Monterey | powerboat only |
| pry | Point Reyes / Drakes Bay | powerboat only |
| scz | Santa Cruz | powerboat only |
| bdb | Bodega Bay | powerboat only |
| tmb | Tomales Bay (ocean entrance) | powerboat only |
| pcm | Paradise Cay | kayak, sup |
| lrk | Larkspur Landing | kayak, sup |
| hsb | Horseshoe Bay / Fort Baker | kayak, sup, powerboat |
| skm | Schoonmaker Point | kayak, sup |
| cnc | China Camp | kayak, sup |
| mcn | McNears Beach | kayak, sup |
| fcy | Foster City Lagoon | kayak, sup |
| crb | Crown Beach (Alameda) | kayak, sup |
| hdb | Heart's Desire Beach (Tomales Bay interior) | kayak, sup |
| lkm | Lake Merritt | kayak, sup |

**Vessel type specifications:**
- **Kayak**: 3.5 mph cruise, 3-hour endurance, 10-mile max round trip, no open-water crossings, max 12 kt wind
- **SUP**: 2.5 mph cruise, 2-hour endurance, 5-mile max round trip, must stay within 500m of shore, max 6 kt wind
- **Powerboat** (21ft center console): 30 mph cruise, fuel-limited (~66 gal, 9 gph), deep-v hull, handles 3 ft waves
- **Sailboat** (25ft daysailer): 7 mph cruise, 4.5 ft draft, prefers 8-18 kt wind, handles 4 ft waves

---

## SECTION 1: KAYAK ROUTES

### 1A. Most popular kayak routes on SF Bay — ranked by actual usage

Research the following sources to determine the top 20 kayak routes by real-world popularity:

- **Bay Area Sea Kayakers (BASK)**: Trip reports from bask.org — which routes appear most frequently? What are their "classic" trips?
- **Sea Trek Kayak & SUP** (Sausalito): What routes do they offer for guided tours? What routes do they recommend for rentals? (They operate from Schoonmaker Point in Sausalito)
- **California Canoe & Kayak** (Jack London Square): Their guided trip routes
- **Blue Waters Kayaking** (Tomales Bay): What routes inside Tomales Bay?
- **City Kayak** (South Beach / McCovey Cove): What routes from their launch points?
- **Cal Adventures** (Berkeley Marina): Kayak routes offered
- **Strava/GPS heatmaps**: Any available paddle-sport heatmaps for SF Bay
- **Bay Area kayak meetup groups**: Trip report patterns
- **ACA (American Canoe Association)**: Any SF Bay route guides
- **USCG rescue data**: Where do kayakers most frequently need rescue? (Indicates where they actually paddle)

**Specific kayak questions:**
1. Does anyone actually kayak across the Central Bay (e.g., Sausalito to Angel Island is listed as "all vessel types" — is this realistic for kayakers given the TSS/shipping lanes)?
2. Sausalito-Tiburon-Angel Island triangle: Is this the #1 most popular kayak route on the Bay?
3. Richardson Bay circumnavigation (Sausalito-Tiburon loop staying in Richardson Bay): How popular?
4. Aquatic Park to Crissy Field shoreline paddle: Is this commonly done?
5. McCovey Cove / Mission Creek kayak routes: What's the typical route from City Kayak?
6. China Camp / McNears Beach to Marin Islands paddle: How popular with kayak clubs?
7. Horseshoe Bay to Sausalito along the Marin Headlands: Done by anyone?
8. Any popular kayak routes in the Oakland/Alameda Estuary?
9. Elkhorn Slough (Monterey Bay) as a kayak destination — should it be added?
10. Tomales Bay (Heart's Desire to other points): What are the standard guided routes?

### 1B. Kayak route feasibility for our current data

For each of our 37 destinations, assess: Can kayakers realistically launch here AND reach at least one other destination in our database? Or is this an isolated paddling spot (fine for local out-and-back but not a "route" to another destination)?

---

## SECTION 2: SUP ROUTES

### 2A. Most popular SUP locations and routes on SF Bay

SUP is unique because most SUP on the Bay is NOT point-to-point between destinations — it's local paddling from a single launch point. Research:

- **SUP rental companies**: Where do they operate? What routes do they suggest?
  - Sea Trek (Sausalito)
  - City Kayak (South Beach)
  - 101 Surf Sports (San Rafael)
  - Boardsports California
  - Any others operating on SF Bay
- **SF SUP meetup groups**: Where do they paddle?
- **Instagram/social media geotagging**: Where are SF Bay SUP photos most frequently posted from?

**Specific SUP questions:**
1. Is SUP on SF Bay primarily a "paddle around near the launch point" activity, or do people actually do point-to-point routes?
2. Of our sheltered SUP destinations (pcm, lrk, skm, cnc, mcn, fcy, crb, lkm), which see the most SUP traffic?
3. Richardson Bay (Sausalito to Tiburon): Do SUP riders actually do this crossing, or is it too exposed?
4. Aquatic Park: Is this primarily a swimming area that SUP riders use as a launch point, or a destination?
5. Foster City Lagoon: How popular is this compared to actual Bay locations?
6. Lake Merritt: How popular for SUP vs. kayak? Is it appropriate to include in a "Bay boating" app?
7. Crown Beach (Alameda): Is this popular for SUP or more of a kiteboarding spot?
8. Should we have SUP-specific routes at all, or should SUP be modeled as "launch point + radius" rather than origin-destination pairs?

---

## SECTION 3: POWERBOAT ROUTES

### 3A. Most popular powerboat day cruises on SF Bay — ranked by actual usage

Research:
- **Marina guest dock traffic data**: Which marinas report the most transient/guest dock visits? Key marinas to research:
  - Sam's Anchor Cafe dock (Tiburon) — how busy?
  - Pier 39 Marina guest slips — occupancy rates?
  - Angel Island (Ayala Cove) — moorings and dock usage patterns?
  - Jack London Square guest dock — usage?
  - South Beach Harbor transient slips — demand?
- **Active Captain / Navionics community waypoints**: Most-reviewed/waypointed routes in SF Bay
- **BoatUS / Cruisers Forum**: SF Bay trip reports
- **Latitude 38 magazine**: Cruise stories — which routes featured most?
- **Bay Area boat rental companies**: Routes suggested for bareboat charters
  - Club Nautique (Alameda, Sausalito)
  - Modern Sailing School (Sausalito)
  - Sailing SF
  - GetMyBoat / Boatsetter listings for SF Bay — what routes do charter captains offer?
- **SF Bay fuel dock locations**: Which fuel docks see the most traffic? (Indicates where boats actually go)
- **USCG Vessel Traffic Service data**: Recreational traffic patterns through VTS SF

**Specific powerboat questions:**
1. Top 5 powerboat day-trip destinations from the most popular launch points (Sausalito, Berkeley, Alameda, South Beach)?
2. Angel Island day trip: What percentage of weekend moorings/dock space is occupied by powerboaters vs. sailboats?
3. Sausalito-to-Tiburon "lunch cruise": Is this the #1 most popular casual powerboat route?
4. SF waterfront hop (Pier 39 -> Ferry Building -> McCovey Cove -> back): Is this a thing?
5. Do powerboaters from East Bay marinas (Berkeley, Alameda, Jack London) actually cruise to Marin side regularly?
6. Half Moon Bay: How many powerboaters actually make this trip from inside the Bay? Seasonal patterns?
7. Monterey by powerboat from SF: Is this done as a day trip or always overnight? How many times per year does someone actually do this?
8. Bodega Bay / Tomales Bay by powerboat: How often? Is this primarily fishing-trip traffic?
9. Santa Cruz by powerboat from SF Bay: Does anyone actually do this, or is the route theoretical?
10. Point Reyes / Drakes Bay: Is this exclusively a fishing destination, or do cruisers go too?
11. Vallejo / Benicia: Are these primarily transit stops for Delta-bound boats, or destinations in their own right?
12. San Rafael (Loch Lomond): Who goes here by powerboat and why?
13. South Bay destinations (Oyster Point, Coyote Point, Redwood City): Do powerboaters from Central Bay actually cruise down there?

### 3B. Missing powerboat destinations

Are there popular powerboat destinations NOT in our 37 that should be added? Consider:
- Emeryville Marina
- San Leandro Marina
- Antioch / Delta destinations (Stockton, Discovery Bay, Bethel Island)
- Any popular anchorages not represented

---

## SECTION 4: SAILBOAT ROUTES

### 4A. Most popular sailing routes on SF Bay — ranked by actual usage

Research:
- **Yacht Racing Association of San Francisco Bay (YRA)**: Race route data — which races have the most entries?
- **Yacht club cruise-outs**:
  - Corinthian YC (Tiburon), SF YC, Encinal YC (Alameda), Richmond YC, Berkeley YC, Sequoia YC (Redwood City), South Beach YC
- **Latitude 38 magazine**: Cruise stories, racing results
- **Three Bridge Fiasco** route (Blackaller Buoy -> Treasure Island -> Red Rock -> finish)
- **Jazz Cup** (South Beach to Benicia): How popular?
- **Master Mariners Regatta**: Route and participation

**Specific sailing questions:**
1. What are the "classic" yacht club-to-yacht club daysail routes?
2. Berkeley to Angel Island and back: Is this the most popular daysail on the Bay?
3. "Out the Gate" sailing: How many recreational sailors actually sail past the Golden Gate Bridge?
4. South Bay sailing: Does anyone sail to Redwood City / Coyote Point from Central Bay?
5. Vallejo/Benicia by sail: Is this mainly the Jazz Cup, or do casual cruisers go there?
6. Overnight sailing destinations: Angel Island (most popular?), then what?
7. What draft limitations actually prevent sailboats from reaching specific destinations?
8. Clipper Cove sailing: Is TISC a major origin point?

---

## SECTION 5: CROSS-CUTTING ANALYSIS

### 5A. Route popularity matrix

For each origin-destination pair in our distance matrix, estimate popularity on a 1-10 scale for each vessel type:
- 10 = done by dozens of boats every weekend
- 7-9 = popular, done weekly by multiple boats
- 4-6 = done occasionally, maybe monthly
- 1-3 = rarely done, maybe a few times per year
- 0 = theoretical but never/almost never done in practice

### 5B. Seasonal patterns

Which routes have strong seasonal patterns?

### 5C. Routes to PRUNE

Which origin-destination pairs should be removed or flagged as unrealistic?

### 5D. Routes to ADD

What popular routes are MISSING from our database?

### 5E. Content opportunity analysis

1. **"Best 5 kayak trips from [X]"** — Which origins have 5+ good kayak routes?
2. **"Weekend powerboat getaways from SF Bay"** — Which overnight destinations are viable?
3. **"Your first daysail on SF Bay"** — What's the most common beginner sailing route?
4. **"Bucket list" sailing routes** — What routes do Bay Area sailors dream about?
5. **Seasonal route guides** — "Best fall sailing," "Summer morning paddles," etc.
6. **"SUP spots on SF Bay"** — Better as "best launch points" guide rather than routes?

---

## OUTPUT FORMAT

**Part 1: Route Popularity Rankings** (one table per vessel type)
| Rank | Origin | Destination | Popularity (1-10) | Difficulty | Season | Source(s) |

**Part 2: Route Disposition Recommendations**
| Origin ID | Dest ID | Vessel Type | Action (KEEP/PRUNE/ADD) | Reason | Waypoint Priority (1-3) |

**Part 3: Missing Routes to Add**
| Origin | Destination | Vessel Types | Popularity | Why Missing |

**Part 4: Content Opportunities**
| Content Title | Routes Covered | Target Audience | SEO Value (H/M/L) |

**Part 5: Data Quality Notes**
For each destination, note any corrections to our current activity tags.

---

## KEY DATA SOURCES

1. BASK (Bay Area Sea Kayakers) trip reports — bask.org
2. YRA (Yacht Racing Association) race data — yra.org
3. Latitude 38 magazine — latitude38.com
4. Active Captain / Navionics community data
5. Rental company websites (Sea Trek, City Kayak, Cal Adventures, Blue Waters)
6. USCG Sector SF incident data
7. Marina websites with guest dock info
8. BCDC recreation data
9. California Division of Boating and Waterways launch ramp usage
10. MarineTraffic AIS data for recreational vessel density
11. Strava Global Heatmap for paddle sports
12. California State Parks (Angel Island, China Camp) visitor data
