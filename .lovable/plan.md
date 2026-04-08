

# Fix Map Data Accuracy — Missing Cities, Spelling Variants, and Non-US Locations

## Problem Summary

After auditing all 1,237 active jobs against the coordinate lookup table, there are three categories of data accuracy issues causing jobs to either not appear on the map or appear at wrong (state centroid) positions:

1. **~70 cities missing from the coordinate lookup** — cities like St George UT (10 jobs), Front Royal VA (8 jobs), Warrensburg MO (6 jobs), Katy TX (5 jobs), etc. fall back to state centroids instead of their correct city positions
2. **Spelling/format mismatches** — database entries don't match the lookup keys (e.g., "Joilet" vs "Joliet", "Saint Louis" vs "St. Louis", "Mc Kinney" vs "McKinney", "Winston salem" vs "Winston-Salem")
3. **Non-US locations silently dropped** — ~35 jobs in Argentina, Colombia, Mexico, Puerto Rico, Brazil get no coordinates at all and disappear from the map

## Detailed Findings

### Missing Cities (top by job count)
| City | State | Jobs | Current behavior |
|------|-------|------|-----------------|
| St George | UT | 10 | Falls to UT centroid |
| Front Royal | VA | 8 | Falls to VA centroid |
| Warrensburg | MO | 6 | Falls to MO centroid |
| Katy | TX | 5 | Falls to TX centroid |
| Lawrenceville | GA | 4 | Falls to GA centroid |
| Marietta | GA | 4 | Falls to GA centroid |
| Spartanburg | SC | 3 | Falls to SC centroid |
| Macon | GA | 3 | Falls to GA centroid |
| ~60 more cities | various | 1-3 each | State centroid fallback |

### Spelling Mismatches (will get NO match, not even state centroid in some cases)
| DB value | Lookup expects | Jobs |
|----------|---------------|------|
| Saint Louis, MO | St. Louis, MO | 17 |
| Joilet, IL | Joliet, IL | 5 |
| Mc Kinney, TX | McKinney, TX | 2 |
| Winston salem, NC | Winston-Salem, NC | 2 |
| Saint Charles, MO | (not in lookup) | 4 |
| High point, NC | High Point, NC | 2 |
| Oklahoma city, OK | Oklahoma City, OK | 5 |
| Fort wayne, IN | Fort Wayne, IN | 3 |

Note: The lookup is case-insensitive so "fort wayne" → "Fort Wayne" works. But "saint louis" ≠ "st. louis" and "joilet" ≠ "joliet" — these are string mismatches, not case issues.

### Non-US Locations (completely invisible on map)
| Location | Jobs |
|----------|------|
| Buenos Aires, Argentina | 5 |
| Colombia (city=Colombia, no state) | 17 |
| Argentina (city=Argentina, no state) | 14 |
| Bogotá, Colombia | 2 |
| Medellin, Colombia | 1 |
| Mexico City, Mexico | 2 |
| San Juan, Puerto Rico | 2 |
| Dallas, US (state="US") | 1 |

---

## Implementation Plan

### Step 1: Add city name aliases to the lookup function

**File**: `src/utils/usaCityCoordinates.ts`

Add an alias map that normalizes common spelling variants before lookup:

```text
CITY_ALIASES = {
  "saint louis" → "st. louis",
  "joilet"      → "joliet",
  "mc kinney"   → "mckinney",
  "saint charles" → "st. charles",  (after adding St. Charles)
  "saint paul"  → "saint paul",     (already works)
  "saint peters" → "st. peters",
  "o fallon"    → "o'fallon",
}
```

Modify `getCityCoordinates()` to check the alias map before lookup. This handles all the spelling variants without touching the database.

### Step 2: Add ~70 missing US cities to the lookup table

**File**: `src/utils/usaCityCoordinates.ts`

Add coordinates for every US city in the database that's currently missing. Top priority cities with verified coordinates:

- St George, UT (37.0965, -113.5684)
- Front Royal, VA (38.9182, -78.1944)
- Warrensburg, MO (38.7628, -93.7360)
- Katy, TX (29.7858, -95.8244)
- Lawrenceville, GA (33.9562, -83.9880)
- Marietta, GA (33.9526, -84.5500)
- Spartanburg, SC (34.9496, -81.9320)
- Macon, GA (32.8407, -83.6324)
- Rock Hill, SC (34.9249, -81.0251)
- Roswell, GA (34.0232, -84.3616)
- Spring, TX (30.0799, -95.4172)
- Summerville, SC (33.0185, -80.1757)
- Cypress, TX (29.9691, -95.6970)
- Morganton, NC (35.7454, -81.6848)
- And ~55 more (full list derived from DB audit)

### Step 3: Handle non-US locations gracefully

**File**: `src/utils/usaCityCoordinates.ts`

Since the map is US-focused, non-US jobs (Argentina, Colombia, Mexico, Brazil) should not silently disappear. Two options:

**Option A (recommended)**: Exclude non-US jobs at the query level in `useJobMapData.ts` — add a filter condition to skip jobs where state is a country name or city is a country name. This is cleaner and avoids rendering misleading markers.

**Option B**: Add a small set of international coordinates. This would place markers outside the US map bounds, which is confusing for a US-focused map.

Also fix the one "Dallas, US" record — treat state="US" as unknown and fall back to state centroid or exclude.

### Step 4: Fix the `(Hybrid) Dallas` and `Híbrido (Buenos Aires` entries

**File**: `src/hooks/useJobMapData.ts`

Add a city name sanitizer in the location parsing logic that strips prefixes like `(Hybrid)` and `Híbrido (` before coordinate lookup. This is a 3-line regex.

---

## Technical Details

- The coordinate lookup (`getLocationCoordinates`) is case-insensitive but does exact string matching after lowercasing — so "saint louis" ≠ "st. louis"
- State centroid fallback works for missing cities with valid states, but the marker appears at the geographic center of the state (misleading)
- Adding ~70 cities increases the lookup table from ~300 to ~370 entries — negligible impact on bundle size (~3KB)
- The alias map approach handles DB spelling inconsistencies without requiring database migrations

## Files Changed

1. `src/utils/usaCityCoordinates.ts` — Add missing cities, add alias map, update lookup function
2. `src/hooks/useJobMapData.ts` — Add city name sanitizer, filter non-US locations

