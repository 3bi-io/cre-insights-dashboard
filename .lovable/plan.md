

# Fix: Hayes Inbound Missing ATS Delivery to Double Nickel

## Root Cause
The `hayes-client-handler.ts` inserts applications into the database but **never calls `autoPostToATS()`** afterward. This means all applications received via the `hayes-inbound` endpoint (CDL JobCast traffic for RE Garrison and other Hayes clients) are silently dropped — they never get delivered to Double Nickel or any other connected ATS.

By contrast, `submit-application/index.ts` correctly calls `autoPostToATS()` after every insert.

## Current State (RE Garrison)
- **9 total applications** in the database
- **Only 1** has an ATS sync log (the March 26 test, likely inserted via `submit-application`)
- **8 applications from today** (including Mick Foley x4, test data x3) have **zero delivery attempts**
- Double Nickel ATS connection is active with `is_auto_post_enabled: true`

## Fix
**One change in `supabase/functions/_shared/hayes-client-handler.ts`:**

1. Import `autoPostToATS` from the ATS adapter engine
2. After the successful `insertApplication()` call (~line 306), add a non-blocking `autoPostToATS()` call using the Hayes org ID, the application data, and the client ID

```typescript
// After line 304 (successful insert)
// Auto-post to ATS (non-blocking)
EdgeRuntime.waitUntil(
  autoPostToATS(supabase, application.id, HAYES_ORG_ID, applicationData as Record<string, unknown>, {
    clientId: config.clientId
  })
);
```

This matches exactly how `submit-application` handles it.

## Post-Fix: Backfill the 8 Undelivered Applications
After deploying the fix, manually trigger `autoPostToATS` for the 8 existing undelivered RE Garrison applications so they get sent to Double Nickel. This can be done by calling the existing auto-post mechanism or creating a one-time backfill.

## Technical Details
- `HAYES_ORG_ID` is already defined in the file as `'84214b48-7b51-45bc-ad7f-723bcf50466c'`
- The Double Nickel connection ID is `b531dbe2-278c-47b7-a39b-f951d3e3d6cc`
- `EdgeRuntime.waitUntil()` ensures the ATS post happens in the background without blocking the response to CDL JobCast
- The fix applies to ALL Hayes clients (Danny Herman, Pemberton, Day & Ross, Novco, James Burg, RE Garrison)

