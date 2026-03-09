

# Invert DFW Geo-Fence: Block Inside, Allow Outside

## Current behavior (wrong)
- Users **inside** 200 miles of DFW → allowed
- Users **outside** 200 miles of DFW → blocked with "We're Not in Your Area Yet"

## Desired behavior
- Users **inside** 200 miles of DFW → **blocked** (restricted zone)
- Users **outside** 200 miles of DFW → **allowed**
- OFAC sanctions countries → still blocked (no change)

## Changes

### 1. `supabase/functions/_shared/geo-fence.ts`
- Rename concept from "service area" to "restricted zone"
- Invert the logic: `allowed = distance > RESTRICTED_RADIUS_MILES` (was `<=`)
- Update JSDoc comments to reflect the new semantics

### 2. `supabase/functions/geo-check/index.ts`
- Gate 2 now blocks when user **is inside** the DFW radius
- Change reason from `outside_service_area` to `inside_restricted_zone`
- Update log messages accordingly

### 3. `src/contexts/GeoBlockingContext.tsx`
- Rename `isOutsideServiceArea` to `isInsideRestrictedZone`
- Match on new reason `inside_restricted_zone`

### 4. `src/pages/RegionBlocked.tsx`
- Update the service-area block to show a "DFW Restricted Zone" message instead of "We're Not in Your Area Yet"
- Adjust copy: "Access is restricted within 200 miles of Dallas-Fort Worth"

### 5. Deploy updated `geo-check` edge function

No database changes needed. All changes are in edge function code and frontend components.

