
-- Helper function to check client assignment
CREATE OR REPLACE FUNCTION public.is_assigned_to_client(_user_id uuid, _client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_client_assignments
    WHERE user_id = _user_id
      AND client_id = _client_id
  )
$$;

-- RLS policy on user_client_assignments
CREATE POLICY "client_users_read_own_assignments"
ON public.user_client_assignments
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- RLS on clients for client-role users
CREATE POLICY "client_role_users_read_assigned_clients"
ON public.clients
FOR SELECT
TO authenticated
USING (
  public.is_assigned_to_client(auth.uid(), id)
);

-- RLS on job_listings for client-role users
CREATE POLICY "client_role_users_read_assigned_jobs"
ON public.job_listings
FOR SELECT
TO authenticated
USING (
  client_id IS NOT NULL AND public.is_assigned_to_client(auth.uid(), client_id)
);

-- RLS on applications for client-role users
CREATE POLICY "client_role_users_read_assigned_applications"
ON public.applications
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.job_listings jl
    WHERE jl.id = job_listing_id
      AND jl.client_id IS NOT NULL
      AND public.is_assigned_to_client(auth.uid(), jl.client_id)
  )
);

-- Update get_current_user_role to detect client role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT COALESCE(
    (SELECT 'super_admin'::text WHERE EXISTS (
      SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'c@3bi.io'
    ) OR EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'::app_role
    )),
    (SELECT 'admin'::text WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'::app_role
    )),
    (SELECT 'moderator'::text WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'moderator'::app_role
    )),
    (SELECT 'recruiter'::text WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'recruiter'::app_role
    )),
    (SELECT 'client'::text WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'client'::app_role
    )),
    'user'::text
  )
$function$;
