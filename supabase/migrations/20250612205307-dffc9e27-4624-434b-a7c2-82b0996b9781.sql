
-- Add wayne.cederholm@crengland.com as an admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'wayne.cederholm@crengland.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Update the existing admin insertion to include all three administrators
-- First, remove any existing admin roles for these users to avoid conflicts
DELETE FROM public.user_roles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email IN ('c@3bi.io', 'ken.munck@crengland.com', 'wayne.cederholm@crengland.com')
) AND role = 'admin';

-- Then insert all three as admins
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email IN ('c@3bi.io', 'ken.munck@crengland.com', 'wayne.cederholm@crengland.com')
ON CONFLICT (user_id, role) DO NOTHING;
