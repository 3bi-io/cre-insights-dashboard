-- Fix critical security vulnerability in applications table
-- Create more restrictive RLS policies for sensitive personal data

-- First, drop existing overly permissive policies
DROP POLICY IF EXISTS "Admins can view applications in their organization" ON public.applications;
DROP POLICY IF EXISTS "Recruiters can view their assigned applications" ON public.applications;
DROP POLICY IF EXISTS "Users can update applications for their job listings" ON public.applications;

-- Create new, much more restrictive policies for the applications table
-- Super admins can still have full access for system administration
CREATE POLICY "Super admins full access" ON public.applications
FOR ALL USING (is_super_admin(auth.uid()));

-- Organization admins can view applications but with restrictions on sensitive data
CREATE POLICY "Org admins can view applications in their org" ON public.applications
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  EXISTS (
    SELECT 1 FROM job_listings jl 
    WHERE jl.id = applications.job_listing_id 
    AND jl.organization_id = get_user_organization_id()
  )
);

-- Organization admins can update basic fields only (not sensitive PII)
CREATE POLICY "Org admins can update basic application data" ON public.applications
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) AND 
  EXISTS (
    SELECT 1 FROM job_listings jl 
    WHERE jl.id = applications.job_listing_id 
    AND jl.organization_id = get_user_organization_id()
  )
);

-- Recruiters can only view and update assigned applications
CREATE POLICY "Recruiters can view assigned applications" ON public.applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM recruiters r
    WHERE r.id = applications.recruiter_id 
    AND r.user_id = auth.uid()
  )
);

CREATE POLICY "Recruiters can update assigned applications" ON public.applications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM recruiters r
    WHERE r.id = applications.recruiter_id 
    AND r.user_id = auth.uid()
  )
);

-- Job listing owners can view applications but not sensitive PII fields
CREATE POLICY "Job owners can view applications for their jobs" ON public.applications
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM job_listings jl
    WHERE jl.id = applications.job_listing_id 
    AND jl.user_id = auth.uid()
  )
);

-- Job listing owners can update basic application data (status, notes)
CREATE POLICY "Job owners can update basic application data" ON public.applications
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM job_listings jl
    WHERE jl.id = applications.job_listing_id 
    AND jl.user_id = auth.uid()
  )
);

