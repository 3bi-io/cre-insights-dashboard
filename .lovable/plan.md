

## Plan: Import CDL Job Cast Jobs for Trucks For You Inc

### What Was Found

- **CDL Job Cast feed user**: `trucks_for_you_inc` — confirmed active with multiple OTR CDL-A job listings
- **Client**: Trucks For You Inc (ID: `cc4a05e9-2c87-4e71-b7f5-49d8bd709540`), Hayes organization
- **Current job count**: 0 active listings
- **Missing from UI**: `trucks_for_you_inc` is not in the carrier dropdown on the Super Admin Feeds page

### Steps

**1. Add "Trucks For You Inc" to the carrier dropdown**

In `src/pages/SuperAdminFeeds.tsx`, add `{ value: 'trucks_for_you_inc', label: 'Trucks For You Inc (Hayes)' }` to the `availableUsers` array so it can be selected from the feed UI going forward.

**2. Trigger the feed import via the existing edge function**

Call the `import-jobs-from-feed` edge function with:
- `feedUrl`: `https://cdljobcast.com/client/recruiting/getfeeds?user=trucks_for_you_inc&board=AIRecruiter`
- `organizationId`: `84214b48-7b51-45bc-ad7f-723bcf50466c` (Hayes)
- `clientId`: `cc4a05e9-2c87-4e71-b7f5-49d8bd709540` (Trucks For You Inc)

This will parse the XML feed, create job listings, and map them all to the Trucks For You Inc client.

**3. Verify import results**

Query the database to confirm jobs were imported and correctly mapped to the client.

### Files Modified

| File | Change |
|------|--------|
| `src/pages/SuperAdminFeeds.tsx` | Add `trucks_for_you_inc` to carrier dropdown |

