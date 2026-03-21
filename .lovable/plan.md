

# Generate R.E. Garrison State-Level Job Listings

## Overview
Expand the 4 existing R.E. Garrison listings into 103 total by creating state-specific variants. Each new listing clones the parent job's compensation details but targets a specific state/metro area for search visibility.

## Expansion Breakdown

### Job 1: Solo Owner Operator - OTR Lease Purchase → 35 listings
One per OTR state. Title format: "Solo Owner Operator - OTR Lease Purchase | {State}"
- States: AZ, UT, CO, NM, TX, OK, AR, LA, MS, AL, TN, KY, GA, FL, SC, NC, VA, WV, OH, IN, IL, MO, KS, NE, IA, SD, MN, WI, MI, PA, NY, CT, NJ, DE, MD

### Job 2: Solo Owner Operator - Regional Lease Purchase → 15 listings
One per unique regional state (SE + Central deduplicated). Title: "Solo Owner Operator - Regional Lease Purchase | {State}"
- States: TX, AR, LA, MS, AL, TN, KY, GA, SC, NC, VA, FL, OK, KS, NE, IA, MN, WI, IL, MO (20 unique)

### Job 3: Team Owner Operators - OTR → 18 listings
Top trucking volume states only. Title: "Team Owner Operators - OTR | {State}"
- States: TX, GA, FL, TN, IL, OH, IN, PA, NC, VA, MO, AL, KY, MS, AR, LA, OK, NJ

### Job 4: Owner Operator - BYOT Reefer → 20 listings
Primary reefer corridor states. Title: "Owner Operator - BYOT Reefer | {State}"
- States: TX, FL, GA, AZ, CO, CA (not in OTR but reefer relevant — skip if not covered), AL, MS, LA, AR, TN, KY, NC, SC, VA, PA, NY, OH, IN, IL

**Total new listings: ~89** (35 + 20 + 18 + 20 - 4 existing = 89 new)

## Execution

### Step 1: Query existing 4 job listings
Read the full `job_summary` from each parent listing to use as the template content.

### Step 2: Generate INSERT statements
For each expansion, create an INSERT into `job_listings` with:
- `title`: Parent title + " | {State Full Name}"
- `job_summary`: Parent summary (unchanged — already contains full comp details)
- `location`: "{Major Metro}, {State}" (e.g., "Dallas, TX", "Atlanta, GA")
- `salary_min`, `salary_max`, `salary_type`: Copied from parent
- `job_type`: OTR or Regional (from parent)
- `experience_level`: mid
- `status`: active
- `client_id`: `be8b645e-d480-4c22-8e75-b09a7fc1db7a`
- `organization_id`: `84214b48-7b51-45bc-ad7f-723bcf50466c`
- `category_id`: `61bd5f79-b3c1-4804-a6a0-d568773c3d84`
- `user_id`: `5761e7e0-1bdf-43b1-ba5f-19a24f9d025e`

### Step 3: Execute via Supabase insert tool
Batch the INSERTs (the insert tool supports data operations). Will execute in chunks to stay within limits.

### Step 4: Verify counts
Query `job_listings` filtered by `client_id` to confirm the expected ~93 total listings.

## Technical Notes
- Uses the Supabase insert/analytics tool for data operations (not migrations)
- Each state gets a primary metro city for the location field (e.g., TX→Dallas, GA→Atlanta, FL→Jacksonville, IL→Chicago)
- The 4 original listings remain unchanged as the "national" versions
- No schema changes needed

