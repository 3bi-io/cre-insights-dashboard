
-- Drop the previous helper and recreate with proper permissions
DROP FUNCTION IF EXISTS public.exec_sql_void(text);

-- Create a dedicated function to alter the google indexing cron schedule
CREATE OR REPLACE FUNCTION public.alter_google_indexing_schedule(new_schedule text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'cron'
AS $$
BEGIN
  -- Only allow known safe schedules
  IF new_schedule NOT IN ('0 6 * * *', '0 6 * * 0,3') THEN
    RAISE EXCEPTION 'Invalid schedule: only daily or twice-weekly allowed';
  END IF;
  
  PERFORM cron.alter_job(17, schedule := new_schedule);
END;
$$;

REVOKE ALL ON FUNCTION public.alter_google_indexing_schedule(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.alter_google_indexing_schedule(text) TO service_role;
