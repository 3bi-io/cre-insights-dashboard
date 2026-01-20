-- MIGRATION 3: Fix SECURITY DEFINER views with security_invoker

-- Drop and recreate application views with security_invoker=on
DROP VIEW IF EXISTS public.applications_basic CASCADE;
DROP VIEW IF EXISTS public.applications_contact CASCADE;
DROP VIEW IF EXISTS public.applications_sensitive CASCADE;

-- Recreate applications_basic with security_invoker
CREATE VIEW public.applications_basic 
WITH (security_invoker = on) AS
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

COMMENT ON VIEW public.applications_basic IS 'Basic application info - excludes PII. Uses security_invoker to enforce RLS of the querying user.';

-- Recreate applications_contact with security_invoker
CREATE VIEW public.applications_contact 
WITH (security_invoker = on) AS
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

COMMENT ON VIEW public.applications_contact IS 'Application contact info - contains PII. Uses security_invoker to enforce RLS of the querying user.';

-- Recreate applications_sensitive with security_invoker
CREATE VIEW public.applications_sensitive 
WITH (security_invoker = on) AS
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

COMMENT ON VIEW public.applications_sensitive IS 'Sensitive application data - SSN, DOB, background. Uses security_invoker to enforce RLS of the querying user. Access logged via PII audit system.';

-- Grant access to these views (RLS on base table will still apply)
GRANT SELECT ON public.applications_basic TO authenticated;
GRANT SELECT ON public.applications_contact TO authenticated;
GRANT SELECT ON public.applications_sensitive TO authenticated;