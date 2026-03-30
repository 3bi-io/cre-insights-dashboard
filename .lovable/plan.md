

# Redeploy sync-cdl-feeds Edge Function

## Problem
R.E. Garrison was added to the `CDL_FEEDS` array in the source code, but the edge function hasn't been redeployed. The latest logs (23:21 UTC) show only the original 5 clients being synced -- Garrison is missing.

## Steps

1. **Deploy** the `sync-cdl-feeds` edge function to push the updated code with R.E. Garrison.
2. **Wait** for the next 5-minute cron cycle (or manually invoke the function).
3. **Verify** by checking edge function logs for "R.E. Garrison Trucking" entries and querying `feed_sync_logs` for Garrison records.

## Expected Outcome
After deployment, the sync will process 6 clients instead of 5. R.E. Garrison jobs will be fetched from the CDL JobCast feed and inserted/updated in the jobs table.

## Note
The feed URL uses `RE-Garrison-Trucking-1760000000` -- if CDL JobCast hasn't provisioned that exact user code, the feed may return 0 jobs (similar to Novco, Day and Ross, and James Burg which are currently returning empty feeds). We'll confirm once the sync runs.

