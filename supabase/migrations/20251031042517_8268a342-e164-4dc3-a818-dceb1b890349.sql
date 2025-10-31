-- =====================================================
-- CRITICAL SECURITY FIX: Audit Logs Immutability
-- =====================================================

-- Create trigger function to prevent any modifications to audit logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_changes()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable and cannot be modified. Attempted modification by user: %', auth.uid();
  RETURN NULL;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_audit_updates ON public.audit_logs;

-- Create trigger to prevent updates on audit logs
CREATE TRIGGER prevent_audit_updates
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW 
  EXECUTE FUNCTION public.prevent_audit_log_changes();

-- Add comment
COMMENT ON TABLE public.audit_logs IS 
'Immutable audit log table. Updates prevented by trigger. Deletes require super_admin role.';

-- Verify existing RLS policies
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' 
    AND policyname = 'Admins can view audit logs'
  ) THEN
    CREATE POLICY "Admins can view audit logs"
    ON audit_logs FOR SELECT
    USING (
      is_super_admin(auth.uid()) OR 
      (has_role(auth.uid(), 'admin'::app_role) AND organization_id = get_user_organization_id())
    );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' 
    AND policyname = 'Authenticated users can insert audit logs'
  ) THEN
    CREATE POLICY "Authenticated users can insert audit logs"
    ON audit_logs FOR INSERT
    WITH CHECK (user_id = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' 
    AND policyname = 'No one can update audit logs'
  ) THEN
    CREATE POLICY "No one can update audit logs"
    ON audit_logs FOR UPDATE
    USING (false);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'audit_logs' 
    AND policyname = 'Only super admins can delete audit logs'
  ) THEN
    CREATE POLICY "Only super admins can delete audit logs"
    ON audit_logs FOR DELETE
    USING (is_super_admin(auth.uid()));
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_sensitive_fields ON public.audit_logs USING GIN(sensitive_fields);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);