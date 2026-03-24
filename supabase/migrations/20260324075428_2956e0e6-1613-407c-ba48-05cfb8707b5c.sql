-- Fix sms_magic_links: replace public role policies with service_role only
DROP POLICY IF EXISTS "System can create SMS magic links" ON public.sms_magic_links;
DROP POLICY IF EXISTS "System can delete SMS magic links" ON public.sms_magic_links;
DROP POLICY IF EXISTS "System can update SMS magic links" ON public.sms_magic_links;
DROP POLICY IF EXISTS "Users can view their own SMS magic links" ON public.sms_magic_links;

-- Service role full access (edge functions)
CREATE POLICY "Service role full access to sms_magic_links"
  ON public.sms_magic_links FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Authenticated users can only read their own links
CREATE POLICY "Users can view own sms_magic_links"
  ON public.sms_magic_links FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can read all for debugging
CREATE POLICY "Admins can view all sms_magic_links"
  ON public.sms_magic_links FOR SELECT
  TO authenticated
  USING (
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'super_admin'::app_role)
  );