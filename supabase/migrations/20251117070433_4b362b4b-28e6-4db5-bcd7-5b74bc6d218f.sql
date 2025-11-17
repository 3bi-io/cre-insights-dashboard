-- Update get_applications_list_with_audit to support webhook filtering
CREATE OR REPLACE FUNCTION public.get_applications_list_with_audit(
  filters jsonb DEFAULT '{}'::jsonb,
  access_reason text DEFAULT 'Application list review'::text
)
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
  zip text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  job_title text,
  job_location text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_job_id UUID;
  v_status TEXT;
  v_city TEXT;
  v_state TEXT;
  v_search TEXT;
  v_organization_id UUID;
  v_webhook_id TEXT;
  v_limit INT;
  v_offset INT;
BEGIN
  -- Access control check
  IF NOT (
    is_super_admin(auth.uid()) OR 
    has_role(auth.uid(), 'admin'::app_role) OR
    has_role(auth.uid(), 'moderator'::app_role)
  ) THEN
    RAISE EXCEPTION 'Insufficient privileges to access application data';
  END IF;

  -- Log access
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

  -- Extract parameters
  v_job_id := (filters->>'job_id')::UUID;
  v_status := filters->>'status';
  v_city := filters->>'city';
  v_state := filters->>'state';
  v_search := filters->>'search';
  v_organization_id := (filters->>'organization_id')::UUID;
  v_webhook_id := filters->>'webhook_id';
  v_limit := COALESCE((filters->>'limit')::INT, 200);
  v_offset := COALESCE((filters->>'offset')::INT, 0);

  -- Return filtered applications
  RETURN QUERY
  WITH filtered_apps AS (
    SELECT DISTINCT
      a.id, a.job_listing_id, a.first_name, a.last_name,
      a.applicant_email, a.phone, a.status, a.applied_at,
      a.source, a.notes, a.exp, a.cdl, a.education_level,
      a.work_authorization, a.city, a.state, a.zip,
      a.created_at, a.updated_at,
      jl.title as job_title,
      jl.location as job_location
    FROM applications a
    JOIN job_listings jl ON a.job_listing_id = jl.id
    LEFT JOIN client_webhook_logs cwl ON cwl.application_id = a.id
    WHERE 
      (v_job_id IS NULL OR a.job_listing_id = v_job_id) AND
      (v_status IS NULL OR a.status = v_status) AND
      (v_city IS NULL OR a.city ILIKE '%' || v_city || '%') AND
      (v_state IS NULL OR a.state = v_state) AND
      (v_organization_id IS NULL OR jl.organization_id = v_organization_id) AND
      (v_search IS NULL OR 
        a.first_name ILIKE '%' || v_search || '%' OR
        a.last_name ILIKE '%' || v_search || '%' OR
        a.applicant_email ILIKE '%' || v_search || '%'
      ) AND
      -- Webhook filter logic: 'direct' = Direct Application with no webhook logs, else filter by webhook_id
      (
        v_webhook_id IS NULL OR
        (v_webhook_id = 'direct' AND a.source = 'Direct Application' AND cwl.id IS NULL) OR
        (v_webhook_id != 'direct' AND cwl.webhook_id = v_webhook_id::UUID)
      ) AND
      -- RLS check
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
    SELECT COUNT(DISTINCT a.id) as count
    FROM applications a
    JOIN job_listings jl ON a.job_listing_id = jl.id
    LEFT JOIN client_webhook_logs cwl ON cwl.application_id = a.id
    WHERE 
      (v_job_id IS NULL OR a.job_listing_id = v_job_id) AND
      (v_status IS NULL OR a.status = v_status) AND
      (v_city IS NULL OR a.city ILIKE '%' || v_city || '%') AND
      (v_state IS NULL OR a.state = v_state) AND
      (v_organization_id IS NULL OR jl.organization_id = v_organization_id) AND
      (v_search IS NULL OR 
        a.first_name ILIKE '%' || v_search || '%' OR
        a.last_name ILIKE '%' || v_search || '%' OR
        a.applicant_email ILIKE '%' || v_search || '%'
      ) AND
      (
        v_webhook_id IS NULL OR
        (v_webhook_id = 'direct' AND a.source = 'Direct Application' AND cwl.id IS NULL) OR
        (v_webhook_id != 'direct' AND cwl.webhook_id = v_webhook_id::UUID)
      ) AND
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
$function$;