
# Clean Up General Application Fallback Jobs

## The Problem

The application processor has been creating a new "General Application" fallback job listing every time an incoming application can't be matched to a specific job. This has resulted in **216 duplicate listings** across Hayes Recruiting's clients.

## What Will Be Done

### Step 1: Delete 178 empty General Application listings

These have zero applications linked to them and serve no purpose. They will be deleted outright.

### Step 2: Consolidate the remaining 38

For each client, we will:
1. Keep the **oldest** General Application listing as the single designated fallback
2. Reassign all applications from the other General Application listings to the kept one
3. Delete the now-empty duplicate listings

### Per-Client Plan

| Client | Keep | Reassign Apps From | Delete |
|---|---|---|---|
| Pemberton | 1 listing | 18 listings (19 apps) | 121 listings |
| Danny Herman | 1 listing | 16 listings (17 apps) | 66 listings |
| Day and Ross | 1 listing | 0 listings | 18 listings |
| Novco | 0 (all empty) | -- | 5 listings |
| Unassigned | 0 (all empty) | -- | 2 listings |
| James Burg | 1 listing (already just 1) | -- | 0 listings |

### Final Result

- **4 General Application listings remain** (one each for Pemberton, Danny Herman, Day and Ross, James Burg)
- **212 duplicate listings removed**
- All 38 linked applications preserved and reassigned

## Technical Details

This will be executed as SQL data operations (not schema migrations):

1. For each client with applications: identify the oldest General Application listing ID to keep
2. `UPDATE applications SET job_listing_id = [kept_id] WHERE job_listing_id IN ([other_ids])`
3. `DELETE FROM job_listings WHERE id IN ([all_empty_and_reassigned_ids])`

No schema changes are needed. No code changes are needed. The application processor's existing logic will continue to use the surviving fallback listing going forward.
