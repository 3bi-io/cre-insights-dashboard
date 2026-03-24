-- Fix sms_verification_sessions: change the public policy to service_role only
DROP POLICY IF EXISTS "Service role full access" ON public.sms_verification_sessions;

CREATE POLICY "Service role full access to sms_verification_sessions"
  ON public.sms_verification_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow admins/super_admins to read sessions for debugging
CREATE POLICY "Admins can view sms_verification_sessions"
  ON public.sms_verification_sessions FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );