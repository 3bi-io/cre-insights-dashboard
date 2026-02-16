
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id
      AND ur.role = _role
      AND (
        -- Match org-scoped roles
        ur.organization_id = (
          SELECT organization_id FROM public.profiles WHERE id = _user_id
        )
        -- Also match org-independent roles (NULL org_id, e.g. super_admin)
        OR ur.organization_id IS NULL
      )
  )
$function$;
