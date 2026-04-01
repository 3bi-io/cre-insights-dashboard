

## Plan: Title Standardization, State Normalization, and Junk Cleanup

### What we're fixing

1. **Raw feed titles** -- All 14 active R.E. Garrison feed-synced jobs have titles like `Job 14558J14549` instead of the canonical format: `CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check! | {State}`
2. **Inconsistent state values** -- Some records use full names (`New York`, `Totam perspiciatis`) instead of 2-letter abbreviations (`NY`, `TX`)
3. **8 junk test records** -- 5 "Mick Foley" and 3 "test data" applications need deletion

---

### Changes

#### 1. Add title standardization and state normalization to `sync-cdl-feeds/index.ts`

- Add a **client title template map** at the top of the file, keyed by clientId:
  ```
  'be8b645e-...' => 'CDL-A Drivers: Top Tier Lease Purchase Program! $0 Down, No Credit Check!'
  ```
- Add a **US state abbreviation lookup** (full name to 2-letter code)
- In `syncClientFeed`, after building `jobData`:
  - Normalize `state` through the lookup (e.g. `New York` → `NY`, already-abbreviated values pass through)
  - If a title template exists for this client, replace the raw feed title with `{template} | {StateName}` (using the full state name for the suffix, matching the existing canonical pattern like `| Alabama`, `| New York`)
  - Rebuild `location` from normalized city + state
- This runs on every sync, so existing raw-titled jobs get corrected on the next cycle

#### 2. Migration: Clean up junk records and fix existing data

A single SQL migration that:

- **Deletes 8 junk application records** by their known IDs (5 Mick Foley + 3 test data)
- **Updates the 14 active feed-synced R.E. Garrison job listings** to use canonical titles and normalized state abbreviations
- **Fixes the one job listing** with state `Totam perspiciatis` (deactivate it as junk)

#### 3. Files changed

- `supabase/functions/sync-cdl-feeds/index.ts` -- add title template map, state normalization function, apply both during job processing
- New migration SQL -- one-time cleanup of junk records and existing data correction

### Technical details

- The state normalizer will be a simple object map (`{ 'alabama': 'AL', ... }`) plus a check for already-valid 2-letter codes
- Title templates are per-client so other clients (Pemberton, Danny Herman, etc.) can have their own canonical format added later without code changes
- The `| {State}` suffix uses the **full state name** (matching the existing canonical pattern visible in the DB: `| Alabama`, `| New York`, etc.)

