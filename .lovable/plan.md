

# Add Admiral Merchants to CDL JobCast Feed Sync

## What This Does
Adds Admiral Merchants to the automated 5-minute CDL JobCast feed sync so their job listings are automatically ingested, kept current, and routed through the ATS.

## Confirmed Feed Details
- **User code**: `admiral_merchants`
- **Feed URL**: `https://cdljobcast.com/client/recruiting/getfeeds?user=admiral_merchants&board=AIRecruiter`
- **Board**: `AIRecruiter`
- **Client ID**: `53d7dd20-d743-4d34-93e9-eb7175c39da1`
- **Content**: Owner Operator positions (CDL-A Truck Driver) across multiple states, $200K-$300K/year

## Steps

1. **Add Admiral Merchants to `CDL_FEEDS` array** in `supabase/functions/sync-cdl-feeds/index.ts` — insert a new entry with the client ID, name, and feed URL
2. **Deploy the updated edge function** so the next sync cycle picks up Admiral Merchants jobs
3. **Verify** by triggering a manual sync or checking `feed_sync_logs` for the new client

## Technical Detail
- Single file change: `supabase/functions/sync-cdl-feeds/index.ts`, lines 15-46 (add one entry to the array)
- No title template needed — the feed titles appear to be descriptive ("CDL-A Truck Driver - Owner Operators") unlike R.E. Garrison's generic IDs
- State normalization already handled by existing `normalizeState()` logic
- Jobs will automatically get UTM params (`cdl_jobcast` / `job_board`) and be linked to the Admiral Merchants client record