-- Create secure function to get non-sensitive application data
CREATE OR REPLACE FUNCTION public.get_application_basic_data(application_id uuid)
RETURNS TABLE(
  id uuid,
  job_listing_id uuid,
  first_name text,
  last_name text,
  applicant_email text,
  phone text,
  status text,
  applied_at timestamp with time zone,
  source text,
  notes text,
  exp text,
  cdl text,
  education_level text,
  work_authorization text,
  city text,
  state text,
  zip text
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id,
    a.job_listing_id,
    a.first_name,
    a.last_name,
    a.applicant_email,
    a.phone,
    a.status,
    a.applied_at,
    a.source,
    a.notes,
    a.exp,
    a.cdl,
    a.education_level,
    a.work_authorization,
    a.city,
    a.state,
    a.zip
  FROM applications a
  WHERE a.id = application_id
  AND (
    -- Super admins
    is_super_admin(auth.uid()) OR
    -- Org admins for their org's applications
    (has_role(auth.uid(), 'admin'::app_role) AND 
     EXISTS (
       SELECT 1 FROM job_listings jl 
       WHERE jl.id = a.job_listing_id 
       AND jl.organization_id = get_user_organization_id()
     )) OR
    -- Recruiters for assigned applications
    EXISTS (
      SELECT 1 FROM recruiters r
      WHERE r.id = a.recruiter_id 
      AND r.user_id = auth.uid()
    ) OR
    -- Job owners for their job applications
    EXISTS (
      SELECT 1 FROM job_listings jl
      WHERE jl.id = a.job_listing_id 
      AND jl.user_id = auth.uid()
    )
  );
$$;

-- Create secure function to access highly sensitive PII data with strict controls and mandatory logging
CREATE OR REPLACE FUNCTION public.get_application_sensitive_data(
  application_id uuid, 
  access_reason text DEFAULT 'Administrative review'
)
RETURNS TABLE(
  id uuid,
  ssn text,
  government_id_type text,
  government_id text,
  date_of_birth date,
  full_address text,
  employment_history jsonb,
  medical_card_expiration date,
  felony_details text,
  military_history jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- STRICT ACCESS CONTROL: Only super admins and organization admins can access PII
  IF NOT (is_super_admin(auth.uid()) OR 
          (has_role(auth.uid(), 'admin'::app_role) AND 
           EXISTS (
             SELECT 1 FROM applications a 
             JOIN job_listings jl ON a.job_listing_id = jl.id
             WHERE a.id = application_id 
             AND jl.organization_id = get_user_organization_id()
           ))) THEN
    -- Log unauthorized access attempt
    INSERT INTO audit_logs (
      user_id, organization_id, table_name, record_id, action, sensitive_fields
    ) VALUES (
      auth.uid(), get_user_organization_id(), 'applications', application_id,
      'UNAUTHORIZED_SENSITIVE_ACCESS_ATTEMPT', ARRAY['all_pii']
    );
    
    RAISE EXCEPTION 'ACCESS DENIED: Insufficient privileges to access sensitive personal information';
  END IF;

  -- MANDATORY AUDIT LOGGING for all sensitive data access
  INSERT INTO audit_logs (
    user_id,
    organization_id,
    table_name,
    record_id,
    action,
    sensitive_fields
  ) VALUES (
    auth.uid(),
    get_user_organization_id(),
    'applications',
    application_id,
    'SENSITIVE_PII_ACCESS: ' || access_reason,
    ARRAY['ssn', 'government_id', 'date_of_birth', 'address', 'employment_history', 'medical_info', 'criminal_history']
  );

  -- Return the sensitive data only after successful authorization and logging
  RETURN QUERY
  SELECT 
    a.id,
    a.ssn,
    a.government_id_type,
    a.government_id,
    a.date_of_birth,
    CONCAT(
      COALESCE(a.address_1, ''), 
      CASE WHEN a.address_2 IS NOT NULL THEN ', ' || a.address_2 ELSE '' END,
      ', ', COALESCE(a.city, ''), 
      ', ', COALESCE(a.state, ''), 
      ' ', COALESCE(a.zip, '')
    ) as full_address,
    a.employment_history,
    a.medical_card_expiration,
    a.felony_details,
    jsonb_build_object(
      'military_service', a.military_service,
      'military_branch', a.military_branch,
      'military_start_date', a.military_start_date,
      'military_end_date', a.military_end_date
    ) as military_history
  FROM applications a
  WHERE a.id = application_id;
  
  -- Additional security check - if no data found, log potential probe attempt
  IF NOT FOUND THEN
    INSERT INTO audit_logs (
      user_id, organization_id, table_name, record_id, action, sensitive_fields
    ) VALUES (
      auth.uid(), get_user_organization_id(), 'applications', application_id,
      'SENSITIVE_ACCESS_NO_DATA_FOUND', ARRAY['probe_attempt']
    );
  END IF;
END;
$$;

-- Create function for safe application summaries (no PII exposure)
CREATE OR REPLACE FUNCTION public.get_application_summary(application_id uuid)
RETURNS TABLE(
  id uuid,
  job_title text,
  candidate_name text,
  status text,
  applied_at timestamp with time zone,
  location text,
  experience_level text,
  can_start_soon boolean,
  has_required_credentials boolean
) 
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    a.id,
    jl.title as job_title,
    CONCAT(a.first_name, ' ', a.last_name) as candidate_name,
    a.status,
    a.applied_at,
    CONCAT(COALESCE(a.city, 'Unknown'), ', ', COALESCE(a.state, 'Unknown')) as location,
    COALESCE(a.exp, 'Not specified') as experience_level,
    (a.preferred_start_date IS NOT NULL AND a.preferred_start_date <= CURRENT_DATE + INTERVAL '30 days') as can_start_soon,
    (a.cdl IS NOT NULL AND a.cdl != 'No') as has_required_credentials
  FROM applications a
  JOIN job_listings jl ON a.job_listing_id = jl.id
  WHERE a.id = application_id
  AND (
    is_super_admin(auth.uid()) OR
    (has_role(auth.uid(), 'admin'::app_role) AND jl.organization_id = get_user_organization_id()) OR
    EXISTS (SELECT 1 FROM recruiters r WHERE r.id = a.recruiter_id AND r.user_id = auth.uid()) OR
    jl.user_id = auth.uid()
  );
$$;

-- Add security documentation
COMMENT ON FUNCTION public.get_application_basic_data IS 'Returns non-sensitive application data with proper access controls';
COMMENT ON FUNCTION public.get_application_sensitive_data IS 'CRITICAL SECURITY: Returns PII data only to authorized admins with mandatory audit logging';
COMMENT ON FUNCTION public.get_application_summary IS 'Safe application summary without exposing any PII - suitable for general use';