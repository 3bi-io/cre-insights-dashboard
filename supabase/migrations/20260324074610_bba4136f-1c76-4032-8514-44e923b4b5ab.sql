-- Fix 1: rate_limits - replace permissive authenticated policy with service_role only
DROP POLICY IF EXISTS "system_manage_rate_limits" ON public.rate_limits;

CREATE POLICY "service_role_manage_rate_limits"
  ON public.rate_limits FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);