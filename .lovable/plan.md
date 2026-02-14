

# Review: James Burg Trucking Tenstreet Integration (Company ID 1680394)

## Current Status

### What's Working
- ATS connection is **active** with correct credentials (Client 601, Company ID 1680394)
- Auto-post is **enabled** on the connection
- Voice agent (outbound) is correctly configured with client-specific routing
- The outbound call trigger correctly prioritizes the James Burg agent via `client_id` matching
- Inbound endpoint (`hayes-jamesburg-inbound`) is properly configured with CDL Job Cast feed sync
- Application prefix mapping (`14496`) correctly resolves to James Burg

### Issues Found

#### Issue 1: Cross-Posting Bug (Critical)
The `submit-application` edge function calls `autoPostToATS()` on line 950 **without passing `clientId`**:

```text
autoPostToATS(supabase, data.id, organizationId, applicationData)
                                                    ^ no clientId option
```

The `get_active_ats_connections` RPC returns ALL connections when `p_client_id` is NULL. This means every James Burg application is also being posted to Danny Herman (1658), Pemberton (1942), and Day & Ross (2829) -- and vice versa. Evidence from the test application (`d033ca60`) confirms it was posted to 3 wrong connections (Danny Herman, Day & Ross, Pemberton) but not to the James Burg connection.

**Fix**: Pass the `clientId` from the job listing to `autoPostToATS()`. The `client_id` is already available on the job listing. Also update `get_active_ats_connections` to filter strictly when a `client_id` is provided (remove the `OR ac.client_id IS NULL` fallback for auto-post scenarios).

#### Issue 2: Missing Source Credential
The James Burg connection credentials lack the `source` field. All other Hayes connections use `source: 'NationalTruckinNetwork'`, but James Burg defaults to `'3BI'`. This may cause Tenstreet to reject or misroute applications.

**Fix**: Add `source: 'NationalTruckinNetwork'` to the James Burg credentials via a data update.

#### Issue 3: Voice Transcript Re-Post Not Triggered
After an outbound call completes, there is no mechanism to automatically re-post the application to Tenstreet with the enriched transcript data. The `enrichWithTranscript` utility correctly fetches transcripts, but it only runs at the time of the initial auto-post (before the call happens). There's no follow-up re-post after the outbound call completes.

**Fix**: Add a trigger or scheduled job that re-posts to Tenstreet when an outbound call status changes to `completed` and a transcript becomes available. This applies to all Hayes clients, not just James Burg.

---

## Implementation Plan

### Step 1: Fix Cross-Posting -- Pass `clientId` to auto-post
In `submit-application/index.ts`, retrieve `client_id` from the resolved job listing and pass it as an option:

```text
autoPostToATS(supabase, data.id, organizationId, applicationData, {
  clientId: jobListing.client_id
})
```

Also update `get_active_ats_connections` to strictly filter by `client_id` when provided (matching connections with that exact client_id, not falling back to NULL client_id connections). Connections with `client_id IS NULL` should only be returned when no `p_client_id` is provided.

### Step 2: Add Missing Source to James Burg Credentials
Update the `ats_connections` record (`89b01bd3-2533-47ad-89ea-196c12f5c136`) to add `source: 'NationalTruckinNetwork'` to the credentials JSON.

### Step 3: Add Post-Call Tenstreet Re-Sync
Create a mechanism (either a database trigger on `outbound_calls` status change to `completed`, or a check in the existing `sync-elevenlabs-calls` cron job) that re-posts the application to Tenstreet with the enriched transcript when a call completes.

### Step 4: Fix the Test Application
The test application (`d033ca60`) was incorrectly cross-posted. Clean up by verifying the James Burg connection received the post, and document the fix.

---

## Technical Details

### Files to Modify
1. **`supabase/functions/submit-application/index.ts`** -- Pass `clientId` to `autoPostToATS()`
2. **`supabase/functions/_shared/ats-adapters/auto-post-engine.ts`** -- Ensure `clientId` is forwarded to the RPC call (already supported, just needs the caller to pass it)
3. **Database function `get_active_ats_connections`** -- Tighten filtering logic when `p_client_id` is provided
4. **Database update** -- Add `source` to James Burg credentials
5. **New: Post-call re-sync logic** -- Either in the `sync-elevenlabs-calls` function or a new trigger

### Risk Assessment
- **Cross-posting fix**: Low risk, high impact. Prevents data leaking between carriers.
- **Source credential**: Low risk. Simple data update.
- **Re-sync**: Medium complexity. Needs careful design to avoid duplicate posts.

