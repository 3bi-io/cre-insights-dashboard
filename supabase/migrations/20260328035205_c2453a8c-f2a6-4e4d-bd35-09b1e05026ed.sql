
-- Function to renew stale feed dates every 24 days
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

-- Schedule daily at 4:00 AM UTC
SELECT cron.schedule(
  'renew-job-feed-dates',
  '0 4 * * *',
  $$ SELECT public.renew_job_feed_dates(); $$
);
