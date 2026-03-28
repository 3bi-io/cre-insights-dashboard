

# Job Posting Date Renewal (Every 24 Days)

## Goal
Automatically refresh the `feed_date` column on all active job listings every 24 days so syndication platforms treat them as fresh postings, improving visibility and ranking.

## Changes

### 1. Database Migration — Add `pg_cron` job for date renewal
Create a scheduled SQL function that runs daily and updates `feed_date` to `NOW()` for any active, non-hidden job where `feed_date` is NULL or older than 24 days.

```sql
-- Function to renew stale feed dates
CREATE OR REPLACE FUNCTION public.renew_job_feed_dates()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  UPDATE job_listings
  SET feed_date = NOW(),
      updated_at = NOW()
  WHERE status = 'active'
    AND (is_hidden = false OR is_hidden IS NULL)
    AND (feed_date IS NULL OR feed_date < NOW() - INTERVAL '24 days');

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;
```

Schedule via `pg_cron` (daily at 4:00 AM UTC, just before the weekly syndication push):

```sql
SELECT cron.schedule(
  'renew-job-feed-dates',
  '0 4 * * *',
  $$ SELECT public.renew_job_feed_dates(); $$
);
```

### 2. Update `universal-xml-feed` — Use `feed_date` over `created_at`
In `supabase/functions/universal-xml-feed/index.ts`, change all instances of:
- `new Date(job.created_at).toISOString().split('T')[0]` → `new Date(job.feed_date || job.created_at).toISOString().split('T')[0]`
- `new Date(job.created_at).toISOString()` → `new Date(job.feed_date || job.created_at).toISOString()`

This ensures feeds emit the refreshed date when available, falling back to `created_at` for jobs that haven't been renewed yet.

### 3. Add `feed_date` to the query select
Ensure the universal-xml-feed query includes `feed_date` in its SELECT columns so it's available for the XML templates.

## How It Works
- The cron job runs **daily at 4 AM UTC**
- It finds all active jobs where `feed_date` is null or 24+ days old
- It stamps them with today's date
- The next time any platform crawls the XML feed, they see a fresh posting date
- The existing weekly `syndication-push` at 5 AM Sunday ensures all platforms actively pull the refreshed feeds

## Files Changed
- **Migration SQL**: `renew_job_feed_dates()` function + `pg_cron` schedule
- **`supabase/functions/universal-xml-feed/index.ts`**: Use `feed_date` as primary date source in XML output

