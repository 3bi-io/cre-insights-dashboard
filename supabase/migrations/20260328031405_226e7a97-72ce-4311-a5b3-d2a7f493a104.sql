
-- Create a helper function that the edge function can call via RPC to alter the cron schedule
CREATE OR REPLACE FUNCTION public.exec_sql_void(query text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'cron'
AS $$
BEGIN
  -- Only allow cron.alter_job calls for safety
  IF query NOT LIKE 'SELECT cron.alter_job%' THEN
    RAISE EXCEPTION 'Only cron.alter_job calls are allowed';
  END IF;
  EXECUTE query;
END;
$$;

-- Revoke public access, only authenticated service role should call this
REVOKE ALL ON FUNCTION public.exec_sql_void(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.exec_sql_void(text) TO service_role;
