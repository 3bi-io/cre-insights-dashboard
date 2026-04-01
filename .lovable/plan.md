

## Plan: Update Meta Ad Account ID to 1686173129171496

### Problem
The CR England Meta Ad Account ID is changing from `1594827328159714` to `1686173129171496`. This ID is hardcoded in 3 locations and referenced in the alias system. All references need updating, plus a database migration to update existing records.

### Changes

#### 1. Database Migration
Update `account_id` across all Meta tables from `1594827328159714` to `1686173129171496`:
- `meta_ad_accounts`
- `meta_campaigns`
- `meta_ad_sets`
- `meta_ads`
- `meta_daily_spend`

(Same pattern as the previous migration `20250917011454`)

#### 2. `src/utils/metaAccountAlias.ts`
- Update alias mapping: `'897639563274136': '1686173129171496'`
- Update the hardcoded check on line 62 from `'1594827328159714'` to `'1686173129171496'`

#### 3. `supabase/functions/meta-leads-cron/index.ts`
- Update `CR_ENGLAND_ACCOUNT_ID` from `'1594827328159714'` to `'1686173129171496'`

#### 4. `src/components/platforms/MetaPlatformActions.tsx`
No code change needed — it derives the actual ID from `metaAccountAlias.ts` via `getActualAccountId()`.

### Files changed (2 code files + 1 migration)
- `src/utils/metaAccountAlias.ts` — update alias mapping and display name check
- `supabase/functions/meta-leads-cron/index.ts` — update hardcoded account ID
- New migration — update all `account_id` values in Meta tables

