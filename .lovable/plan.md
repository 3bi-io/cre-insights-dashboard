

# Increase max_per_run to 400 and Remove Quota Guard

## Changes to `supabase/functions/google-indexing-weekly/index.ts`

1. **Line 27**: Change `GOOGLE_DAILY_QUOTA` from `200` to `400`
2. **Line 122**: Remove `quotaRemaining` variable initialization
3. **Lines 127-139**: Remove the quota/rate-limit skip guard at the top of the org loop (keep only `rateLimited` check)
4. **Line 194**: Remove `quotaRemaining <= 0` from the inner loop break condition
5. **Line 227**: Remove `quotaRemaining--` after successful submission
6. **Lines 286, 297**: Remove `quota_remaining` from the response object and log

This keeps rate-limit detection (429) intact but removes the artificial daily cap that was blocking submissions after 200.

