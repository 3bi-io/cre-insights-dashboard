

# Create Zip-Level Job Listings for Werner, Hub Group, and TMC

## Summary
Resolve each target zip code to its city/state, then insert one job listing per zip for each client — cloned from the parent national listing.

## File → Client Mapping (confirmed)
| File | Client | Parent Job ID | Zips |
|------|--------|---------------|------|
| `4802-targets.csv` | Werner Enterprises | `861bce97-7740-4207-bd4e-bffa16352699` | 100 |
| `6023-targets.csv` | Hub Group | `923781c4-57f3-4e88-919d-34ed641d5aa8` | 89 |
| `7891-targets.csv` | TMC Transportation | `3212c229-c1f6-42aa-8ae5-6350c562c09f` | 110 |

**Total: 299 new listings**

## Approach
Run a one-time Python script that:

1. **Reads** all 3 CSV files
2. **Resolves** each zip code to city + state via the Zippopotam.us API (with rate limiting)
3. **Fetches** the parent job's metadata (salary, category, org, etc.) from the database
4. **Inserts** one `job_listings` row per zip, with:
   - `title`: `"{Parent Title} | {City}, {State}"` (e.g., "CDL-A Flatbed Drivers | Atlanta, GA")
   - `city` / `state` / `location`: resolved from zip
   - All other fields (salary, client_id, org_id, category_id, status, apply_url, etc.) cloned from parent
5. **Reports** success count and any failed zip lookups

## No schema changes needed
The `job_listings` table already has all required columns. This is purely a data insert operation.

