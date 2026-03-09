

## Remove DFW Geo-Fence Restriction

The DFW 200-mile restricted zone is implemented across 4 files. The OFAC sanctions blocking remains untouched.

### Changes

**1. `supabase/functions/geo-check/index.ts`**
- Remove the import of `checkRestrictedZone` and `RESTRICTED_RADIUS_MILES` from `geo-fence.ts`
- Remove Gate 2 entirely (lines 79-101) — the restricted zone check and its 403 response
- Remove `distanceMiles` from the allowed response (lines 111, 118)

**2. `supabase/functions/_shared/geo-fence.ts`**
- Delete the entire file (no longer needed)

**3. `src/contexts/GeoBlockingContext.tsx`**
- Remove `isInsideRestrictedZone`, `distanceMiles`, and `restrictedRadiusMiles` from the state interface and all state initializations
- Remove the `inside_restricted_zone` reason mapping

**4. `src/pages/RegionBlocked.tsx`**
- Remove the restricted zone branch (lines 18-100 approximately) — keep only the OFAC sanctions blocked UI
- Remove `distanceMiles`, `restrictedRadiusMiles` from the destructured context

**5. `src/components/GeoBlockingGate.tsx`**
- No changes needed (it only checks `isBlocked`, which still works for OFAC)

**6. Deploy updated `geo-check` edge function**

### What stays
- OFAC sanctions country blocking (Russia, Iran, Cuba, North Korea, Syria, Belarus)
- `isOutsideAmericas` simulation mode logic
- Lovable preview bypass
- Fail-open policy

