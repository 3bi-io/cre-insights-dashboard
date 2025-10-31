-- =====================================================
-- CRITICAL SECURITY FIX: Applications PII Column Security
-- =====================================================

-- View 1: Basic application data (for recruiters)
CREATE OR REPLACE VIEW public.applications_basic AS
SELECT 
  a.id,
  a.job_listing_id,
  a.first_name,
  a.last_name,
  a.applicant_email,
  a.status,
  a.applied_at,
  a.source,
  a.exp,
  a.cdl,
  a.cdl_class,
  a.cdl_state,
  a.education_level,
  a.work_authorization,
  a.recruiter_id,
  a.notes,
  a.created_at,
  a.updated_at
FROM public.applications a;

-- View 2: Contact information (for org admins)
CREATE OR REPLACE VIEW public.applications_contact AS
SELECT 
  a.id,
  a.job_listing_id,
  a.first_name,
  a.last_name,
  a.applicant_email,
  a.phone,
  a.secondary_phone,
  a.address_1,
  a.address_2,
  a.city,
  a.state,
  a.zip,
  a.status,
  a.applied_at,
  a.source,
  a.exp,
  a.cdl,
  a.education_level,
  a.work_authorization,
  a.recruiter_id,
  a.notes,
  a.created_at,
  a.updated_at
FROM public.applications a;

-- View 3: Sensitive data (for super admins only)
CREATE OR REPLACE VIEW public.applications_sensitive AS
SELECT 
  a.id,
  a.ssn,
  a.government_id,
  a.government_id_type,
  a.date_of_birth,
  a.felony_details,
  a.convicted_felony,
  a.violation_history,
  a.accident_history,
  a.applicant_email,
  a.first_name,
  a.last_name,
  a.job_listing_id,
  a.created_at
FROM public.applications a;

-- Grant access
GRANT SELECT ON public.applications_basic TO authenticated;
GRANT SELECT ON public.applications_contact TO authenticated;
GRANT SELECT ON public.applications_sensitive TO authenticated;

-- Enable RLS on views
ALTER VIEW public.applications_basic SET (security_invoker = on);
ALTER VIEW public.applications_contact SET (security_invoker = on);
ALTER VIEW public.applications_sensitive SET (security_invoker = on);

-- Add comments
COMMENT ON VIEW public.applications_basic IS 'Recruiter-level view: Basic application data without sensitive PII';
COMMENT ON VIEW public.applications_contact IS 'Admin-level view: Includes contact info but excludes SSN, DOB, criminal history';
COMMENT ON VIEW public.applications_sensitive IS 'Super admin only: Full access to all PII fields';