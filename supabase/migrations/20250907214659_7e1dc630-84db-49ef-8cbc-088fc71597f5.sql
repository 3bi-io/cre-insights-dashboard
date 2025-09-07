-- Assign admin role to user and ensure profile/org linkage

-- Ensure profile exists and link to CR England org
WITH u AS (
  SELECT id, email FROM auth.users WHERE email = 'codyforbes@gmail.com'
), o AS (
  SELECT id AS org_id FROM public.organizations WHERE slug = 'cr-england'
)
INSERT INTO public.profiles (id, email, full_name, organization_id)
SELECT u.id, u.email, u.email, o.org_id
FROM u, o
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- Update profile organization if different or null
UPDATE public.profiles p
SET organization_id = o.org_id, updated_at = now()
FROM (
  SELECT id AS org_id FROM public.organizations WHERE slug = 'cr-england'
) o
WHERE p.id = (SELECT id FROM auth.users WHERE email = 'codyforbes@gmail.com' LIMIT 1)
  AND (p.organization_id IS DISTINCT FROM o.org_id);

-- Grant admin role for CR England organization (idempotent)
WITH u AS (
  SELECT id FROM auth.users WHERE email = 'codyforbes@gmail.com'
), o AS (
  SELECT id AS org_id FROM public.organizations WHERE slug = 'cr-england'
)
INSERT INTO public.user_roles (user_id, role, organization_id)
SELECT u.id, 'admin'::app_role, o.org_id
FROM u, o
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = u.id 
    AND ur.role = 'admin'::app_role 
    AND ur.organization_id = o.org_id
);

-- Ensure get_current_user_role returns highest-precedence role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT COALESCE(
    (SELECT 'super_admin'::app_role WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin')),
    (SELECT 'admin'::app_role WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')),
    (SELECT 'moderator'::app_role WHERE EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'moderator')),
    'user'::app_role
  )
$$;