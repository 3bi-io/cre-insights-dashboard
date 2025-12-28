-- Fix: Recreate application views with SECURITY INVOKER to respect RLS
-- These views currently bypass RLS on the applications table because they're owned by postgres

-- Step 1: Drop existing views that expose sensitive data without RLS
DROP VIEW IF EXISTS public.applications_sensitive CASCADE;
DROP VIEW IF EXISTS public.applications_contact CASCADE;
DROP VIEW IF EXISTS public.applications_basic CASCADE;

-- Step 2: Recreate applications_basic view with SECURITY INVOKER
-- This ensures the view respects RLS policies on the applications table
CREATE VIEW public.applications_basic
WITH (security_invoker = true)
AS SELECT 
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
FROM applications a;

-- Step 3: Recreate applications_contact view with SECURITY INVOKER
CREATE VIEW public.applications_contact
WITH (security_invoker = true)
AS SELECT 
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
FROM applications a;

-- Step 4: Recreate applications_sensitive view with SECURITY INVOKER
-- This is the most critical view containing SSN, DOB, felony info
CREATE VIEW public.applications_sensitive
WITH (security_invoker = true)
AS SELECT 
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
FROM applications a;

-- Step 5: Add comments explaining the security model
COMMENT ON VIEW public.applications_basic IS 'Basic application data view with SECURITY INVOKER - respects RLS on applications table';
COMMENT ON VIEW public.applications_contact IS 'Contact information view with SECURITY INVOKER - respects RLS on applications table';
COMMENT ON VIEW public.applications_sensitive IS 'HIGHLY SENSITIVE PII view (SSN, DOB, felony) with SECURITY INVOKER - respects RLS on applications table. Access requires proper authorization through applications table RLS policies.';

-- Step 6: Fix candidate_profiles to require authentication for recruiters_only profiles
-- Current policy allows viewing without proper auth check for recruiters_only
DROP POLICY IF EXISTS "Recruiters can view public candidate profiles" ON public.candidate_profiles;

-- Create separate policies for public and recruiters_only visibility
CREATE POLICY "Anyone authenticated can view public candidate profiles"
ON public.candidate_profiles FOR SELECT
USING (
  profile_visibility = 'public'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Recruiters can view recruiters_only profiles"
ON public.candidate_profiles FOR SELECT
USING (
  profile_visibility = 'recruiters_only'
  AND auth.uid() IS NOT NULL
  AND (
    -- User must be a recruiter or have recruiter-like role
    has_role(auth.uid(), 'admin'::app_role)
    OR has_role(auth.uid(), 'moderator'::app_role)
    OR EXISTS (
      SELECT 1 FROM recruiters r WHERE r.user_id = auth.uid()
    )
    OR is_super_admin(auth.uid())
  )
);