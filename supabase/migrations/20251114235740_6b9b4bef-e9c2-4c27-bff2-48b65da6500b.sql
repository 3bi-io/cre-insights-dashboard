-- =====================================================
-- COMPREHENSIVE PII AUDIT LOGGING SYSTEM
-- =====================================================
-- This migration creates RPC functions that enforce mandatory
-- audit logging for ALL access to sensitive PII data.
-- Every PII access must include a business justification.
-- =====================================================

-- =====================================================
-- 1. Enhanced Application List Function with Audit Logging
-- =====================================================
CREATE OR REPLACE FUNCTION get_applications_list_with_audit(
  filters JSONB DEFAULT '{}'::JSONB,
  access_reason TEXT DEFAULT 'Application list review'
)
RETURNS TABLE(
  id UUID,
  job_listing_id UUID,
  first_name TEXT,
  last_name TEXT,
  applicant_email TEXT,
  phone TEXT,
  status TEXT,
  applied_at TIMESTAMPTZ,
  source TEXT,
  notes TEXT,
  exp TEXT,
  cdl TEXT,
  education_level TEXT,
  work_authorization TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  job_title TEXT,
  job_location TEXT,
  total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_job_id UUID;
  v_status TEXT;
  v_city TEXT;
  v_state TEXT;
  v_search TEXT;
  v_limit INT;
  v_offset INT;
BEGIN
  -- Access control: Only authenticated users with proper role
  IF NOT (
    is_super_admin(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role)
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to access application data';
  END IF;

  -- Log the list access (non-PII access to list)
  INSERT INTO audit_logs (
    user_id,
    organization_id,
    table_name,
    action,
    sensitive_fields
  ) VALUES (
    auth.uid(),
    get_user_organization_id(),
    'applications',
    'LIST_ACCESS: ' || access_reason,
    ARRAY['list_view']
  );

  -- Extract filter parameters
  v_job_id := (filters->>'job_id')::UUID;
  v_status := filters->>'status';
  v_city := filters->>'city';
  v_state := filters->>'state';
  v_search := filters->>'search';
  v_limit := COALESCE((filters->>'limit')::INT, 200);
  v_offset := COALESCE((filters->>'offset')::INT, 0);

  -- Return filtered application list (basic data only)
  RETURN QUERY
  WITH filtered_apps AS (
    SELECT 
      a.id, a.job_listing_id, a.first_name, a.last_name,
      a.applicant_email, a.phone, a.status, a.applied_at,
      a.source, a.notes, a.exp, a.cdl, a.education_level,
      a.work_authorization, a.city, a.state, a.zip,
      a.created_at, a.updated_at,
      jl.title as job_title,
      jl.location as job_location
    FROM applications a
    JOIN job_listings jl ON a.job_listing_id = jl.id
    WHERE 
      (v_job_id IS NULL OR a.job_listing_id = v_job_id) AND
      (v_status IS NULL OR a.status = v_status) AND
      (v_city IS NULL OR a.city ILIKE '%' || v_city || '%') AND
      (v_state IS NULL OR a.state = v_state) AND
      (v_search IS NULL OR 
        a.first_name ILIKE '%' || v_search || '%' OR
        a.last_name ILIKE '%' || v_search || '%' OR
        a.applicant_email ILIKE '%' || v_search || '%'
      ) AND
      (
        is_super_admin(auth.uid()) OR
        (has_role(auth.uid(), 'admin'::app_role) AND jl.organization_id = get_user_organization_id()) OR
        jl.user_id = auth.uid()
      )
    ORDER BY a.applied_at DESC
    LIMIT v_limit
    OFFSET v_offset
  ),
  total AS (
    SELECT COUNT(*) as count
    FROM applications a
    JOIN job_listings jl ON a.job_listing_id = jl.id
    WHERE 
      (v_job_id IS NULL OR a.job_listing_id = v_job_id) AND
      (v_status IS NULL OR a.status = v_status) AND
      (v_city IS NULL OR a.city ILIKE '%' || v_city || '%') AND
      (v_state IS NULL OR a.state = v_state) AND
      (
        is_super_admin(auth.uid()) OR
        (has_role(auth.uid(), 'admin'::app_role) AND jl.organization_id = get_user_organization_id()) OR
        jl.user_id = auth.uid()
      )
  )
  SELECT 
    fa.*,
    t.count as total_count
  FROM filtered_apps fa, total t;
END;
$$;

-- =====================================================
-- 2. Get Full Application with Optional PII (Audited)
-- =====================================================
CREATE OR REPLACE FUNCTION get_application_with_audit(
  application_id UUID,
  access_reason TEXT DEFAULT 'Application review',
  include_pii BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_pii_data JSONB;
BEGIN
  -- Access control check
  IF NOT (
    is_super_admin(auth.uid()) OR
    (has_role(auth.uid(), 'admin'::app_role) AND 
     EXISTS (
       SELECT 1 FROM applications a 
       JOIN job_listings jl ON a.job_listing_id = jl.id
       WHERE a.id = application_id 
       AND jl.organization_id = get_user_organization_id()
     )) OR
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_listings jl ON a.job_listing_id = jl.id
      WHERE a.id = application_id AND jl.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to access this application';
  END IF;

  -- Get basic application data (non-PII)
  SELECT to_jsonb(sub) INTO v_result
  FROM (
    SELECT 
      a.id, a.job_listing_id, a.first_name, a.last_name,
      a.applicant_email, a.phone, a.status, a.applied_at,
      a.source, a.notes, a.exp, a.cdl, a.education_level,
      a.work_authorization, a.city, a.state, a.zip,
      a.address_1, a.address_2, a.country,
      a.driving_experience_years, a.cdl_class, a.cdl_endorsements,
      a.preferred_start_date, a.emergency_contact_name,
      a.emergency_contact_phone, a.created_at, a.updated_at
    FROM applications a
    WHERE a.id = application_id
  ) sub;

  -- If PII is NOT requested, log basic access and return
  IF NOT include_pii THEN
    INSERT INTO audit_logs (
      user_id, organization_id, table_name, record_id, action, sensitive_fields
    ) VALUES (
      auth.uid(), get_user_organization_id(), 'applications', application_id,
      'BASIC_ACCESS: ' || access_reason, ARRAY['non_pii_fields']
    );
    
    RETURN v_result;
  END IF;

  -- PII ACCESS - Additional authorization check
  IF NOT (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'ACCESS DENIED: Insufficient privileges to access PII';
  END IF;

  -- MANDATORY AUDIT LOGGING for PII access
  INSERT INTO audit_logs (
    user_id, organization_id, table_name, record_id, action, sensitive_fields
  ) VALUES (
    auth.uid(), get_user_organization_id(), 'applications', application_id,
    'PII_ACCESS: ' || access_reason,
    ARRAY['ssn', 'date_of_birth', 'government_id', 'convicted_felony', 
          'felony_details', 'medical_card_expiration', 'employment_history']
  );

  -- Add PII fields to result
  SELECT to_jsonb(sub) INTO v_pii_data
  FROM (
    SELECT 
      a.ssn,
      a.date_of_birth,
      a.government_id_type,
      a.government_id,
      a.convicted_felony,
      a.felony_details,
      a.medical_card_expiration,
      a.employment_history,
      a.accident_history,
      a.violation_history,
      a.military_service,
      a.military_branch,
      a.military_start_date,
      a.military_end_date
    FROM applications a
    WHERE a.id = application_id
  ) sub;

  -- Merge PII data into result
  v_result := v_result || v_pii_data;

  RETURN v_result;
END;
$$;

-- =====================================================
-- 3. Create Application with Audit Logging
-- =====================================================
CREATE OR REPLACE FUNCTION create_application_with_audit(
  application_data JSONB,
  created_by_reason TEXT DEFAULT 'Application submission'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id UUID;
  v_result JSONB;
  v_has_pii BOOLEAN;
BEGIN
  -- Check if PII fields are included
  v_has_pii := (
    application_data ? 'ssn' OR 
    application_data ? 'date_of_birth' OR 
    application_data ? 'government_id' OR
    application_data ? 'convicted_felony' OR
    application_data ? 'felony_details'
  );

  -- Insert application
  INSERT INTO applications (
    job_listing_id,
    first_name,
    last_name,
    applicant_email,
    phone,
    city,
    state,
    zip,
    address_1,
    address_2,
    country,
    source,
    status,
    notes,
    exp,
    cdl,
    education_level,
    work_authorization,
    ssn,
    date_of_birth,
    government_id_type,
    government_id,
    convicted_felony,
    felony_details,
    employment_history,
    applied_at
  )
  VALUES (
    (application_data->>'job_listing_id')::UUID,
    application_data->>'first_name',
    application_data->>'last_name',
    application_data->>'applicant_email',
    application_data->>'phone',
    application_data->>'city',
    application_data->>'state',
    application_data->>'zip',
    application_data->>'address_1',
    application_data->>'address_2',
    COALESCE(application_data->>'country', 'US'),
    COALESCE(application_data->>'source', 'Direct'),
    COALESCE(application_data->>'status', 'pending'),
    application_data->>'notes',
    application_data->>'exp',
    application_data->>'cdl',
    application_data->>'education_level',
    application_data->>'work_authorization',
    application_data->>'ssn',
    (application_data->>'date_of_birth')::DATE,
    application_data->>'government_id_type',
    application_data->>'government_id',
    application_data->>'convicted_felony',
    application_data->>'felony_details',
    application_data->'employment_history',
    COALESCE((application_data->>'applied_at')::TIMESTAMPTZ, NOW())
  )
  RETURNING id INTO v_new_id;

  -- Log creation with appropriate sensitivity level
  IF v_has_pii THEN
    INSERT INTO audit_logs (
      user_id, organization_id, table_name, record_id, action, sensitive_fields
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      get_user_organization_id(),
      'applications',
      v_new_id,
      'CREATE_WITH_PII: ' || created_by_reason,
      ARRAY['ssn', 'date_of_birth', 'government_id', 'convicted_felony', 'felony_details']
    );
  ELSE
    INSERT INTO audit_logs (
      user_id, organization_id, table_name, record_id, action, sensitive_fields
    ) VALUES (
      COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID),
      get_user_organization_id(),
      'applications',
      v_new_id,
      'CREATE_BASIC: ' || created_by_reason,
      ARRAY['basic_info']
    );
  END IF;

  -- Return the created application
  SELECT to_jsonb(a.*) INTO v_result
  FROM applications a
  WHERE a.id = v_new_id;

  RETURN v_result;
END;
$$;

-- =====================================================
-- 4. Update Application with Audit Logging
-- =====================================================
CREATE OR REPLACE FUNCTION update_application_with_audit(
  application_id UUID,
  update_data JSONB,
  update_reason TEXT DEFAULT 'Application update'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_has_pii BOOLEAN;
  v_pii_fields TEXT[];
BEGIN
  -- Access control
  IF NOT (
    is_super_admin(auth.uid()) OR
    (has_role(auth.uid(), 'admin'::app_role) AND 
     EXISTS (
       SELECT 1 FROM applications a 
       JOIN job_listings jl ON a.job_listing_id = jl.id
       WHERE a.id = application_id 
       AND jl.organization_id = get_user_organization_id()
     )) OR
    EXISTS (
      SELECT 1 FROM applications a
      JOIN job_listings jl ON a.job_listing_id = jl.id
      WHERE a.id = application_id AND jl.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to update this application';
  END IF;

  -- Check if PII fields are being updated
  v_pii_fields := ARRAY[]::TEXT[];
  IF update_data ? 'ssn' THEN v_pii_fields := array_append(v_pii_fields, 'ssn'); END IF;
  IF update_data ? 'date_of_birth' THEN v_pii_fields := array_append(v_pii_fields, 'date_of_birth'); END IF;
  IF update_data ? 'government_id' THEN v_pii_fields := array_append(v_pii_fields, 'government_id'); END IF;
  IF update_data ? 'convicted_felony' THEN v_pii_fields := array_append(v_pii_fields, 'convicted_felony'); END IF;
  IF update_data ? 'felony_details' THEN v_pii_fields := array_append(v_pii_fields, 'felony_details'); END IF;
  
  v_has_pii := array_length(v_pii_fields, 1) > 0;

  -- If updating PII, require admin role
  IF v_has_pii AND NOT (is_super_admin(auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Only administrators can update sensitive PII fields';
  END IF;

  -- Perform update (only update fields that are present in update_data)
  UPDATE applications SET
    status = COALESCE((update_data->>'status'), status),
    notes = COALESCE((update_data->>'notes'), notes),
    recruiter_id = CASE WHEN update_data ? 'recruiter_id' THEN (update_data->>'recruiter_id')::UUID ELSE recruiter_id END,
    first_name = COALESCE((update_data->>'first_name'), first_name),
    last_name = COALESCE((update_data->>'last_name'), last_name),
    applicant_email = COALESCE((update_data->>'applicant_email'), applicant_email),
    phone = COALESCE((update_data->>'phone'), phone),
    city = COALESCE((update_data->>'city'), city),
    state = COALESCE((update_data->>'state'), state),
    zip = COALESCE((update_data->>'zip'), zip),
    ssn = CASE WHEN update_data ? 'ssn' THEN (update_data->>'ssn') ELSE ssn END,
    date_of_birth = CASE WHEN update_data ? 'date_of_birth' THEN (update_data->>'date_of_birth')::DATE ELSE date_of_birth END,
    government_id = CASE WHEN update_data ? 'government_id' THEN (update_data->>'government_id') ELSE government_id END,
    convicted_felony = CASE WHEN update_data ? 'convicted_felony' THEN (update_data->>'convicted_felony') ELSE convicted_felony END,
    felony_details = CASE WHEN update_data ? 'felony_details' THEN (update_data->>'felony_details') ELSE felony_details END,
    updated_at = NOW()
  WHERE id = application_id;

  -- Log the update with appropriate sensitivity
  IF v_has_pii THEN
    INSERT INTO audit_logs (
      user_id, organization_id, table_name, record_id, action, sensitive_fields
    ) VALUES (
      auth.uid(),
      get_user_organization_id(),
      'applications',
      application_id,
      'UPDATE_PII: ' || update_reason,
      v_pii_fields
    );
  ELSE
    INSERT INTO audit_logs (
      user_id, organization_id, table_name, record_id, action, sensitive_fields
    ) VALUES (
      auth.uid(),
      get_user_organization_id(),
      'applications',
      application_id,
      'UPDATE_BASIC: ' || update_reason,
      ARRAY['basic_fields']
    );
  END IF;

  -- Return updated application
  SELECT to_jsonb(a.*) INTO v_result
  FROM applications a
  WHERE a.id = application_id;

  RETURN v_result;
END;
$$;

-- =====================================================
-- 5. Grant execute permissions
-- =====================================================
GRANT EXECUTE ON FUNCTION get_applications_list_with_audit(JSONB, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_application_with_audit(UUID, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION create_application_with_audit(JSONB, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION update_application_with_audit(UUID, JSONB, TEXT) TO authenticated;

-- =====================================================
-- 6. Create index on audit_logs for performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_lookup 
  ON audit_logs(table_name, record_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_activity 
  ON audit_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_sensitive_access 
  ON audit_logs(created_at DESC) 
  WHERE action LIKE '%PII%';