

# Revert Board Parameter to AIRecruiter

## Clarification
`AIRecruiter` is the correct `board` parameter for all CDL Job Cast feed URLs. `ATSme` is the platform/product name, not a feed parameter. The James Burg user code fix (adding "Company") was correct and stays.

## Changes

### 1. supabase/functions/_shared/hayes-client-handler.ts (line 432)
- Revert James Burg `feedBoard` from `'ATSme'` back to `'AIRecruiter'`

### 2. supabase/functions/sync-cdl-feeds/index.ts
Standardize all feed URLs to use `board=AIRecruiter`:
- **Pemberton** (line 20): `board=ATSme` -> `board=AIRecruiter`
- **Novco** (line 30): `board=ATSme` -> `board=AIRecruiter`
- **Day and Ross** (line 35): `board=ATSme` -> `board=AIRecruiter`
- **James Burg** (line 40): `board=ATSme` -> `board=AIRecruiter`
- Danny Herman (line 25) already uses `board=AIRecruiter` -- no change needed

### 3. Frontend defaults
- `src/pages/SuperAdminFeeds.tsx`: Confirm default `boardParam` is `'AIRecruiter'` (should already be correct)
- `src/features/feeds/components/FeedSourceSelector.tsx` (line 128): Confirm placeholder is `"AIRecruiter"` (should already be correct)

### 4. Deploy and verify
- Redeploy `sync-cdl-feeds` and `hayes-jamesburg-inbound`
- Trigger a manual sync for James Burg to confirm jobs still pull in with `board=AIRecruiter`

## Summary of State After Fix

| Client | User Code | Board |
|--------|-----------|-------|
| Danny Herman | danny_herman_trucking | AIRecruiter |
| Pemberton | Pemberton-Truck-Lines-1749741664 | AIRecruiter |
| Day and Ross | Day-and-Ross-1745523293 | AIRecruiter |
| Novco | Novco%2C-Inc.-1760547390 | AIRecruiter |
| James Burg | James-Burg-Trucking-Company-1770928232 | AIRecruiter |

All feeds will consistently use `board=AIRecruiter` across both the shared config and sync function.
