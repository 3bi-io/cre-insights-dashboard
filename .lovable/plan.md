

# Add Non-US Locations to the Map

## What Changes

Currently, ~35 jobs in Argentina, Colombia, Mexico, and Puerto Rico are silently excluded from the map by the `isNonUSLocation` filter. This plan adds them back with correct coordinates while keeping all US job accuracy intact.

## Step 1: Add international city coordinates

**File**: `src/utils/usaCityCoordinates.ts`

Add a new `INTERNATIONAL_CITIES` lookup map for the non-US locations found in the database:

| City | Country | Coordinates |
|------|---------|-------------|
| Buenos Aires | Argentina | -34.6037, -58.3816 |
| Bogotá | Colombia | 4.7110, -74.0721 |
| Medellín | Colombia | 6.2442, -75.5812 |
| Mexico City | Mexico | 19.4326, -99.1332 |
| São Paulo | Brazil | -23.5505, -46.6333 |

Also add country-level centroids for jobs where city equals the country name (e.g., city="Colombia", no state):

| Country | Centroid |
|---------|----------|
| Argentina | -38.4161, -63.6167 |
| Colombia | 4.5709, -74.2973 |
| Mexico | 23.6345, -102.5528 |
| Brazil | -14.2350, -51.9253 |

Create a new exported function `getInternationalCoordinates(city, state)` that checks this map.

## Step 2: Remove the non-US exclusion filter, replace with international lookup

**File**: `src/hooks/useJobMapData.ts`

Instead of skipping non-US locations, add a new code path:

1. Remove the `isNonUSLocation` early-return block (lines 144-148)
2. After the existing `getLocationCoordinates` call, if it returns `null`, try `getInternationalCoordinates(city, state)` as a fallback
3. For international locations, set `isExact` based on whether a city-level match was found vs a country centroid
4. Use a location key prefix of `intl-` to distinguish from US locations

The `displayName` for international jobs will show "Buenos Aires, Argentina" or "Colombia" as appropriate.

## Step 3: Handle special cases

**File**: `src/utils/usaCityCoordinates.ts`

- Remove `'puerto rico'` from `NON_US_LOCATIONS` — Puerto Rico is already in `STATE_CENTROIDS` as `'PR'` and should match via state code normalization
- Remove `'buenos aires'` from `NON_US_LOCATIONS` — it's a city, not a country
- Keep the `isNonUSLocation` function but repurpose it: rename to a check used only internally if needed, or simply delete it since the exclusion logic is removed
- Fix "Dallas, US" case: add `'us'` → `'TX'` mapping for the state field (Dallas is in Texas) rather than excluding it

## Step 4: Adjust map viewport

**File**: `src/components/map/constants.ts`

- Lower `MIN_ZOOM` from `3` to `2` so users can zoom out to see Latin American markers
- Keep `US_CENTER` and `DEFAULT_ZOOM` unchanged — the map still opens focused on the US

## Files Changed

1. `src/utils/usaCityCoordinates.ts` — Add international coordinates, update `NON_US_LOCATIONS`, add `getInternationalCoordinates()`
2. `src/hooks/useJobMapData.ts` — Remove non-US exclusion, add international coordinate fallback path
3. `src/components/map/constants.ts` — Lower `MIN_ZOOM` to 2

