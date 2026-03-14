
CREATE OR REPLACE FUNCTION public.can_access_sensitive_applicant_data(app_job_listing_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  job_org_id uuid;
BEGIN
  -- Get the job's organization
  SELECT organization_id INTO job_org_id
  FROM job_listings
  WHERE id = app_job_listing_id;
  
  -- Super admins can always access
  IF is_super_admin(auth.uid()) THEN
    RETURN true;
  END IF;
  
  -- Org admins in the same org can access (using user_roles table via has_role)
  IF has_role(auth.uid(), 'admin'::app_role) AND get_user_organization_id() = job_org_id THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$function$;
