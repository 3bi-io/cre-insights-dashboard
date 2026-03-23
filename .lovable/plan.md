

# Remove Job Listing

## Job to Remove
- **ID**: `61ec0129-ab4d-4f2d-b6a7-53805a1ff00a`
- **Title**: Non-CDL Delivery Driver - Cedar Rapids, IA
- **Status**: active

## Steps

### 1. Delete the job listing from the database
Execute a DELETE statement against the `job_listings` table. The existing `mark_orphaned_applications` trigger will automatically reassign any linked applications to the orphan placeholder ID before the row is removed.

```sql
DELETE FROM job_listings WHERE id = '61ec0129-ab4d-4f2d-b6a7-53805a1ff00a';
```

### 2. Clean up related records
Check and remove any `campaign_job_assignments` referencing this job listing to avoid orphaned assignment records.

```sql
DELETE FROM campaign_job_assignments WHERE job_listing_id = '61ec0129-ab4d-4f2d-b6a7-53805a1ff00a';
```

No code changes required — this is a data-only operation.

