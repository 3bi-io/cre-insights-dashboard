-- Add function to associate applications with organizations based on job listings
CREATE OR REPLACE FUNCTION public.get_application_organization_id(_application_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jl.organization_id 
  FROM applications a
  JOIN job_listings jl ON a.job_listing_id = jl.id
  WHERE a.id = _application_id
  LIMIT 1
$$;

-- Add function to get applications for a specific organization
CREATE OR REPLACE FUNCTION public.get_organization_applications(_org_id uuid, _limit integer DEFAULT 50, _offset integer DEFAULT 0)
RETURNS TABLE(
  id uuid,
  job_listing_id uuid,
  first_name text,
  last_name text,
  applicant_email text,
  phone text,
  status text,
  applied_at timestamp with time zone,
  job_title text,
  organization_name text
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
    jl.title as job_title,
    o.name as organization_name
  FROM applications a
  JOIN job_listings jl ON a.job_listing_id = jl.id
  JOIN organizations o ON jl.organization_id = o.id
  WHERE jl.organization_id = _org_id
  ORDER BY a.applied_at DESC
  LIMIT _limit OFFSET _offset
$$;

-- Update RLS policies for applications to ensure proper organization filtering
DROP POLICY IF EXISTS "Organization members can view applications in their org" ON applications;