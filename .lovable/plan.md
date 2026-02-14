

# Review: James Burg Trucking Tenstreet Integration (Company ID 1680394)

## ✅ COMPLETED - All Issues Fixed

### Fix 1: Cross-Posting Bug (Critical) — FIXED
- **submit-application/index.ts**: Now resolves `client_id` from the job listing and passes it to `autoPostToATS()` via the `clientId` option.
- **`get_active_ats_connections` DB function**: Updated to strictly filter by `client_id` when provided — no longer falls back to `client_id IS NULL` connections, preventing cross-posting between carriers.

### Fix 2: Missing Source Credential — FIXED
- James Burg credentials (`89b01bd3-2533-47ad-89ea-196c12f5c136`) updated with `source: 'NationalTruckinNetwork'`.
- Verified: `{"mode": "PROD", "source": "NationalTruckinNetwork", "password": "***", "client_id": "601", "company_ids": "1680394"}`

### Fix 3: Post-Call Tenstreet Re-Sync — IMPLEMENTED
- **elevenlabs-call-status/index.ts**: When an outbound call reaches `completed` status with an `application_id`, the function now:
  1. Fetches the application and its job listing (for `client_id` routing)
  2. Triggers `autoPostToATS()` as a non-blocking background task
  3. The auto-post engine's `enrichWithTranscript` utility attaches the call transcript before sending to Tenstreet
- This applies to **all** Hayes clients (Danny Herman, Pemberton, James Burg, Day & Ross), not just James Burg.

### Deployment Status
- `submit-application` edge function: ✅ Deployed
- `elevenlabs-call-status` edge function: ✅ Deployed
- Database migration (get_active_ats_connections): ✅ Applied
- James Burg credentials update: ✅ Applied
