# Navigational Integrity Validation Prompt

Use this prompt with ChatGPT, Gemini, Claude, or any AI to validate the proposed solution before building it.

---

## Context

I'm building **WhenToBoat**, a recreational boating planning app for San Francisco Bay. The app shows water routes between 13 destinations on a Mapbox map. Currently, 78 routes are defined as arrays of [lng, lat] waypoints — but many of them cross over land masses (Angel Island, Yerba Buena Island, the San Francisco peninsula) because the waypoints were hand-drawn and not validated against actual geography.

This destroys the app's credibility. A boating app showing routes through land is immediately untrustworthy, especially for an app targeting safety-conscious users.

## Proposed Solution

I plan to build a 4-phase navigational integrity system:

### Phase 1: Land Polygon Definitions
Define simplified GeoJSON polygon boundaries for all major SF Bay land masses:
- San Francisco peninsula
- Angel Island
- Yerba Buena Island / Treasure Island
- Alcatraz
- Tiburon/Belvedere peninsula
- Marin headlands
- Oakland/East Bay shoreline
- Alameda Island

Each polygon is a closed [lng, lat] ring tracing the approximate shoreline. Accuracy target: ~100 meters (catching visibly wrong routes, not survey-grade precision).

### Phase 2: Validation Script
A Node.js script using Turf.js (v7.3.4, already installed) that:
1. Loads all 78 water routes (each is an array of [lng, lat] waypoints)
2. Loads the land polygons
3. For each route, checks:
   - `booleanIntersects(lineString(waypoints), polygon([landCoords]))` — does the route touch land?
   - `lineSegment()` to break into 2-point segments and identify which specific segment crosses which land mass
   - `booleanPointInPolygon()` to check if any waypoint is physically on land
4. Reports all failures with route ID, segment index, and land mass name
5. Exits with code 1 if any route fails

### Phase 3: Fix All Routes
For each failing route, insert intermediate waypoints that go around the land mass instead of through it. Re-validate after every fix.

### Phase 4: CI Integration
Add validation to the build pipeline (`prebuild` script in package.json) so land crossings are caught before deploy.

## Specific Questions for Validation

### 1. Is this the right approach?
- Is Turf.js `booleanIntersects` + `lineSegment` the best way to detect line-polygon crossings? Are there edge cases this misses?
- Should I use `booleanCrosses` instead of `booleanIntersects`? What's the difference in practice?
- Are there better libraries for marine route validation?

### 2. Land polygon accuracy
- Is ~100m accuracy sufficient for this use case? Or do I need higher precision coastline data?
- Should I use OpenStreetMap coastline data instead of hand-drawing polygons? If so, how do I extract SF Bay coastlines from OSM?
- Are there free, machine-readable SF Bay shoreline datasets from NOAA or USGS that would be more accurate than manual definition?

### 3. Edge cases to worry about
- What happens with routes that start or end at a dock ON the shoreline? (The destination coordinates are at docks, which are technically at the land-water boundary.)
- Should I add a small buffer (~50m) around land polygons to catch routes that barely graze the shore?
- How do I handle routes that go under bridges (Bay Bridge, Golden Gate)? The bridge is a structure but the water underneath is navigable.
- What about man-made features like breakwaters, piers, and jetties?

### 4. Auto-fix feasibility
- For Phase 3, I'm proposing to auto-fix routes by inserting waypoints around land masses. Is this realistic, or should I manually redraw failing routes?
- What algorithm would you recommend for finding a path around a polygon? (e.g., follow the polygon boundary, visibility graph, convex hull detour?)
- What happens if a route needs to go through a narrow channel (like the Oakland Estuary) that's between two land polygons?

### 5. Performance
- I have 78 routes × ~8 land polygons = ~624 checks. Is Turf.js fast enough to run this in a build step (<5 seconds)?
- Should the validation also run client-side (to validate routes added in future), or is build-time sufficient?

### 6. Alternative approaches
- Should I use Mapbox's built-in terrain/land data to validate routes instead of defining my own polygons? (e.g., query the Mapbox vector tiles to check if a coordinate is on land)
- Would it be better to use a marine routing API (like GraphHopper Marine or OpenRouteService Water) instead of hand-drawing routes entirely?
- Is there an existing SF Bay nautical route dataset (from NOAA charts or AIS data) that I could use instead of defining routes manually?

### 7. Long-term scalability
- This approach requires manual land polygon definition per city. When I expand to San Diego, Puget Sound, or Lake Tahoe, I'll need new land polygons for each. Is there a way to automate land polygon generation from OSM or NOAA data?
- Should I invest in a general-purpose "is this coordinate in water?" service now, rather than per-city polygon definitions?

## What I Need Back

1. **Is this approach sound?** Or is there a fundamentally better way to ensure navigational integrity?
2. **What edge cases will bite me?** Specific scenarios where this approach fails.
3. **What's the minimum viable version?** If I can only build one phase today, which one gives me the most confidence?
4. **Alternative data sources** — any free, accurate SF Bay shoreline or marine route datasets I should use instead of hand-drawing?
5. **Recommendation** — would you build this custom system, or use an existing marine routing API/dataset?
