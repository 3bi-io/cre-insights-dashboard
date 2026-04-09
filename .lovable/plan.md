

# Remove Job Listings for Hub Group, TMC, and Werner

## Summary
Delete all 302 job listings across three clients. Applications linked to these jobs will have their `job_listing_id` set to the orphan marker UUID by the existing `mark_orphaned_applications` trigger.

## Steps

1. **Disable Google indexing trigger** on `job_listings` to prevent transaction failures during bulk delete (per project memory on batch operations).
2. **Delete job listings** for the three client IDs.
3. **Re-enable the trigger** immediately after.

## SQL Migration

```sql
-- Disable indexing trigger to prevent failures during bulk delete
ALTER TABLE job_listings DISABLE TRIGGER trg_google_indexing_notify;

DELETE FROM job_listings 
WHERE client_id IN (
  '8ca3faca-b91c-4ab8-a9af-b145ab265228',  -- Hub Group
  'feb3479f-4116-42a5-bb6a-811406c1c99a',  -- Werner Enterprises
  '50657f4d-c47b-4104-a307-b82d5fa4a1df'   -- TMC Transportation
);

-- Re-enable trigger
ALTER TABLE job_listings ENABLE TRIGGER trg_google_indexing_notify;
```

## Side Effects
- The `mark_orphaned_applications` trigger will automatically update any linked applications to the orphan marker UUID.
- No code changes needed.

