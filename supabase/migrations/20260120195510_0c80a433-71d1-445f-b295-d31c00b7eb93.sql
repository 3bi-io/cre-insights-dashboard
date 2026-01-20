-- Fix profiles table exposure: Restrict visibility to own profile + admins only
-- Currently "Users can view profiles in their org" allows any org member to see all profiles

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view profiles in their org" ON public.profiles;

-- Create stricter policy: Users can only view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Add audit logging for sensitive application field access
-- Create audit table for PII access tracking
CREATE TABLE IF NOT EXISTS public.pii_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  fields_accessed text[] NOT NULL,
  access_reason text,
  ip_address inet,
  accessed_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on audit logs
ALTER TABLE public.pii_access_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Super admins can view PII access logs"
ON public.pii_access_logs
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- System can insert audit logs
CREATE POLICY "System can insert PII access logs"
ON public.pii_access_logs
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX idx_pii_access_logs_user_id ON public.pii_access_logs(user_id);
CREATE INDEX idx_pii_access_logs_accessed_at ON public.pii_access_logs(accessed_at);

-- Add comment for documentation
COMMENT ON TABLE public.pii_access_logs IS 'Tracks access to sensitive PII fields in applications table for security auditing';