

# Geo-Fence: DFW 200-Mile Radius Restriction

## What Changes

Restrict full platform access to users within a 200-mile radius of the Dallas-Fort Worth metroplex center. Users outside this radius (but not OFAC-blocked) see a "Service Area" page instead of the OFAC sanctions page. OFAC blocking still applies on top.

## Implementation

### 1. Update `geo-lookup.ts` — Add lat/lon to GeoLocation

The ip-api.com API supports `lat,lon` fields. Add them to the fields query string and `GeoLocation` interface. This is a one-line field addition to the fetch URL and two new properties on the interface.

### 2. Create `supabase/functions/_shared/geo-fence.ts` — Distance calculation

New shared module with:
- DFW center coordinates: `(32.8968, -97.0380)`
- `ALLOWED_RADIUS_MILES = 200`
- `haversineDistanceMiles(lat1, lon1, lat2, lon2)` — standard Haversine formula
- `isWithinServiceArea(geo: GeoLocation): { allowed: boolean; distanceMiles: number }` — returns whether user is within 200 miles of DFW

### 3. Update `geo-check/index.ts` — Apply geo-fence after OFAC check

After the existing OFAC sanctions check passes, add a second gate:
- If `geo` has valid lat/lon, compute distance from DFW
- If distance > 200 miles, return `{ allowed: false, reason: 'outside_service_area', distanceMiles }` with a 403
- Fail-open: if lat/lon are missing, allow access (consistent with existing policy)

### 4. Update `GeoBlockingContext.tsx` — Handle new reason

Add `isOutsideServiceArea` boolean to the context state, set when `reason === 'outside_service_area'`. The existing `isBlocked` flag will already be true, so `GeoBlockingGate` will show the blocked page.

### 5. Update `RegionBlocked.tsx` — Show service-area message

Conditionally render different content based on `reason`:
- `blocked_region` → existing OFAC sanctions messaging
- `outside_service_area` → friendly "We're currently serving the Dallas-Fort Worth area" message with a map pin icon, distance info, and a "notify me when we expand" or contact email

### 6. Update `geo-rate-config.ts` — Align DFW city list

No changes needed — the existing DFW rate-limit override is separate from the geo-fence and continues to work independently.

## Key Decisions
- **Fail-open on missing coordinates**: If ip-api.com doesn't return lat/lon, allow access (consistent with existing fail-open policy)
- **Lovable preview bypass preserved**: The existing preview environment bypass in `geo-check/index.ts` continues to skip all checks including the new geo-fence
- **OFAC checked first**: Sanctioned countries are still blocked with the sanctions message before the distance check runs

