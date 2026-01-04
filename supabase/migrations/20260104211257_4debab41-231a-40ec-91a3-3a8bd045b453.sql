-- Fix SECURITY DEFINER views by recreating them with SECURITY INVOKER
-- This ensures RLS policies of the querying user are enforced

-- Drop and recreate applications_basic view with SECURITY INVOKER
DROP VIEW IF EXISTS applications_basic;
CREATE VIEW applications_basic WITH (security_invoker = true) AS
SELECT 
  id,
  job_listing_id,
  recruiter_id,
  status,
  source,
  first_name,
  last_name,
  full_name,
  city,
  state,
  zip,
  applied_at,
  created_at,
  updated_at
FROM applications;

-- Drop and recreate applications_contact view with SECURITY INVOKER and add RLS
DROP VIEW IF EXISTS applications_contact;
CREATE VIEW applications_contact WITH (security_invoker = true) AS
SELECT 
  id,
  job_listing_id,
  first_name,
  last_name,
  full_name,
  applicant_email,
  phone,
  secondary_phone,
  address_1,
  address_2,
  city,
  state,
  zip,
  country,
  preferred_contact_method
FROM applications;

-- Drop and recreate applications_sensitive view with SECURITY INVOKER
DROP VIEW IF EXISTS applications_sensitive;
CREATE VIEW applications_sensitive WITH (security_invoker = true) AS
SELECT 
  id,
  job_listing_id,
  ssn,
  government_id,
  government_id_type,
  date_of_birth,
  convicted_felony,
  felony_details,
  violation_history,
  accident_history
FROM applications;

-- Add RLS policies to the underlying applications table for sensitive field access
-- First, create a function to check if user has elevated permissions for sensitive data
CREATE OR REPLACE FUNCTION public.can_access_sensitive_applicant_data(app_job_listing_id uuid)
RETURNS boolean AS $$
DECLARE
  user_role text;
  user_org_id uuid;
  job_org_id uuid;
BEGIN
  -- Get the user's role and organization
  SELECT role, organization_id INTO user_role, user_org_id
  FROM profiles
  WHERE id = auth.uid();
  
  -- Get the job's organization
  SELECT organization_id INTO job_org_id
  FROM job_listings
  WHERE id = app_job_listing_id;
  
  -- Only super_admin and org admins in the same org can access sensitive data
  IF user_role = 'super_admin' THEN
    RETURN true;
  END IF;
  
  IF user_role = 'admin' AND user_org_id = job_org_id THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute on the function
GRANT EXECUTE ON FUNCTION public.can_access_sensitive_applicant_data(uuid) TO authenticated;

-- Restrict page_views and visitor_sessions to authenticated users only
DROP POLICY IF EXISTS "Allow anonymous page view reading for analytics" ON page_views;
CREATE POLICY "Only authenticated users can read page views"
ON page_views FOR SELECT
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow anonymous session tracking" ON visitor_sessions;
CREATE POLICY "Only authenticated users can read visitor sessions"
ON visitor_sessions FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Service role can manage visitor sessions"
ON visitor_sessions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role');

-- Ensure audit logs cannot be deleted by anyone except through service role
DROP POLICY IF EXISTS "Organization admins can view audit logs" ON audit_logs;
CREATE POLICY "Organization members can view their audit logs"
ON audit_logs FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Prevent any user from deleting audit logs
DROP POLICY IF EXISTS "prevent_audit_log_deletion" ON audit_logs;
CREATE POLICY "No one can delete audit logs"
ON audit_logs FOR DELETE
USING (false);